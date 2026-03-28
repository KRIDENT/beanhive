// ─────────────────────────────────────────────
// REWARDS REPOSITORY — Data access layer
// Owns: rewards table, rewards_transactions table
// ─────────────────────────────────────────────
const db = require('../../../shared/db');

const rewardsRepository = {
  findByUserId(userId) {
    return db.prepare(
      'SELECT id, user_id, stars, tier FROM rewards WHERE user_id = ?'
    ).get(userId);
  },

  create(userId) {
    return db.prepare(
      'INSERT INTO rewards (user_id, stars, tier) VALUES (?, 0, ?)'
    ).run(userId, 'green');
  },

  updateBalance(userId, stars, tier) {
    db.prepare(
      'UPDATE rewards SET stars = ?, tier = ? WHERE user_id = ?'
    ).run(stars, tier, userId);
  },

  logTransaction(userId, orderId, starsChange, type) {
    db.prepare(
      'INSERT INTO rewards_transactions (user_id, order_id, stars_change, type) VALUES (?, ?, ?, ?)'
    ).run(userId, orderId, starsChange, type);
  },

  getTransactionHistory(userId, limit = 20) {
    return db.prepare(
      'SELECT * FROM rewards_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    ).all(userId, limit);
  },

  getOrderCount(userId) {
    return db.prepare(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = ?'
    ).get(userId);
  },

  getFavoritesCount(userId) {
    return db.prepare(
      'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?'
    ).get(userId);
  }
};

module.exports = rewardsRepository;
