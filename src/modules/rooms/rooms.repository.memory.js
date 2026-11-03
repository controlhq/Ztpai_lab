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
    
    async findByIdWithBuilding(id) {
      const row = await db('rooms as r')
        .join('buildings as b', 'b.id', 'r.building_id')
        .select('r.*', 'b.id as b_id', 'b.name as b_name')
        .where('r.id', id)
        .first();
      if (!row) return null;
      return { ...toRoom(row), building: { id: row.b_id, name: row.b_name } };
    },

    async findByBuildingId(buildingId) {
      const rows = await db('rooms').where({ building_id: buildingId }).orderBy('id');
      return rows.map(toRoom);
    },
  };
}

module.exports = { createRoomsRepository };
