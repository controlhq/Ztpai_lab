const DEFAULT_ROOMS = [
  { id: 1, buildingId: 1, name: 'A101', capacity: 30 },
  { id: 2, buildingId: 1, name: 'B202', capacity: 15 },
  { id: 3, buildingId: 2, name: 'C303', capacity: 50 },
  { id: 4, buildingId: 2, name: 'D404', capacity: 8 },
];

function createRoomsRepository({ rooms: initialRooms = DEFAULT_ROOMS } = {}) {
  const rooms = initialRooms.map((r) => ({ createdAt: '2026-01-01T00:00:00.000Z', ...r }));
  let nextId = rooms.reduce((max, r) => Math.max(max, r.id), 0) + 1;

  const findById = async (id) => {
    const room = rooms.find((r) => r.id === id);
    return room ? { ...room } : null;
  };

  return {
    async findAll() {
      return rooms.map((r) => ({ ...r }));
    },

    findById,

    // w pamięci nie ma współbieżnych transakcji, więc blokada nie jest potrzebna
    findByIdForUpdate: findById,

    async create({ buildingId, name, capacity }) {
      const room = {
        id: nextId++,
        buildingId,
        name,
        capacity,
        createdAt: new Date().toISOString(),
      };
      rooms.push(room);
      return { ...room };
    },
  };
}

module.exports = { createRoomsRepository };
