const { NotFoundError } = require('../../errors');

function createBuildingsService({ buildingsRepository }) {
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
  };
}

module.exports = { createBuildingsService };