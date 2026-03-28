// ─────────────────────────────────────────────
// REQUEST LOGGER — Structured JSON logging
// All requests logged with correlation ID.
// ─────────────────────────────────────────────

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO',
      correlationId: req.correlationId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      userId: req.session ? req.session.userId : undefined
    };

    // Only log API requests, not static file serving
    if (req.originalUrl.startsWith('/v1/') || req.originalUrl.startsWith('/health')) {
      console.log(JSON.stringify(log));
    }
  });

  next();
}

module.exports = requestLogger;
