const toBuilding = (row) => ({
  id: row.id,
  name: row.name,
  address: row.address,
  createdAt: row.created_at.toISOString(),
});

function createBuildingsKnexRepository({ db }) {
  return {
    async findAll() {
      const rows = await db('buildings as b')
        .leftJoin('rooms as r', 'r.building_id', 'b.id')
        .groupBy('b.id')
        .select('b.*')
        .count({ rooms_count: 'r.id' })
        .orderBy('b.id');
      return rows.map((row) => ({ ...toBuilding(row), roomsCount: Number(row.rooms_count) }));
    },
    async findById(id) {
      const row = await db('buildings').where({ id }).first();
      return row ? toBuilding(row) : null;
    },
    async create({ name, address }) {
      const [row] = await db('buildings').insert({ name, address }).returning('*');
      return toBuilding(row);
    },
  };
}

module.exports = { createBuildingsKnexRepository };