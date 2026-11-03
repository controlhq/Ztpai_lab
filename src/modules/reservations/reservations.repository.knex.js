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

function createReservationsKnexRepository({ db }) {
  return {
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