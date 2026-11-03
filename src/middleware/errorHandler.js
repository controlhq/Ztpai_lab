const { AppError, NotFoundError } = require('../errors');

function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`, 'ROUTE_NOT_FOUND'));
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let details;

  if (err instanceof AppError) {
    status = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'Request body is not valid JSON';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request body too large';
  } else if( err.code == '23505'){
    status = 409;
    code = 'DUPLICATE_RESOURCE';
    message = 'Resource already exists';
  } else {
    // stack trace tylko do logów, nigdy do klienta
    console.error(`[${req.id}] Unhandled error: ${err.stack || err}`);
  }

  const error = { code, message };
  if (details !== undefined) error.details = details;
  error.requestId = req.id;

  res.status(status).json({ error });
}

module.exports = { notFoundHandler, errorHandler };
