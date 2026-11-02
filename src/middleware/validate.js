const { ValidationError } = require('../errors');

const LOCATIONS = ['params', 'query', 'body'];

// validate({ params, query, body }) - każdy argument to opcjonalny schemat Zod.
// Wynik trafia do req.validated (req.query w Express 5 jest tylko do odczytu).
function validate(schemas = {}) {
  return (req, res, next) => {
    const details = [];
    const validated = {};

    for (const location of LOCATIONS) {
      const schema = schemas[location];
      if (!schema) continue;

      const result = schema.safeParse(req[location] ?? {});
      if (result.success) {
        validated[location] = result.data;
        continue;
      }

      for (const issue of result.error.issues) {
        if (issue.code === 'unrecognized_keys') {
          for (const key of issue.keys) {
            details.push({
              location,
              field: [...issue.path, key].join('.'),
              message: 'Unknown field',
            });
          }
        } else {
          details.push({
            location,
            field: issue.path.join('.'),
            message: issue.message,
          });
        }
      }
    }

    if (details.length > 0) {
      return next(new ValidationError(details));
    }

    req.validated = validated;
    next();
  };
}

module.exports = { validate };
