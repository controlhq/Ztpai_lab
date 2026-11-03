// Jawna lista pól - internalNote celowo NIE trafia do odpowiedzi.
function toIso(value) {
  return value ? new Date(value).toISOString() : null;
}

function toReservationResponse(reservation) {
  return {
    id: reservation.id,
    roomId: reservation.roomId,
    reservedBy: reservation.reservedBy,
    participants: reservation.participants,
    startTime: toIso(reservation.startTime),
    endTime: toIso(reservation.endTime),
    status: reservation.status,
    createdAt: toIso(reservation.createdAt),
    cancelledAt: toIso(reservation.cancelledAt),
  };
}

function toReservationDetailResponse(reservation) {
  return {
    id: reservation.id,
    room: {
      id: reservation.room.id,
      name: reservation.room.name,
      building: {
        id: reservation.room.building.id,
        name: reservation.room.building.name,
      },
    },
    reservedBy: reservation.reservedBy,
    participants: reservation.participants,
    startTime: toIso(reservation.startTime),
    endTime: toIso(reservation.endTime),
    status: reservation.status,
    createdAt: toIso(reservation.createdAt),
    cancelledAt: toIso(reservation.cancelledAt),
  };
}

module.exports = { toReservationResponse, toReservationDetailResponse };
