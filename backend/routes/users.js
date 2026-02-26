const router = require('express').Router();
const { getDb } = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/users/me/enrollments — my courses
router.get('/me/enrollments', authenticate, (req, res) => {
  const db = getDb();
  const enrollments = db.prepare(`
    SELECT e.*, c.title, c.slug, c.thumbnail, c.level, c.duration,
           c.rating, cat.name AS category_name,
           u.name AS instructor_name
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN users u ON c.instructor_id = u.id
    WHERE e.user_id = ?
    ORDER BY e.enrolled_at DESC
  `).all(req.user.id);

  res.json({ success: true, data: enrollments });
});

// GET /api/users/me/progress/:courseId
router.get('/me/progress/:courseId', authenticate, (req, res) => {
  const db = getDb();
  const enrollment = db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').get(req.user.id, req.params.courseId);
  if (!enrollment) return res.status(404).json({ success: false, message: 'Bạn chưa đăng ký khóa học này.' });

  const completedLessons = db.prepare(`
    SELECT lesson_id FROM lesson_progress
    WHERE user_id = ? AND course_id = ? AND completed = 1
  `).all(req.user.id, req.params.courseId).map(r => r.lesson_id);

  res.json({ success: true, data: { ...enrollment, completed_lesson_ids: completedLessons } });
});

// GET /api/users — admin only
router.get('/', authenticate, requireRole('admin'), (req, res) => {
  const db = getDb();
  const { search, role, limit = 20, page = 1 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = [];
  const params = [];
  if (search) { where.push('(name LIKE ? OR email LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (role)   { where.push('role = ?'); params.push(role); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) AS cnt FROM users ${whereClause}`).get(...params).cnt;
  const users = db.prepare(`
    SELECT id, name, email, role, avatar, phone, created_at FROM users ${whereClause}
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ success: true, data: users, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
});

// GET /api/users/stats — admin dashboard stats
router.get('/stats', authenticate, requireRole('admin'), (req, res) => {
  const db = getDb();
  const totalUsers = db.prepare("SELECT COUNT(*) AS cnt FROM users WHERE role = 'student'").get().cnt;
  const totalCourses = db.prepare("SELECT COUNT(*) AS cnt FROM courses WHERE status = 'published'").get().cnt;
  const totalEnrollments = db.prepare('SELECT COUNT(*) AS cnt FROM enrollments').get().cnt;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(amount),0) AS total FROM orders WHERE status = 'paid'").get().total;

  const recentEnrollments = db.prepare(`
    SELECT e.enrolled_at, u.name AS user_name, c.title AS course_title
    FROM enrollments e JOIN users u ON e.user_id = u.id JOIN courses c ON e.course_id = c.id
    ORDER BY e.enrolled_at DESC LIMIT 5
  `).all();

  res.json({ success: true, data: { totalUsers, totalCourses, totalEnrollments, totalRevenue, recentEnrollments } });
});

module.exports = router;
