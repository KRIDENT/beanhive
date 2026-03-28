// ─────────────────────────────────────────────
// AUTH MIDDLEWARE — Session-based authentication
// Defense in depth: verified at gateway AND service layer
// ─────────────────────────────────────────────

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Please sign in to continue.'
      },
      meta: {
        requestId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    });
  }
  next();
}

module.exports = requireAuth;
