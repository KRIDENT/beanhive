// ─────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// Catches unhandled exceptions at the controller
// boundary and maps them to standard error responses.
// Never exposes stack traces in API responses.
// ─────────────────────────────────────────────

function errorHandler(err, req, res, _next) {
  const correlationId = req.correlationId || 'unknown';

  // Structured JSON log
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    correlationId,
    userId: req.session ? req.session.userId : undefined,
    method: req.method,
    path: req.originalUrl,
    message: err.message,
    stack: err.stack
  }));

  const status = err.statusCode || 500;
  const code = err.errorCode || 'INTERNAL_ERROR';
  const message = status === 500
    ? 'Something went wrong. Please try again.'
    : err.message;

  res.status(status).json({
    error: {
      code,
      message
    },
    meta: {
      requestId: correlationId,
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = errorHandler;
