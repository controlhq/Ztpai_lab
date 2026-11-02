function createRoomsRepository() {
  const rooms = [
    { id: 1, name: 'A101', capacity: 30 },
    { id: 2, name: 'B202', capacity: 15 },
    { id: 3, name: 'C303', capacity: 50 },
    { id: 4, name: 'D404', capacity: 8 },
  ];

  return {
    async findAll() {
      return rooms.map((r) => ({ ...r }));
    },

    async findById(id) {
      const room = rooms.find((r) => r.id === id);
      return room ? { ...room } : null;
    },
  };
}

module.exports = { createRoomsRepository };
