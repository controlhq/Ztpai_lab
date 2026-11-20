const bcrypt = require('bcryptjs');
const request = require('supertest');
const db = require('../../src/db/knex');
const config = require('../../src/config');
const { createApp } = require('../../src/app');
const { createKnexDependencies } = require('../../src/container');
const { createEventBus } = require('../../src/events/eventBus');

const PASSWORD = 'integration-test-password';

// wspólny bus pozwala poczekać na listenery (zapis do audit_log), zanim test sprawdzi bazę lub ją wyczyści
const eventBus = createEventBus();
const settleEvents = () => eventBus.drain();

function buildApp() {
  return createApp({
    ...createKnexDependencies(db),
    eventBus,
    jwtSecret: config.jwt.secret,
    jwtExpiresIn: config.jwt.expiresIn,
  });
}

async function migrate() {
  await db.migrate.latest();
}

async function truncateAll() {
  await settleEvents();
  const tables = await db('pg_tables')
    .where({ schemaname: 'public' })
    .whereNot('tablename', 'like', 'knex_migrations%')
    .pluck('tablename');
  if (tables.length > 0) {
    await db.raw(`TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`);
  }
}

async function createUser(app, { email, role = 'USER' }) {
  const [user] = await db('users')
    .insert({ email, password_hash: await bcrypt.hash(PASSWORD, 4), role })
    .returning(['id', 'email', 'role']);
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  return { ...user, token: res.body.accessToken };
}

async function createRoom({ capacity = 10, name = '101' } = {}) {
  let building = await db('buildings').first();
  if (!building) {
    [building] = await db('buildings')
      .insert({ name: 'Budynek A', address: 'ul. Testowa 1' })
      .returning('*');
  }
  const [room] = await db('rooms')
    .insert({ building_id: building.id, name, capacity })
    .returning('*');
  return room;
}

const auth = (user) => ({ Authorization: `Bearer ${user.token}` });

async function closeDb() {
  await settleEvents();
  await db.destroy();
}

module.exports = {
  db,
  buildApp,
  migrate,
  truncateAll,
  closeDb,
  settleEvents,
  createUser,
  createRoom,
  auth,
  PASSWORD,
};
