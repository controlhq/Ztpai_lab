const COLUMNS = {
  roomId: 'room_id',
  reservedBy: 'reserved_by',
  participants: 'participants',
  startTime: 'start_time',
  endTime: 'end_time',
  status: 'status',
  createdAt: 'created_at',
  cancelledAt: 'cancelled_at',
  internalNote: 'internal_note',
};

function toRow(obj) {
  const row = {};
  for (const [key, value] of Object.entries(obj)) {
    if (COLUMNS[key]) row[COLUMNS[key]] = value;
  }
  return row;
}

const iso = (d) => (d ? d.toISOString() : null);

const toReservation = (row) => ({
  id: row.id,
  roomId: row.room_id,
  reservedBy: row.reserved_by,
  participants: row.participants,
  startTime: iso(row.start_time),
  endTime: iso(row.end_time),
  status: row.status,
  createdAt: iso(row.created_at),
  cancelledAt: iso(row.cancelled_at),
  internalNote: row.internal_note,
});

const toReservationDetailed = (row) => ({
  ...toReservation(row),
  room: {
    id: row.r_id,
    name: row.r_name,
    building: { id: row.b_id, name: row.b_name },
  },
});

const joinedQuery = (db) =>
  db('reservations as res')
    .join('rooms as r', 'r.id', 'res.room_id')
    .join('buildings as b', 'b.id', 'r.building_id');

const SELECT_DETAILED = [
  'res.*',
  'r.id as r_id',
  'r.name as r_name',
  'b.id as b_id',
  'b.name as b_name',
];

const detailedQuery = (db) => joinedQuery(db).select(...SELECT_DETAILED);

// whitelista: tylko te kolumny mogą trafić do ORDER BY
const SORT_COLUMNS = {
  startTime: 'res.start_time',
  createdAt: 'res.created_at',
  participants: 'res.participants',
};

function applyFilters(query, { roomId, buildingId, status, from, to }) {
  if (roomId !== undefined) query.where('res.room_id', roomId);
  if (buildingId !== undefined) query.where('r.building_id', buildingId);
  if (status !== undefined) query.where('res.status', status);
  // nakładanie przedziałów [from, to): start < to AND end > from
  if (to !== undefined) query.where('res.start_time', '<', to);
  if (from !== undefined) query.where('res.end_time', '>', from);
  return query;
}


function createReservationsKnexRepository({ db }) {
  return {
    async findPage({ filters, sort, page, limit }) {
      const desc = sort.startsWith('-');
      const column = SORT_COLUMNS[desc ? sort.slice(1) : sort];
      const filtered = () => applyFilters(joinedQuery(db), filters);

      const [{ total }] = await filtered().count({ total: '*' });

      const rows = await filtered()
        .select(...SELECT_DETAILED)
        .orderBy(column, desc ? 'desc' : 'asc')
        .orderBy('res.id', 'asc') // stabilny tie-breaker
        .limit(limit)
        .offset((page - 1) * limit);

      return { rows: rows.map(toReservationDetailed), total: Number(total) };
    },

    async findByIdDetailed(id) {
      const row = await detailedQuery(db).where('res.id', id).first();
      return row ? toReservationDetailed(row) : null;
    },

    async findAll() {
      const rows = await db('reservations').orderBy('id');
      return rows.map(toReservation);
    },
    async findByRoomId(roomId) {
      const rows = await db('reservations').where({ room_id: roomId }).orderBy('id');
      return rows.map(toReservation);
    },
    async findById(id) {
      const row = await db('reservations').where({ id }).first();
      return row ? toReservation(row) : null;
    },
    async create(data) {
      const [row] = await db('reservations').insert(toRow(data)).returning('*');
      return toReservation(row);
    },
    async update(id, patch) {
      const [row] = await db('reservations').where({ id }).update(toRow(patch)).returning('*');
      return row ? toReservation(row) : null;
    },
  };
}

module.exports = { createReservationsKnexRepository };