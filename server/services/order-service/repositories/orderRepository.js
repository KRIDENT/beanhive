// ─────────────────────────────────────────────
// ORDER REPOSITORY — Data access layer
// Owns: orders table
// ─────────────────────────────────────────────
const db = require('../../../shared/db');

const orderRepository = {
  create({ userId, items, subtotal, tax, total, status }) {
    const result = db.prepare(
      'INSERT INTO orders (user_id, items, subtotal, tax, total, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, JSON.stringify(items), subtotal, tax, total, status);
    return result.lastInsertRowid;
  },

  findById(orderId, userId) {
    return db.prepare(
      'SELECT id, user_id, items, subtotal, tax, total, status, created_at FROM orders WHERE id = ? AND user_id = ?'
    ).get(orderId, userId);
  },

  findByUserId(userId, limit = 20) {
    return db.prepare(
      'SELECT id, items, subtotal, tax, total, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    ).all(userId, limit);
  },

  updateStatus(orderId, status) {
    db.prepare(
      'UPDATE orders SET status = ? WHERE id = ?'
    ).run(status, orderId);
  },

  cancel(orderId) {
    db.prepare(
      'UPDATE orders SET status = ? WHERE id = ?'
    ).run('cancelled', orderId);
  }
};

module.exports = orderRepository;
