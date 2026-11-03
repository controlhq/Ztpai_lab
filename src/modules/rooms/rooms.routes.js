const { Router } = require('express');
const { validate } = require('../../middleware/validate');
const { roomIdParams, createRoomBody } = require('./rooms.schemas');

function createRoomsRouter({ roomsController }) {
  const router = Router();

  router.get('/', roomsController.list);
  router.get('/:id', validate({ params: roomIdParams }), roomsController.getById);
  router.post('/', validate({ body: createRoomBody }), roomsController.create);

  return router;
}

module.exports = { createRoomsRouter };
