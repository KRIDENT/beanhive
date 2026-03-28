// ─────────────────────────────────────────────
// ADMIN REPOSITORY — Aggregate data access
// Cross-service read queries for the admin dashboard.
// ─────────────────────────────────────────────
const db = require('../../../shared/db');

const adminRepository = {
  countUsers() {
    return db.prepare('SELECT COUNT(*) as count FROM users').get();
  },

  countOrders() {
    return db.prepare('SELECT COUNT(*) as count FROM orders').get();
  },

  sumRevenue() {
    return db.prepare('SELECT COALESCE(SUM(total), 0) as total FROM orders').get();
  },

  findAllUsers() {
    return db.prepare(
      'SELECT id, first_name, last_name, email, role, created_at FROM users ORDER BY created_at DESC'
    ).all();
  },

  updateRole(userId, role) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
  },

  findUserById(userId) {
    return db.prepare('SELECT id, first_name, last_name, email, role FROM users WHERE id = ?').get(userId);
  },

  findAllOrders(limit = 50) {
    return db.prepare(
      `SELECT o.id, o.user_id, o.items, o.subtotal, o.tax, o.total, o.status, o.created_at,
              u.first_name, u.last_name, u.email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT ?`
    ).all(limit);
  },

  // ── Analytics queries ────────────────────────

  // Revenue per day for the last N days
  revenueByDay(days = 30) {
    return db.prepare(
      `SELECT DATE(created_at) as date, SUM(total) as revenue, COUNT(*) as orders
       FROM orders
       WHERE created_at >= DATE('now', '-' || ? || ' days')
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    ).all(days);
  },

  // Order counts grouped by status
  ordersByStatus() {
    return db.prepare(
      `SELECT status, COUNT(*) as count FROM orders GROUP BY status`
    ).all();
  },

  // Top selling items (parsed from JSON items column)
  // Returns all orders so the service layer can aggregate item names
  allOrderItems(days = 30) {
    return db.prepare(
      `SELECT items FROM orders WHERE created_at >= DATE('now', '-' || ? || ' days')`
    ).all(days);
  },

  // New users per day for the last N days
  usersByDay(days = 30) {
    return db.prepare(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users
       WHERE created_at >= DATE('now', '-' || ? || ' days')
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    ).all(days);
  },

  // Revenue summary: today, this week, this month
  revenueSummary() {
    return db.prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN DATE(created_at) = DATE('now') THEN total ELSE 0 END), 0) as today,
         COALESCE(SUM(CASE WHEN created_at >= DATE('now', '-7 days') THEN total ELSE 0 END), 0) as week,
         COALESCE(SUM(CASE WHEN created_at >= DATE('now', '-30 days') THEN total ELSE 0 END), 0) as month,
         COALESCE(SUM(total), 0) as allTime
       FROM orders`
    ).get();
  }
};

module.exports = adminRepository;
