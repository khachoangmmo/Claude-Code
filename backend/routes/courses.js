const router = require('express').Router();
const { getDb } = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatCourse(c) {
  return { ...c, is_featured: Boolean(c.is_featured) };
}

// GET /api/courses — public listing with filters
router.get('/', (req, res) => {
  const db = getDb();
  const { category, level, search, featured, limit = 12, page = 1 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = ["c.status = 'published'"];
  const params = [];

  if (category) { where.push('cat.slug = ?'); params.push(category); }
  if (level)    { where.push('c.level = ?');  params.push(level); }
  if (search)   { where.push("(c.title LIKE ? OR c.description LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }
  if (featured === '1') { where.push('c.is_featured = 1'); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`
    SELECT COUNT(*) AS cnt
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.id
    ${whereClause}
  `).get(...params).cnt;

  const courses = db.prepare(`
    SELECT c.*, cat.name AS category_name, cat.slug AS category_slug,
           u.name AS instructor_name, u.avatar AS instructor_avatar
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN users u ON c.instructor_id = u.id
    ${whereClause}
    ORDER BY c.is_featured DESC, c.enrolled_count DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({
    success: true,
    data: courses.map(formatCourse),
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
  });
});

// GET /api/courses/featured
router.get('/featured', (req, res) => {
  const db = getDb();
  const courses = db.prepare(`
    SELECT c.*, cat.name AS category_name, cat.slug AS category_slug,
           u.name AS instructor_name, u.avatar AS instructor_avatar
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN users u ON c.instructor_id = u.id
    WHERE c.status = 'published' AND c.is_featured = 1
    ORDER BY c.enrolled_count DESC LIMIT 4
  `).all();
  res.json({ success: true, data: courses.map(formatCourse) });
});

// GET /api/courses/:slug — public detail
router.get('/:slug', (req, res) => {
  const db = getDb();
  const course = db.prepare(`
    SELECT c.*, cat.name AS category_name, cat.slug AS category_slug,
           u.name AS instructor_name, u.avatar AS instructor_avatar, u.email AS instructor_email
    FROM courses c
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN users u ON c.instructor_id = u.id
    WHERE c.slug = ? AND c.status = 'published'
  `).get(req.params.slug);

  if (!course) return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học.' });

  // Curriculum (sections + lessons)
  const sections = db.prepare(`
    SELECT s.*, json_group_array(
      json_object(
        'id', l.id, 'title', l.title, 'type', l.type,
        'duration', l.duration, 'position', l.position, 'is_preview', l.is_preview
      ) ORDER BY l.position
    ) AS lessons_json
    FROM sections s
    LEFT JOIN lessons l ON l.section_id = s.id
    WHERE s.course_id = ?
    GROUP BY s.id ORDER BY s.position
  `).all(course.id);

  const curriculum = sections.map(s => ({
    ...s,
    lessons: JSON.parse(s.lessons_json).filter(l => l.id !== null).map(l => ({...l, is_preview: Boolean(l.is_preview)})),
    lessons_json: undefined,
  }));

  // Reviews
  const reviews = db.prepare(`
    SELECT r.*, u.name AS user_name, u.avatar AS user_avatar
    FROM reviews r JOIN users u ON r.user_id = u.id
    WHERE r.course_id = ?
    ORDER BY r.created_at DESC LIMIT 10
  `).all(course.id);

  res.json({ success: true, data: { ...formatCourse(course), curriculum, reviews } });
});

// POST /api/courses — admin/instructor create
router.post('/', authenticate, requireRole('admin', 'instructor'), (req, res) => {
  const db = getDb();
  const { title, slug, description, price, original_price, category_id, level, duration, thumbnail, preview_video } = req.body;

  if (!title || !slug || price === undefined) {
    return res.status(400).json({ success: false, message: 'Tiêu đề, slug và giá là bắt buộc.' });
  }

  const result = db.prepare(`
    INSERT INTO courses (title, slug, description, price, original_price, category_id,
      instructor_id, level, duration, thumbnail, preview_video)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, slug, description, price, original_price || null, category_id || null,
         req.user.id, level || 'beginner', duration || 0, thumbnail || null, preview_video || null);

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, message: 'Tạo khóa học thành công!', data: course });
});

// PUT /api/courses/:id — update
router.put('/:id', authenticate, requireRole('admin', 'instructor'), (req, res) => {
  const db = getDb();
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học.' });

  const { title, description, price, original_price, level, status, is_featured, thumbnail } = req.body;
  db.prepare(`
    UPDATE courses SET title=COALESCE(?,title), description=COALESCE(?,description),
      price=COALESCE(?,price), original_price=?, level=COALESCE(?,level),
      status=COALESCE(?,status), is_featured=COALESCE(?,is_featured),
      thumbnail=COALESCE(?,thumbnail), updated_at=datetime('now')
    WHERE id=?
  `).run(title, description, price, original_price ?? course.original_price, level, status, is_featured, thumbnail, req.params.id);

  const updated = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  res.json({ success: true, message: 'Cập nhật thành công!', data: updated });
});

// POST /api/courses/:id/enroll
router.post('/:id/enroll', authenticate, (req, res) => {
  const db = getDb();
  const course = db.prepare('SELECT * FROM courses WHERE id = ? AND status = "published"').get(req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học.' });

  const existing = db.prepare('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?').get(req.user.id, course.id);
  if (existing) return res.status(409).json({ success: false, message: 'Bạn đã đăng ký khóa học này rồi.' });

  db.prepare('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)').run(req.user.id, course.id);
  db.prepare('UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?').run(course.id);

  res.json({ success: true, message: 'Đăng ký khóa học thành công!' });
});

// GET /api/courses/:id/lessons/:lessonId — protected lesson content
router.get('/:id/lessons/:lessonId', authenticate, (req, res) => {
  const db = getDb();
  const enrolled = db.prepare('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?').get(req.user.id, req.params.id);
  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ? AND course_id = ?').get(req.params.lessonId, req.params.id);

  if (!lesson) return res.status(404).json({ success: false, message: 'Không tìm thấy bài học.' });
  if (!enrolled && !lesson.is_preview) {
    return res.status(403).json({ success: false, message: 'Vui lòng đăng ký khóa học để xem bài học này.' });
  }

  res.json({ success: true, data: lesson });
});

// POST /api/courses/:id/lessons/:lessonId/complete
router.post('/:id/lessons/:lessonId/complete', authenticate, (req, res) => {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO lesson_progress (user_id, lesson_id, course_id, completed)
    VALUES (?, ?, ?, 1)
  `).run(req.user.id, req.params.lessonId, req.params.id);

  const totalLessons = db.prepare('SELECT COUNT(*) AS cnt FROM lessons WHERE course_id = ?').get(req.params.id).cnt;
  const completedLessons = db.prepare(`
    SELECT COUNT(*) AS cnt FROM lesson_progress
    WHERE user_id = ? AND course_id = ? AND completed = 1
  `).get(req.user.id, req.params.id).cnt;

  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  db.prepare('UPDATE enrollments SET progress = ? WHERE user_id = ? AND course_id = ?').run(progress, req.user.id, req.params.id);

  if (progress === 100) {
    db.prepare('UPDATE enrollments SET completed_at = datetime("now") WHERE user_id = ? AND course_id = ?').run(req.user.id, req.params.id);
  }

  res.json({ success: true, progress });
});

// POST /api/courses/:id/review
router.post('/:id/review', authenticate, (req, res) => {
  const db = getDb();
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Đánh giá phải từ 1-5 sao.' });
  }

  const enrolled = db.prepare('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?').get(req.user.id, req.params.id);
  if (!enrolled) return res.status(403).json({ success: false, message: 'Bạn cần đăng ký khóa học trước khi đánh giá.' });

  db.prepare(`
    INSERT OR REPLACE INTO reviews (user_id, course_id, rating, comment)
    VALUES (?, ?, ?, ?)
  `).run(req.user.id, req.params.id, rating, comment || null);

  // Update course rating
  const stats = db.prepare('SELECT AVG(rating) AS avg, COUNT(*) AS cnt FROM reviews WHERE course_id = ?').get(req.params.id);
  db.prepare('UPDATE courses SET rating = ?, rating_count = ? WHERE id = ?').run(
    Math.round(stats.avg * 10) / 10, stats.cnt, req.params.id
  );

  res.json({ success: true, message: 'Cảm ơn bạn đã đánh giá!' });
});

module.exports = router;
