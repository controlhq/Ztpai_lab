function toRoomResponse(room) {
  return {
    id: room.id,
    buildingId: room.buildingId,
    name: room.name,
    capacity: room.capacity,
  };
}

function toRoomDetailResponse(room) {
  return {
    id: room.id,
    name: room.name,
    capacity: room.capacity,
    building: { id: room.building.id, name: room.building.name },
  };
}

module.exports = { toRoomResponse, toRoomDetailResponse };