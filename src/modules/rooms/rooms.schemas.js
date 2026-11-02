const { z } = require('zod');

const positiveIntString = z
  .string()
  .regex(/^\d{1,9}$/, 'must be a positive integer')
  .transform(Number)
  .refine((n) => n > 0, 'must be a positive integer');

const roomIdParams = z.object({
  id: positiveIntString,
});

module.exports = { roomIdParams, positiveIntString };
