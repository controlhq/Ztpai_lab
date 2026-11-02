const { NotFoundError } = require('../../errors');

function createRoomsService({ roomsRepository }) {
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
  };
}

module.exports = { createRoomsService };
