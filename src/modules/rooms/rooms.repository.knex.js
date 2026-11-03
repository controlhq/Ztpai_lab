const toRoom = (row) => ({
  id: row.id,
  buildingId: row.building_id,
  name: row.name,
  capacity: row.capacity,
  createdAt: row.created_at.toISOString(),
});

function createRoomsKnexRepository({ db }) {
  return {
    async findAll() {
      const rows = await db('rooms').orderBy('id');
      return rows.map(toRoom);
    },
    async findById(id) {
      const row = await db('rooms').where({ id }).first();
      return row ? toRoom(row) : null;
    },
    async create({ buildingId, name, capacity }) {
      const [row] = await db('rooms')
        .insert({ building_id: buildingId, name, capacity })
        .returning('*');
      return toRoom(row);
    },
  };
}

module.exports = { createRoomsKnexRepository };