const { Router } = require('express');
const { validate } = require('../../middleware/validate');
const { buildingIdParams, createBuildingBody } = require('./buildings.schemas');

function createBuildingsRouter({ buildingsController }) {
  const router = Router();

  router.get('/', buildingsController.list);
  router.get('/:id', validate({ params: buildingIdParams }), buildingsController.getById);
  router.get('/:id/rooms', validate({ params: buildingIdParams }), buildingsController.listRooms);
  router.post('/', validate({ body: createBuildingBody }), buildingsController.create);

  return router;
}

module.exports = { createBuildingsRouter };