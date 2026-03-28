// ─────────────────────────────────────────────
// MENU REPOSITORY — Data access layer
// Owns: menu_items table
// ─────────────────────────────────────────────
const db = require('../../../shared/db');

const menuRepository = {
  findAll(category) {
    if (category) {
      return db.prepare(
        'SELECT * FROM menu_items WHERE category = ? ORDER BY name ASC'
      ).all(category);
    }
    return db.prepare('SELECT * FROM menu_items ORDER BY category ASC, name ASC').all();
  },

  findBySlug(slug) {
    return db.prepare('SELECT * FROM menu_items WHERE slug = ?').get(slug);
  },

  findById(id) {
    return db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
  },

  findFeatured() {
    return db.prepare('SELECT * FROM menu_items WHERE featured = 1 ORDER BY name ASC').all();
  },

  getCategories() {
    return db.prepare('SELECT DISTINCT category FROM menu_items ORDER BY category ASC').all();
  },

  create({ slug, name, category, description, price, calories, isFood, image, featured }) {
    const result = db.prepare(
      'INSERT INTO menu_items (slug, name, category, description, price, calories, is_food, image, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(slug, name, category, description || '', price, calories || 0, isFood ? 1 : 0, image || '', featured ? 1 : 0);
    return result.lastInsertRowid;
  },

  update(id, fields) {
    const sets = [];
    const values = [];
    for (const [key, val] of Object.entries(fields)) {
      sets.push(key + ' = ?');
      values.push(val);
    }
    values.push(id);
    db.prepare('UPDATE menu_items SET ' + sets.join(', ') + ' WHERE id = ?').run(...values);
  },

  updateImage(id, imagePath) {
    db.prepare('UPDATE menu_items SET image = ? WHERE id = ?').run(imagePath, id);
  },

  delete(id) {
    db.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
  }
};

module.exports = menuRepository;
