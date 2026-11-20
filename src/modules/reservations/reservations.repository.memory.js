const SORT_FIELDS = ['startTime', 'createdAt', 'participants'];

function matches(r, { roomId, userId, status, from, to }) {
  if (roomId !== undefined && r.roomId !== roomId) return false;
  if (userId !== undefined && r.userId !== userId) return false;
  if (status !== undefined && r.status !== status) return false;
  if (to !== undefined && !(new Date(r.startTime) < new Date(to))) return false;
  if (from !== undefined && !(new Date(r.endTime) > new Date(from))) return false;
  return true;
}

function createReservationsRepository({ reservations: initial = [] } = {}) {
  const reservations = initial.map((r) => ({ ...r }));
  let nextId = reservations.reduce((max, r) => Math.max(max, r.id), 0) + 1;

  const detailed = (r) => ({ ...r, room: { id: r.roomId }, user: { id: r.userId } });

  return {
    async findPage({ filters = {}, sort = 'startTime', page = 1, limit = 20 }) {
      const desc = sort.startsWith('-');
      const field = desc ? sort.slice(1) : sort;
      if (!SORT_FIELDS.includes(field)) throw new Error(`Unsupported sort: ${sort}`);

      const filtered = reservations
        .filter((r) => matches(r, filters))
        .sort((a, b) => {
          if (a[field] < b[field]) return desc ? 1 : -1;
          if (a[field] > b[field]) return desc ? -1 : 1;
          return a.id - b.id;
        });

      const rows = filtered.slice((page - 1) * limit, page * limit).map(detailed);
      return { rows, total: filtered.length };
    },

    async findByIdDetailed(id) {
      const reservation = reservations.find((r) => r.id === id);
      return reservation ? detailed(reservation) : null;
    },

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

    // w pamięci nie ma współbieżnych transakcji - blokada niepotrzebna
    async findByIdForUpdate(id) {
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

// odpowiednik createRunInTransaction dla repozytoriów w pamięci
function createMemoryRunInTransaction({ roomsRepository, reservationsRepository }) {
  return (work) => work({ roomsRepository, reservationsRepository });
}

module.exports = { createReservationsRepository, createMemoryRunInTransaction };
