const { toBuildingResponse } = require('./buildings.mapper');
const { toRoomResponse } = require('../rooms/rooms.mapper');

function createBuildingsController({ buildingsService }) {
  return {
    async list(req, res) {
      const buildings = await buildingsService.list();
      res.json(buildings.map(toBuildingResponse));
    },

    async getById(req, res) {
      const building = await buildingsService.getById(req.validated.params.id);
      res.json(toBuildingResponse(building));
    },

    async create(req, res) {
      const building = await buildingsService.create(req.validated.body);
      res.status(201).json(toBuildingResponse(building));
    },

    async listRooms(req, res) {
      const rooms = await buildingsService.listRooms(req.validated.params.id);
      res.json(rooms.map(toRoomResponse));
    },
  };
}

module.exports = { createBuildingsController };