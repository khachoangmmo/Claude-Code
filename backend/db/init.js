const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'mrbo_elearning.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ───────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'student',  -- 'admin' | 'instructor' | 'student'
    avatar      TEXT,
    phone       TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    slug        TEXT    NOT NULL UNIQUE,
    description TEXT,
    icon        TEXT,
    color       TEXT    DEFAULT '#F97316'
  );

  CREATE TABLE IF NOT EXISTS courses (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT    NOT NULL,
    slug          TEXT    NOT NULL UNIQUE,
    description   TEXT,
    thumbnail     TEXT,
    preview_video TEXT,
    price         REAL    NOT NULL DEFAULT 0,
    original_price REAL,
    category_id   INTEGER REFERENCES categories(id),
    instructor_id INTEGER REFERENCES users(id),
    level         TEXT    DEFAULT 'beginner',  -- 'beginner' | 'intermediate' | 'advanced'
    duration      INTEGER DEFAULT 0,            -- total minutes
    status        TEXT    DEFAULT 'draft',      -- 'draft' | 'published'
    is_featured   INTEGER DEFAULT 0,
    enrolled_count INTEGER DEFAULT 0,
    rating        REAL    DEFAULT 0,
    rating_count  INTEGER DEFAULT 0,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sections (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    position    INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id  INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title       TEXT    NOT NULL,
    type        TEXT    NOT NULL DEFAULT 'video',  -- 'video' | 'text' | 'quiz'
    content     TEXT,
    video_url   TEXT,
    duration    INTEGER DEFAULT 0,  -- minutes
    position    INTEGER NOT NULL DEFAULT 0,
    is_preview  INTEGER DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    course_id   INTEGER NOT NULL REFERENCES courses(id),
    enrolled_at TEXT    NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    progress    INTEGER DEFAULT 0,  -- percentage 0-100
    UNIQUE(user_id, course_id)
  );

  CREATE TABLE IF NOT EXISTS lesson_progress (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    lesson_id   INTEGER NOT NULL REFERENCES lessons(id),
    course_id   INTEGER NOT NULL REFERENCES courses(id),
    completed   INTEGER DEFAULT 0,
    watched_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, lesson_id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    course_id   INTEGER NOT NULL REFERENCES courses(id),
    rating      INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, course_id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users(id),
    course_id     INTEGER NOT NULL REFERENCES courses(id),
    amount        REAL    NOT NULL,
    status        TEXT    NOT NULL DEFAULT 'pending',  -- 'pending' | 'paid' | 'failed' | 'refunded'
    payment_method TEXT,
    transaction_id TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// ─── Seed Data ────────────────────────────────────────────────────────────────
const seedCategories = db.prepare(`
  INSERT OR IGNORE INTO categories (name, slug, description, icon, color)
  VALUES (?, ?, ?, ?, ?)
`);

const categories = [
  ['Facebook Ads', 'facebook-ads', 'Quảng cáo Facebook cho bất động sản', 'fab fa-facebook', '#1877F2'],
  ['Google Ads', 'google-ads', 'Google Ads hiệu quả cho dự án BĐS', 'fab fa-google', '#4285F4'],
  ['TikTok Ads', 'tiktok-ads', 'TikTok Ads tiếp cận khách hàng trẻ', 'fab fa-tiktok', '#000000'],
  ['Zalo Ads', 'zalo-ads', 'Quảng cáo Zalo tiếp cận người Việt', 'fas fa-comment', '#0068FF'],
  ['Landing Page', 'landing-page', 'Thiết kế landing page chuyển đổi cao', 'fas fa-file-code', '#10B981'],
  ['Data & Analytics', 'data-analytics', 'Phân tích dữ liệu & tối ưu chiến dịch', 'fas fa-chart-bar', '#8B5CF6'],
];

categories.forEach(c => seedCategories.run(...c));

// Seed admin user
const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@mrboads.com');
if (!existingAdmin) {
  const hash = bcrypt.hashSync('Admin@123', 10);
  db.prepare(`
    INSERT INTO users (name, email, password, role, phone)
    VALUES (?, ?, ?, ?, ?)
  `).run('Mrbo Admin', 'admin@mrboads.com', hash, 'admin', '0900000000');
}

// Seed instructor
const existingInstructor = db.prepare('SELECT id FROM users WHERE email = ?').get('mrbo@mrboads.com');
if (!existingInstructor) {
  const hash = bcrypt.hashSync('Mrbo@123', 10);
  db.prepare(`
    INSERT INTO users (name, email, password, role, phone)
    VALUES (?, ?, ?, ?, ?)
  `).run('Mrbo Ads', 'mrbo@mrboads.com', hash, 'instructor', '0911234567');
}

// Seed sample courses
const instructor = db.prepare('SELECT id FROM users WHERE email = ?').get('mrbo@mrboads.com');
const catFb = db.prepare('SELECT id FROM categories WHERE slug = ?').get('facebook-ads');
const catGg = db.prepare('SELECT id FROM categories WHERE slug = ?').get('google-ads');
const catTk = db.prepare('SELECT id FROM categories WHERE slug = ?').get('tiktok-ads');

const sampleCourses = [
  {
    title: 'Facebook Ads Toàn Diện Cho Bất Động Sản 2024',
    slug: 'facebook-ads-bat-dong-san-2024',
    description: 'Khóa học Facebook Ads chuyên sâu dành riêng cho môi giới và chủ đầu tư bất động sản. Từ cơ bản đến nâng cao, tối ưu ngân sách, tạo leads chất lượng cao.',
    price: 2990000,
    original_price: 4990000,
    category_id: catFb.id,
    instructor_id: instructor.id,
    level: 'beginner',
    duration: 1200,
    status: 'published',
    is_featured: 1,
    enrolled_count: 1247,
    rating: 4.8,
    rating_count: 312,
    thumbnail: '/images/course-fb-ads.jpg',
  },
  {
    title: 'Google Ads BĐS: Tìm Kiếm & Display Chuyên Nghiệp',
    slug: 'google-ads-bds-tim-kiem-display',
    description: 'Chiến lược Google Ads tổng thể: Search, Display, Remarketing. Tối ưu CPC, tăng CVR cho các dự án bất động sản từ bình dân đến cao cấp.',
    price: 3490000,
    original_price: 5490000,
    category_id: catGg.id,
    instructor_id: instructor.id,
    level: 'intermediate',
    duration: 960,
    status: 'published',
    is_featured: 1,
    enrolled_count: 856,
    rating: 4.9,
    rating_count: 198,
    thumbnail: '/images/course-gg-ads.jpg',
  },
  {
    title: 'TikTok Ads BĐS: Viral Content & Chuyển Đổi Cao',
    slug: 'tiktok-ads-bds-viral-content',
    description: 'Khai thác sức mạnh TikTok để quảng bá dự án BĐS. Sáng tạo nội dung viral, chạy quảng cáo hiệu quả, xây dựng thương hiệu cá nhân trên TikTok.',
    price: 1990000,
    original_price: 3490000,
    category_id: catTk.id,
    instructor_id: instructor.id,
    level: 'beginner',
    duration: 720,
    status: 'published',
    is_featured: 0,
    enrolled_count: 2134,
    rating: 4.7,
    rating_count: 445,
    thumbnail: '/images/course-tiktok.jpg',
  },
  {
    title: 'Combo Performance Marketing BĐS: Bộ 3 Kênh Quảng Cáo',
    slug: 'combo-performance-marketing-bds',
    description: 'Chiến lược tổng thể kết hợp Facebook, Google và TikTok Ads. Đây là khóa học nâng cao dành cho các marketer BĐS muốn thành thạo đa kênh.',
    price: 5990000,
    original_price: 9990000,
    category_id: catFb.id,
    instructor_id: instructor.id,
    level: 'advanced',
    duration: 2400,
    status: 'published',
    is_featured: 1,
    enrolled_count: 423,
    rating: 5.0,
    rating_count: 87,
    thumbnail: '/images/course-combo.jpg',
  },
];

const insertCourse = db.prepare(`
  INSERT OR IGNORE INTO courses
    (title, slug, description, price, original_price, category_id, instructor_id,
     level, duration, status, is_featured, enrolled_count, rating, rating_count, thumbnail)
  VALUES
    (@title, @slug, @description, @price, @original_price, @category_id, @instructor_id,
     @level, @duration, @status, @is_featured, @enrolled_count, @rating, @rating_count, @thumbnail)
`);

sampleCourses.forEach(c => insertCourse.run(c));

// Seed sections & lessons for first course
const fbCourse = db.prepare('SELECT id FROM courses WHERE slug = ?').get('facebook-ads-bat-dong-san-2024');
if (fbCourse) {
  const existingSection = db.prepare('SELECT id FROM sections WHERE course_id = ?').get(fbCourse.id);
  if (!existingSection) {
    const insertSection = db.prepare('INSERT INTO sections (course_id, title, position) VALUES (?, ?, ?)');
    const insertLesson = db.prepare(`
      INSERT INTO lessons (section_id, course_id, title, type, video_url, duration, position, is_preview)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sections = [
      { title: 'Giới Thiệu Khóa Học', lessons: [
        { title: 'Tổng quan khóa học & lộ trình học', duration: 10, is_preview: 1 },
        { title: 'Tư duy Performance Marketing BĐS', duration: 20, is_preview: 1 },
      ]},
      { title: 'Nền Tảng Facebook Ads', lessons: [
        { title: 'Cài đặt Business Manager & Ad Account', duration: 30, is_preview: 0 },
        { title: 'Pixel Facebook: Cài đặt & Theo dõi sự kiện', duration: 45, is_preview: 0 },
        { title: 'Cấu trúc chiến dịch (Campaign - AdSet - Ad)', duration: 35, is_preview: 0 },
        { title: 'Đối tượng mục tiêu: Core, Custom & Lookalike', duration: 60, is_preview: 0 },
      ]},
      { title: 'Sáng Tạo Nội Dung Quảng Cáo BĐS', lessons: [
        { title: 'Copywriting cho quảng cáo BĐS', duration: 50, is_preview: 0 },
        { title: 'Thiết kế hình ảnh & video thu hút', duration: 40, is_preview: 0 },
        { title: 'Các format quảng cáo hiệu quả nhất', duration: 35, is_preview: 0 },
      ]},
      { title: 'Tối Ưu & Scale Chiến Dịch', lessons: [
        { title: 'Đọc hiểu số liệu & KPI cần theo dõi', duration: 45, is_preview: 0 },
        { title: 'A/B Testing: Phương pháp & thực hành', duration: 55, is_preview: 0 },
        { title: 'Scale budget an toàn & hiệu quả', duration: 40, is_preview: 0 },
        { title: 'Remarketing & Retargeting BĐS', duration: 50, is_preview: 0 },
      ]},
    ];

    sections.forEach((sec, sIdx) => {
      const secResult = insertSection.run(fbCourse.id, sec.title, sIdx);
      const secId = secResult.lastInsertRowid;
      sec.lessons.forEach((les, lIdx) => {
        insertLesson.run(secId, fbCourse.id, les.title, 'video', null, les.duration, lIdx, les.is_preview);
      });
    });
  }
}

console.log('✅ Database initialized and seeded successfully!');
db.close();
