const { z } = require('zod');

const positiveIntString = z
  .string()
  .regex(/^\d{1,9}$/, 'must be a positive integer')
  .transform(Number)
  .refine((n) => n > 0, 'must be a positive integer');

const roomIdParams = z.object({
  id: positiveIntString,
});

const createRoomBody = z
  .object({
    buildingId: z.number().int().positive(),
    name: z.string().trim().min(1).max(50),
    capacity: z.number().int().positive(),
  })
  .strict();

module.exports = { roomIdParams, createRoomBody, positiveIntString  };
