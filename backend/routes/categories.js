const router = require('express').Router();
const { getDb } = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/categories
router.get('/', (req, res) => {
  const db = getDb();
  const categories = db.prepare(`
    SELECT cat.*, COUNT(c.id) AS course_count
    FROM categories cat
    LEFT JOIN courses c ON c.category_id = cat.id AND c.status = 'published'
    GROUP BY cat.id ORDER BY cat.name
  `).all();
  res.json({ success: true, data: categories });
});

// POST /api/categories — admin only
router.post('/', authenticate, requireRole('admin'), (req, res) => {
  const db = getDb();
  const { name, slug, description, icon, color } = req.body;
  if (!name || !slug) return res.status(400).json({ success: false, message: 'Tên và slug là bắt buộc.' });

  const result = db.prepare('INSERT INTO categories (name, slug, description, icon, color) VALUES (?, ?, ?, ?, ?)').run(name, slug, description, icon, color || '#F97316');
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: cat });
});

module.exports = router;
