const { NotFoundError } = require('../../errors');

function createBuildingsService({ buildingsRepository, roomsRepository }) {
  return {
    async list() {
      return buildingsRepository.findAll();
    },
    async getById(id) {
      const building = await buildingsRepository.findById(id);
      if (!building) {
        throw new NotFoundError('Building not found', 'BUILDING_NOT_FOUND');
      }
      return building;
    },
    async create({ name, address }) {
      return buildingsRepository.create({ name, address });
    },
    async listRooms(id) {
      const building = await buildingsRepository.findById(id);
      if (!building) {
        throw new NotFoundError('Building not found', 'BUILDING_NOT_FOUND');
      }
      return roomsRepository.findByBuildingId(id);
    },
  };
}

module.exports = { createBuildingsService };