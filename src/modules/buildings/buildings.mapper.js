function toBuildingResponse(building) {
    const response = {
    id: building.id,
    name: building.name,
    address: building.address,
  };
  if (building.roomsCount !== undefined) response.roomsCount = building.roomsCount;
  return response;
}

module.exports = { toBuildingResponse };