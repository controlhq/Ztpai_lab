const { toRoomResponse, toRoomDetailResponse } = require('./rooms.mapper');

function createRoomsController({ roomsService }) {
  return {
    async list(req, res) {
      const rooms = await roomsService.list();
      res.json(rooms.map(toRoomResponse));
    },

    async getById(req, res) {
      const room = await roomsService.getById(req.validated.params.id);
      res.json(toRoomDetailResponse(room));
    },

    async create(req, res) {
      const room = await roomsService.create(req.validated.body);
      res.status(201).json(toRoomResponse(room));
    },
  };
}

module.exports = { createRoomsController };
