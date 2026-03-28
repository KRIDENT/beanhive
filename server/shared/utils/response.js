// ─────────────────────────────────────────────
// STANDARD RESPONSE HELPERS
// All APIs follow consistent response shapes
// per the architecture spec (section 4.2).
// ─────────────────────────────────────────────

function success(res, data, statusCode = 200, req = null) {
  return res.status(statusCode).json({
    data,
    meta: {
      requestId: req ? req.correlationId : undefined,
      timestamp: new Date().toISOString()
    }
  });
}

function created(res, data, req = null) {
  return success(res, data, 201, req);
}

function error(res, statusCode, code, message, req = null, details = null) {
  const body = {
    error: {
      code,
      message
    },
    meta: {
      requestId: req ? req.correlationId : undefined,
      timestamp: new Date().toISOString()
    }
  };
  if (details) body.error.details = details;
  return res.status(statusCode).json(body);
}

function badRequest(res, message, req = null) {
  return error(res, 400, 'BAD_REQUEST', message, req);
}

function unauthorized(res, message = 'Please sign in to continue.', req = null) {
  return error(res, 401, 'UNAUTHENTICATED', message, req);
}

function forbidden(res, message = 'You do not have permission to perform this action.', req = null) {
  return error(res, 403, 'FORBIDDEN', message, req);
}

function notFound(res, message = 'The requested resource does not exist.', req = null) {
  return error(res, 404, 'RESOURCE_NOT_FOUND', message, req);
}

function conflict(res, message, req = null) {
  return error(res, 409, 'CONFLICT', message, req);
}

function serverError(res, req = null) {
  return error(res, 500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.', req);
}

module.exports = {
  success,
  created,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  serverError
};
