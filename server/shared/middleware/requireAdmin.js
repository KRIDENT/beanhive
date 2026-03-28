// ─────────────────────────────────────────────
// ADMIN MIDDLEWARE — Role-based authorization
// Must be placed AFTER requireAuth in chain.
// Queries DB on every request for defense in
// depth — demoting a user takes effect immediately.
// ─────────────────────────────────────────────
const db = require('../db');

function requireAdmin(req, res, next) {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);

  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required.'
      },
      meta: {
        requestId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    });
  }
  next();
}

module.exports = requireAdmin;
