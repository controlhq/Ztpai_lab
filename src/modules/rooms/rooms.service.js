const { NotFoundError } = require('../../errors');

function createRoomsService({ roomsRepository, buildingsRepository  }) {
  return {
    async list() {
      return roomsRepository.findAll();
    },

    async getById(id) {
      const room = await roomsRepository.findById(id);
      if (!room) {
        throw new NotFoundError('Room not found', 'ROOM_NOT_FOUND');
      }
      return room;
    },

    async create({ buildingId, name, capacity }) {
      const building = await buildingsRepository.findById(buildingId);
      if (!building) {
        throw new NotFoundError('Building not found', 'BUILDING_NOT_FOUND');
      }
      return roomsRepository.create({ buildingId, name, capacity });
    },
  };
}

module.exports = { createRoomsService };
