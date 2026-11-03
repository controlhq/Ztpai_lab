const { z } = require('zod');
const { positiveIntString } = require('../rooms/rooms.schemas');

const buildingIdParams = z.object({
  id: positiveIntString,
});

const createBuildingBody = z
  .object({
    name: z.string().trim().min(1).max(100),
    address: z.string().trim().min(1).max(255),
  })
  .strict();

module.exports = { buildingIdParams, createBuildingBody };