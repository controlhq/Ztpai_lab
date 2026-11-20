const request = require('supertest');
const { db, buildApp, migrate, truncateAll, closeDb, createUser, createRoom, auth } = require('./helpers');

const app = buildApp();

beforeAll(migrate);
beforeEach(truncateAll);
afterAll(closeDb);

// daleko w przyszłości, żeby reguła "nie w przeszłości" nie zależała od daty uruchomienia
const day = (hhmm, date = '2030-01-15') => `${date}T${hhmm}:00.000Z`;

async function book(user, room, overrides = {}) {
  return request(app)
    .post('/api/reservations')
    .set(auth(user))
    .send({
      roomId: room.id,
      participants: 4,
      startTime: day('10:00'),
      endTime: day('11:00'),
      ...overrides,
    });
}

describe('POST /api/reservations', () => {
  test('201 with Location header and the row saved in the database', async () => {
    const user = await createUser(app, { email: 'user@example.com' });
    const room = await createRoom();

    const res = await book(user, room);

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/reservations/${res.body.id}`);

    const row = await db('reservations').where({ id: res.body.id }).first();
    expect(row).toMatchObject({
      room_id: room.id,
      user_id: user.id,
      participants: 4,
      status: 'CONFIRMED',
    });
    expect(row.start_time.toISOString()).toBe(day('10:00'));
  });

  test('400 with details for an invalid body', async () => {
    const user = await createUser(app, { email: 'user@example.com' });
    const room = await createRoom();

    const res = await request(app)
      .post('/api/reservations')
      .set(auth(user))
      .send({ roomId: room.id, participants: 0, startTime: 'jutro', status: 'CANCELLED' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ location: 'body', field: 'participants' }),
        expect.objectContaining({ location: 'body', field: 'startTime' }),
        expect.objectContaining({ location: 'body', field: 'endTime' }),
        expect.objectContaining({ location: 'body', field: 'status', message: 'Unknown field' }),
      ])
    );
    expect(await db('reservations').count({ n: '*' }).first()).toEqual({ n: '0' });
  });

  test('409 ROOM_ALREADY_BOOKED for an overlapping reservation', async () => {
    const first = await createUser(app, { email: 'first@example.com' });
    const second = await createUser(app, { email: 'second@example.com' });
    const room = await createRoom();
    await book(first, room);

    const res = await book(second, room, { startTime: day('10:30'), endTime: day('11:30') });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ROOM_ALREADY_BOOKED');
    expect(await db('reservations').count({ n: '*' }).first()).toEqual({ n: '1' });
  });
});

describe('GET /api/reservations', () => {
  test('404 when USER fetches someone else reservation', async () => {
    const owner = await createUser(app, { email: 'owner@example.com' });
    const stranger = await createUser(app, { email: 'stranger@example.com' });
    const room = await createRoom();
    const created = await book(owner, room);

    const res = await request(app).get(`/api/reservations/${created.body.id}`).set(auth(stranger));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RESERVATION_NOT_FOUND');
  });

  test('pagination: meta.total counts all rows, data is limited', async () => {
    const user = await createUser(app, { email: 'user@example.com' });
    const room = await createRoom();
    for (const date of ['2030-01-15', '2030-01-16', '2030-01-17', '2030-01-18', '2030-01-19']) {
      const res = await book(user, room, { startTime: day('10:00', date), endTime: day('11:00', date) });
      expect(res.status).toBe(201);
    }

    const res = await request(app).get('/api/reservations?limit=2&page=2').set(auth(user));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toEqual({ page: 2, limit: 2, total: 5, totalPages: 3 });
    expect(res.body.data.map((r) => r.startTime)).toEqual([
      day('10:00', '2030-01-17'),
      day('10:00', '2030-01-18'),
    ]);
  });
});

describe('PATCH /api/reservations/:id/cancel', () => {
  test('ADMIN cancels someone else reservation', async () => {
    const owner = await createUser(app, { email: 'owner@example.com' });
    const admin = await createUser(app, { email: 'admin@example.com', role: 'ADMIN' });
    const room = await createRoom();
    const created = await book(owner, room);

    const res = await request(app)
      .patch(`/api/reservations/${created.body.id}/cancel`)
      .set(auth(admin));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
    const row = await db('reservations').where({ id: created.body.id }).first();
    expect(row.status).toBe('CANCELLED');
    expect(row.cancelled_at).not.toBeNull();
  });
});
