const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../errors');
const { JWT_ALGORITHM } = require('../modules/auth/auth.service');

function createAuthenticate({ jwtSecret }) {
  return function authenticate(req, res, next) {
    const header = req.get('Authorization');
    if (!header) {
      return next(new UnauthorizedError('Missing Authorization header', 'UNAUTHORIZED'));
    }

    const [scheme, token, ...rest] = header.split(' ');
    if (scheme !== 'Bearer' || !token || rest.length > 0) {
      return next(new UnauthorizedError('Authorization header must be: Bearer <token>', 'UNAUTHORIZED'));
    }

    try {
      // algorytm podany jawnie - token z alg "none" lub innym algorytmem zostanie odrzucony
      const payload = jwt.verify(token, jwtSecret, { algorithms: [JWT_ALGORITHM] });
      req.user = { id: Number(payload.sub), role: payload.role };
      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return next(new UnauthorizedError('Token expired', 'TOKEN_EXPIRED'));
      }
      next(new UnauthorizedError('Invalid token', 'INVALID_TOKEN'));
    }
  };
}

module.exports = { createAuthenticate };
