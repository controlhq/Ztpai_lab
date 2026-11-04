const { ForbiddenError } = require('../errors');

// użycie po authenticate: authorize('ADMIN')
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError());
    }
    next();
  };
}

module.exports = { authorize };
