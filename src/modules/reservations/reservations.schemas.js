const { z } = require('zod');
const { positiveIntString } = require('../rooms/rooms.schemas');

const isoDateWithTimezone = z.string().datetime({
  offset: true,
  message: 'must be an ISO 8601 date with timezone, e.g. 2026-11-10T10:00:00Z or 2026-11-10T10:00:00+01:00',
});

// strictObject odrzuca nieznane pola (np. status, id, internalNote, userId, reservedBy)
// właściciel rezerwacji pochodzi wyłącznie z tokenu
const createReservationBody = z.strictObject({
  roomId: z.number().int().positive(),
  participants: z.number().int().positive(),
  startTime: isoDateWithTimezone,
  endTime: isoDateWithTimezone,
});

const SORT_VALUES = [
  'startTime', '-startTime',
  'createdAt', '-createdAt',
  'participants', '-participants',
];

const limitParam = z
  .string()
  .regex(/^\d{1,9}$/, 'must be an integer between 1 and 100')
  .transform(Number)
  .refine((n) => n >= 1 && n <= 100, 'must be an integer between 1 and 100');

const reservationIdParams = z.object({
  id: positiveIntString,
});

const listReservationsQuery = z
  .object({
    roomId: positiveIntString.optional(),
    buildingId: positiveIntString.optional(),
    userId: positiveIntString.optional(),
    status: z.enum(['CONFIRMED', 'CANCELLED']).optional(),
    from: isoDateWithTimezone.optional(),
    to: isoDateWithTimezone.optional(),
    page: positiveIntString.optional(),
    limit: limitParam.optional(),
    sort: z.enum(SORT_VALUES).optional(),
  })
  .refine((q) => !q.from || !q.to || new Date(q.from) < new Date(q.to), {
    message: 'from must be earlier than to',
    path: ['to'],
  });

module.exports = { createReservationBody, reservationIdParams, listReservationsQuery };
