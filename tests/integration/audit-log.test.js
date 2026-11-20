const request = require('supertest');
const {
  db,
  buildApp,
  migrate,
  truncateAll,
  closeDb,
  settleEvents,
  createUser,
  createRoom,
  auth,
} = require('./helpers');

const app = buildApp();

beforeAll(migrate);
beforeEach(truncateAll);
afterAll(closeDb);

const slot = { startTime: '2030-01-15T10:00:00.000Z', endTime: '2030-01-15T11:00:00.000Z' };

// utworzenie -> kolizja 409 -> anulowanie przez ADMINa -> ponowne anulowanie
async function runScenario() {
  const owner = await createUser(app, { email: 'owner@example.com' });
  const other = await createUser(app, { email: 'other@example.com' });
  const admin = await createUser(app, { email: 'admin@example.com', role: 'ADMIN' });
  const room = await createRoom();
  const body = { roomId: room.id, participants: 2, ...slot };

  const created = await request(app).post('/api/reservations').set(auth(owner)).send(body);
  expect(created.status).toBe(201);
  const conflict = await request(app).post('/api/reservations').set(auth(other)).send(body);
  expect(conflict.status).toBe(409);
  for (let i = 0; i < 2; i++) {
    const cancel = await request(app)
      .patch(`/api/reservations/${created.body.id}/cancel`)
      .set(auth(admin));
    expect(cancel.status).toBe(200);
  }
  await settleEvents();

  return { owner, admin, room, reservationId: created.body.id };
}

describe('audit log', () => {
  test('stores exactly one row per successful operation', async () => {
    const { owner, admin, room, reservationId } = await runScenario();

    const rows = await db('audit_log').orderBy('id');

    expect(rows.map((r) => r.event_type)).toEqual(['reservation.created', 'reservation.cancelled']);
    expect(rows[0].payload).toEqual({
      reservationId,
      roomId: room.id,
      userId: owner.id,
      ...slot,
    });
    expect(rows[1].payload).toEqual({
      reservationId,
      roomId: room.id,
      userId: owner.id,
      cancelledBy: admin.id,
    });
  });

  test('GET /api/admin/audit-log returns newest first with pagination and eventType filter', async () => {
    const { admin } = await runScenario();

    const all = await request(app).get('/api/admin/audit-log?limit=1').set(auth(admin));
    expect(all.status).toBe(200);
    expect(all.body.meta).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
    expect(all.body.data.map((e) => e.eventType)).toEqual(['reservation.cancelled']);

    const filtered = await request(app)
      .get('/api/admin/audit-log?eventType=reservation.created')
      .set(auth(admin));
    expect(filtered.body.meta.total).toBe(1);
    expect(filtered.body.data[0].eventType).toBe('reservation.created');
  });

  test('403 for USER and 400 for an unknown eventType', async () => {
    const user = await createUser(app, { email: 'user@example.com' });
    const admin = await createUser(app, { email: 'admin@example.com', role: 'ADMIN' });

    const forbidden = await request(app).get('/api/admin/audit-log').set(auth(user));
    expect(forbidden.status).toBe(403);

    const invalid = await request(app)
      .get('/api/admin/audit-log?eventType=user.deleted')
      .set(auth(admin));
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.details[0]).toMatchObject({ location: 'query', field: 'eventType' });
  });
});
