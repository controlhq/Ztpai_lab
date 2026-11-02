function createReservationsRepository({ seed = true } = {}) {
  const reservations = [];
  let nextId = 1;

  if (seed) {
    reservations.push({
      id: nextId++,
      roomId: 4,
      reservedBy: 'Seed User',
      participants: 5,
      startTime: '2026-01-10T10:00:00.000Z',
      endTime: '2026-01-10T12:00:00.000Z',
      status: 'CONFIRMED',
      createdAt: '2026-01-05T08:00:00.000Z',
      cancelledAt: null,
      internalNote: 'seed: reservation that has already started',
    });
  }

  return {
    async findAll() {
      return reservations.map((r) => ({ ...r }));
    },

    async findByRoomId(roomId) {
      return reservations.filter((r) => r.roomId === roomId).map((r) => ({ ...r }));
    },

    async findById(id) {
      const reservation = reservations.find((r) => r.id === id);
      return reservation ? { ...reservation } : null;
    },

    async create(data) {
      const reservation = { id: nextId++, ...data };
      reservations.push(reservation);
      return { ...reservation };
    },

    async update(id, patch) {
      const reservation = reservations.find((r) => r.id === id);
      if (!reservation) return null;
      Object.assign(reservation, patch);
      return { ...reservation };
    },
  };
}

module.exports = { createReservationsRepository };
