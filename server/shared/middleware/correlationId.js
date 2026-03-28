// ─────────────────────────────────────────────
// CORRELATION ID MIDDLEWARE
// Every request receives a unique X-Correlation-ID
// for end-to-end trace reconstruction.
// ─────────────────────────────────────────────
const crypto = require('crypto');

function correlationId(req, res, next) {
  const id = req.headers['x-correlation-id'] || crypto.randomUUID();
  req.correlationId = id;
  res.setHeader('X-Correlation-ID', id);
  next();
}

module.exports = correlationId;
