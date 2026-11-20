const { createReservationsService } = require('../../src/modules/reservations/reservations.service');
const { createRoomsRepository } = require('../../src/modules/rooms/rooms.repository.memory');
const {
  createReservationsRepository,
  createMemoryRunInTransaction,
} = require('../../src/modules/reservations/reservations.repository.memory');

const NOW = new Date('2026-06-01T08:00:00.000Z');
const ROOM_ID = 1;
const OTHER_ROOM_ID = 2;
const CAPACITY = 10;

const owner = { id: 10, role: 'USER' };
const stranger = { id: 20, role: 'USER' };
const admin = { id: 1, role: 'ADMIN' };

// godzina 'HH:MM' tego samego dnia co NOW (UTC)
const at = (hhmm) => `2026-06-01T${hhmm}:00.000Z`;

function setup({ reservations = [] } = {}) {
  let current = NOW;
  const roomsRepository = createRoomsRepository({
    rooms: [
      { id: ROOM_ID, buildingId: 1, name: 'A101', capacity: CAPACITY },
      { id: OTHER_ROOM_ID, buildingId: 1, name: 'A102', capacity: CAPACITY },
    ],
  });
  const reservationsRepository = createReservationsRepository({ reservations });
  const eventBus = { publish: jest.fn() };
  const service = createReservationsService({
    roomsRepository,
    reservationsRepository,
    runInTransaction: createMemoryRunInTransaction({ roomsRepository, reservationsRepository }),
    eventBus,
    now: () => current,
  });

  return {
    service,
    reservationsRepository,
    eventBus,
    setNow: (date) => {
      current = new Date(date);
    },
  };
}

function existing(overrides = {}) {
  return {
    id: 1,
    roomId: ROOM_ID,
    userId: owner.id,
    participants: 4,
    startTime: at('10:00'),
    endTime: at('12:00'),
    status: 'CONFIRMED',
    createdAt: NOW.toISOString(),
    cancelledAt: null,
    ...overrides,
  };
}

const request = (startTime, endTime, overrides = {}) => ({
  roomId: ROOM_ID,
  participants: 4,
  startTime,
  endTime,
  ...overrides,
});

describe('reservations service - create', () => {
  test('creates a CONFIRMED reservation for the current user', async () => {
    const { service, reservationsRepository } = setup();

    const created = await service.create(request(at('10:00'), at('11:00')), owner);

    expect(created).toMatchObject({ roomId: ROOM_ID, userId: owner.id, status: 'CONFIRMED' });
    expect(await reservationsRepository.findAll()).toHaveLength(1);
  });

  test('rejects partial overlap with ROOM_ALREADY_BOOKED', async () => {
    const { service } = setup({ reservations: [existing()] });

    await expect(
      service.create(request(at('11:00'), at('13:00')), stranger)
    ).rejects.toMatchObject({ code: 'ROOM_ALREADY_BOOKED' });
  });

  test('rejects a range contained in an existing reservation', async () => {
    const { service } = setup({ reservations: [existing()] });

    await expect(
      service.create(request(at('10:30'), at('11:30')), stranger)
    ).rejects.toMatchObject({ code: 'ROOM_ALREADY_BOOKED' });
  });

  test('rejects a range that contains an existing reservation', async () => {
    const { service } = setup({ reservations: [existing()] });

    await expect(
      service.create(request(at('09:00'), at('13:00')), stranger)
    ).rejects.toMatchObject({ code: 'ROOM_ALREADY_BOOKED' });
  });

  test.each([
    ['right after the existing one', '12:00', '13:00'],
    ['right before the existing one', '09:00', '10:00'],
  ])('allows a touching range %s', async (_label, start, end) => {
    const { service } = setup({ reservations: [existing()] });

    const created = await service.create(request(at(start), at(end)), stranger);

    expect(created.status).toBe('CONFIRMED');
  });

  test('allows the same time range in a different room', async () => {
    const { service } = setup({ reservations: [existing()] });

    const created = await service.create(
      request(at('10:00'), at('12:00'), { roomId: OTHER_ROOM_ID }),
      stranger
    );

    expect(created.roomId).toBe(OTHER_ROOM_ID);
  });

  test('a CANCELLED reservation does not block the range', async () => {
    const { service } = setup({
      reservations: [existing({ status: 'CANCELLED', cancelledAt: NOW.toISOString() })],
    });

    const created = await service.create(request(at('10:00'), at('12:00')), stranger);

    expect(created.status).toBe('CONFIRMED');
  });

  test('allows participants equal to room capacity', async () => {
    const { service } = setup();

    const created = await service.create(
      request(at('10:00'), at('11:00'), { participants: CAPACITY }),
      owner
    );

    expect(created.participants).toBe(CAPACITY);
  });

  test('rejects participants above room capacity with ROOM_CAPACITY_EXCEEDED', async () => {
    const { service } = setup();

    await expect(
      service.create(request(at('10:00'), at('11:00'), { participants: CAPACITY + 1 }), owner)
    ).rejects.toMatchObject({ code: 'ROOM_CAPACITY_EXCEEDED' });
  });

  test.each([
    { label: '14 min', start: '10:00', end: '10:14', allowed: false },
    { label: '15 min', start: '10:00', end: '10:15', allowed: true },
    { label: '8 h', start: '10:00', end: '18:00', allowed: true },
    { label: '8 h 1 min', start: '10:00', end: '18:01', allowed: false },
  ])('duration $label -> allowed: $allowed', async ({ start, end, allowed }) => {
    const { service } = setup();
    const result = service.create(request(at(start), at(end)), owner);

    if (allowed) {
      await expect(result).resolves.toMatchObject({ status: 'CONFIRMED' });
    } else {
      await expect(result).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    }
  });

  test('rejects a reservation starting in the past', async () => {
    const { service } = setup();

    await expect(
      service.create(request(at('07:00'), at('09:00')), owner)
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  test('rejects a non-existent room with ROOM_NOT_FOUND', async () => {
    const { service } = setup();

    await expect(
      service.create(request(at('10:00'), at('11:00'), { roomId: 999 }), owner)
    ).rejects.toMatchObject({ code: 'ROOM_NOT_FOUND' });
  });
});

describe('reservations service - cancel', () => {
  test('owner cancels a future reservation', async () => {
    const { service } = setup({ reservations: [existing()] });

    const cancelled = await service.cancel(1, owner);

    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.cancelledAt).toBe(NOW.toISOString());
  });

  test('rejects cancelling a reservation that has already started', async () => {
    const { service, setNow } = setup({ reservations: [existing()] });
    setNow(at('10:30'));

    await expect(service.cancel(1, owner)).rejects.toMatchObject({
      code: 'RESERVATION_ALREADY_STARTED',
    });
  });

  test('second cancel is idempotent and keeps the original cancelledAt', async () => {
    const { service, setNow } = setup({ reservations: [existing()] });

    const first = await service.cancel(1, owner);
    setNow(at('09:00'));
    const second = await service.cancel(1, owner);

    expect(second.status).toBe('CANCELLED');
    expect(second.cancelledAt).toBe(first.cancelledAt);
  });

  test('another USER cannot cancel someone else reservation', async () => {
    const { service, reservationsRepository } = setup({ reservations: [existing()] });

    await expect(service.cancel(1, stranger)).rejects.toMatchObject({
      code: 'RESERVATION_NOT_FOUND',
    });
    expect((await reservationsRepository.findById(1)).status).toBe('CONFIRMED');
  });

  test('ADMIN can cancel someone else reservation', async () => {
    const { service } = setup({ reservations: [existing()] });

    const cancelled = await service.cancel(1, admin);

    expect(cancelled.status).toBe('CANCELLED');
  });
});

describe('reservations service - events', () => {
  test('publishes reservation.created with the payload after a successful create', async () => {
    const { service, eventBus } = setup();

    const created = await service.create(request(at('10:00'), at('11:00')), owner);

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledWith('reservation.created', {
      reservationId: created.id,
      roomId: ROOM_ID,
      userId: owner.id,
      startTime: at('10:00'),
      endTime: at('11:00'),
    });
  });

  test('does not publish when create fails with ROOM_ALREADY_BOOKED', async () => {
    const { service, eventBus } = setup({ reservations: [existing()] });

    await expect(
      service.create(request(at('11:00'), at('13:00')), stranger)
    ).rejects.toMatchObject({ code: 'ROOM_ALREADY_BOOKED' });
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  test('publishes reservation.cancelled with cancelledBy when ADMIN cancels', async () => {
    const { service, eventBus } = setup({ reservations: [existing()] });

    await service.cancel(1, admin);

    expect(eventBus.publish).toHaveBeenCalledWith('reservation.cancelled', {
      reservationId: 1,
      roomId: ROOM_ID,
      userId: owner.id,
      cancelledBy: admin.id,
    });
  });

  test('idempotent second cancel does not publish again', async () => {
    const { service, eventBus } = setup({ reservations: [existing()] });

    await service.cancel(1, owner);
    await service.cancel(1, owner);

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
  });

  test('does not publish when cancel fails with RESERVATION_ALREADY_STARTED', async () => {
    const { service, eventBus, setNow } = setup({ reservations: [existing()] });
    setNow(at('10:30'));

    await expect(service.cancel(1, owner)).rejects.toMatchObject({
      code: 'RESERVATION_ALREADY_STARTED',
    });
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});

describe('reservations service - read access', () => {
  test('USER gets RESERVATION_NOT_FOUND for someone else reservation', async () => {
    const { service } = setup({ reservations: [existing()] });

    await expect(service.getById(1, stranger)).rejects.toMatchObject({
      code: 'RESERVATION_NOT_FOUND',
    });
  });

  test('list returns only own reservations for USER', async () => {
    const { service } = setup({
      reservations: [existing(), existing({ id: 2, userId: stranger.id, roomId: OTHER_ROOM_ID })],
    });

    const { data, meta } = await service.list({ page: 1, limit: 20 }, stranger);

    expect(meta.total).toBe(1);
    expect(data.map((r) => r.userId)).toEqual([stranger.id]);
  });
});
