const { z } = require('zod');
const { positiveIntString } = require('../rooms/rooms.schemas');

const isoDateWithTimezone = z.string().datetime({
  offset: true,
  message: 'must be an ISO 8601 date with timezone, e.g. 2026-11-10T10:00:00Z or 2026-11-10T10:00:00+01:00',
});

// strictObject odrzuca nieznane pola (np. status, id, internalNote)
const createReservationBody = z.strictObject({
  roomId: z.number().int().positive(),
  reservedBy: z.string().trim().min(3).max(100),
  participants: z.number().int().positive(),
  startTime: isoDateWithTimezone,
  endTime: isoDateWithTimezone,
});

const reservationIdParams = z.object({
  id: positiveIntString,
});

const listReservationsQuery = z.object({
  roomId: positiveIntString.optional(),
});

module.exports = { createReservationBody, reservationIdParams, listReservationsQuery };
