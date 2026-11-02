const { randomUUID } = require('crypto');

const SAFE_ID = /^[\w.-]{1,128}$/;

function requestLogger(req, res, next) {
  const incoming = req.get('X-Request-Id');
  const requestId = incoming && SAFE_ID.test(incoming) ? incoming : randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
    console.log(
      `[${requestId}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms.toFixed(1)} ms)`
    );
  });

  next();
}

module.exports = { requestLogger };
