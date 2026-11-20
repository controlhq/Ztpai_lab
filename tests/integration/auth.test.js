const request = require('supertest');
const { db, buildApp, migrate, truncateAll, closeDb, createUser, createRoom, auth } = require('./helpers');

const app = buildApp();

beforeAll(migrate);
beforeEach(truncateAll);
afterAll(closeDb);

describe('auth', () => {
  test('register, login and GET /api/auth/me', async () => {
    const credentials = { email: 'Nowy.User@Example.com', password: 'bardzo-dlugie-haslo' };

    const registered = await request(app).post('/api/auth/register').send(credentials);
    expect(registered.status).toBe(201);
    expect(registered.body).toMatchObject({ email: 'nowy.user@example.com', role: 'USER' });
    expect(registered.body).not.toHaveProperty('passwordHash');

    const login = await request(app).post('/api/auth/login').send(credentials);
    expect(login.status).toBe(200);
    expect(login.body.tokenType).toBe('Bearer');

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body).toEqual(registered.body);
  });

  test('401 without a token', async () => {
    const res = await request(app).get('/api/reservations');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('rooms authorization', () => {
  test('403 when USER tries to create a room', async () => {
    const user = await createUser(app, { email: 'user@example.com' });
    const room = await createRoom();

    const res = await request(app)
      .post('/api/rooms')
      .set(auth(user))
      .send({ buildingId: room.building_id, name: '999', capacity: 5 });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(await db('rooms').count({ n: '*' }).first()).toEqual({ n: '1' });
  });

  test('ADMIN creates a room', async () => {
    const admin = await createUser(app, { email: 'admin@example.com', role: 'ADMIN' });
    const room = await createRoom();

    const res = await request(app)
      .post('/api/rooms')
      .set(auth(admin))
      .send({ buildingId: room.building_id, name: '999', capacity: 5 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: '999', capacity: 5 });
  });
});
