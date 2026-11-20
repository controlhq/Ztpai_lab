const { z } = require('zod');
const { positiveIntString } = require('../rooms/rooms.schemas');
const { limitParam } = require('../reservations/reservations.schemas');
const { EVENTS } = require('../../events/eventBus');

const listAuditLogQuery = z.object({
  eventType: z.enum(Object.values(EVENTS)).optional(),
  page: positiveIntString.optional(),
  limit: limitParam.optional(),
});

module.exports = { listAuditLogQuery };
