const { toBuildingResponse } = require('./buildings.mapper');

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
  };
}

module.exports = { createBuildingsController };