// ─────────────────────────────────────────────
// FAVORITES REPOSITORY — Data access layer
// Owns: favorites table
// ─────────────────────────────────────────────
const db = require('../../../shared/db');

const favoritesRepository = {
  findByUserId(userId) {
    return db.prepare(
      'SELECT f.id, f.drink_id, f.drink_name, f.created_at, m.image FROM favorites f LEFT JOIN menu_items m ON f.drink_id = m.slug WHERE f.user_id = ? ORDER BY f.created_at DESC'
    ).all(userId);
  },

  findByUserAndDrink(userId, drinkId) {
    return db.prepare(
      'SELECT id FROM favorites WHERE user_id = ? AND drink_id = ?'
    ).get(userId, drinkId);
  },

  create(userId, drinkId, drinkName) {
    const result = db.prepare(
      'INSERT INTO favorites (user_id, drink_id, drink_name) VALUES (?, ?, ?)'
    ).run(userId, drinkId, drinkName);
    return result.lastInsertRowid;
  },

  delete(userId, drinkId) {
    const result = db.prepare(
      'DELETE FROM favorites WHERE user_id = ? AND drink_id = ?'
    ).run(userId, drinkId);
    return result.changes;
  }
};

module.exports = favoritesRepository;
