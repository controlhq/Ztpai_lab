const { NotFoundError, ConflictError, ValidationError, ForbiddenError } = require('../../errors');

const MIN_DURATION_MS = 15 * 60 * 1000;
const MAX_DURATION_MS = 8 * 60 * 60 * 1000;

// State machine jako dane: z jakiego statusu do jakich wolno przejść.
const ALLOWED_TRANSITIONS = {
  CONFIRMED: ['CANCELLED'],
  CANCELLED: [],
};

function canTransition(from, to) {
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
}

// Przedziały półotwarte [start, end): A.start < B.end AND B.start < A.end
function overlaps(a, b) {
  return a.start < b.end && b.start < a.end;
}

function bodyError(field, message) {
  return new ValidationError([{ location: 'body', field, message }]);
}

const isAdmin = (user) => user.role === 'ADMIN';

// cudza rezerwacja wygląda jak nieistniejąca - nie zdradzamy, że istnieje
function assertCanAccess(reservation, currentUser) {
  if (!reservation || (!isAdmin(currentUser) && reservation.userId !== currentUser.id)) {
    throw new NotFoundError('Reservation not found', 'RESERVATION_NOT_FOUND');
  }
}

function createReservationsService({
  reservationsRepository,
  roomsRepository,
  runInTransaction,
  now = () => new Date(),
}) {
  return {
    async list(query, currentUser) {
      const { page = 1, limit = 20, sort = 'startTime', ...filters } = query;

      if (!isAdmin(currentUser)) {
        if (filters.userId !== undefined) {
          throw new ForbiddenError('Filter userId is available only for ADMIN');
        }
        // USER widzi tylko swoje rezerwacje - niezależnie od parametrów query
        filters.userId = currentUser.id;
      }

      const { rows, total } = await reservationsRepository.findPage({
        filters,
        sort,
        page,
        limit,
      });
      return {
        data: rows,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    },

    async getById(id, currentUser) {
      const reservation = await reservationsRepository.findByIdDetailed(id);
      assertCanAccess(reservation, currentUser);
      return reservation;
    },

    async create({ roomId, participants, startTime, endTime }, currentUser) {
  return runInTransaction(async ({ roomsRepository, reservationsRepository }) => {
    // blokada wiersza sali: równoległe rezerwacje tej samej sali czekają na commit
    const room = await roomsRepository.findByIdForUpdate(roomId);
    if (!room) {
      throw new NotFoundError('Room not found', 'ROOM_NOT_FOUND');
    }

    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const nowMs = now().getTime();

    if (end <= start) {
      throw bodyError('endTime', 'endTime must be later than startTime');
    }

    const duration = end - start;
    if (duration < MIN_DURATION_MS || duration > MAX_DURATION_MS) {
      throw bodyError('endTime', 'Reservation must last between 15 minutes and 8 hours');
    }

    if (start < nowMs) {
      throw bodyError('startTime', 'startTime must not be in the past');
    }

    if (participants > room.capacity) {
      throw new ConflictError('ROOM_CAPACITY_EXCEEDED', 'Room capacity exceeded');
    }

    const roomReservations = await reservationsRepository.findByRoomId(room.id);
    const conflict = roomReservations.some(
      (r) =>
        r.status === 'CONFIRMED' &&
        overlaps(
          { start, end },
          { start: new Date(r.startTime).getTime(), end: new Date(r.endTime).getTime() }
        )
    );
    if (conflict) {
      throw new ConflictError(
        'ROOM_ALREADY_BOOKED',
        'Room is already booked in the requested time range'
      );
    }

    const created = await reservationsRepository.create({
      roomId: room.id,
      userId: currentUser.id,
      participants,
      startTime: new Date(start).toISOString(),
      endTime: new Date(end).toISOString(),
      status: 'CONFIRMED',
      createdAt: now().toISOString(),
      cancelledAt: null,
      internalNote: 'created via API v2',
    });
    return reservationsRepository.findByIdDetailed(created.id);
  });
},

    async cancel(id, currentUser) {
      const reservation = await reservationsRepository.findByIdDetailed(id);
      assertCanAccess(reservation, currentUser);

      // idempotentnie: ponowne anulowanie nic nie zmienia (cancelledAt zostaje)
      if (reservation.status === 'CANCELLED') {
        return reservation;
      }

      if (new Date(reservation.startTime).getTime() <= now().getTime()) {
        throw new ConflictError(
          'RESERVATION_ALREADY_STARTED',
          'Reservation has already started and cannot be cancelled'
        );
      }

      if (!canTransition(reservation.status, 'CANCELLED')) {
        throw new ConflictError(
          'INVALID_STATUS_TRANSITION',
          `Cannot change status from ${reservation.status} to CANCELLED`
        );
      }

      await reservationsRepository.update(id, {
        status: 'CANCELLED',
        cancelledAt: now().toISOString(),
      });
      return reservationsRepository.findByIdDetailed(id);
    },
  };
}

module.exports = { createReservationsService, ALLOWED_TRANSITIONS };
