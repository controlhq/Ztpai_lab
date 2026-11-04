const bcrypt = require('bcryptjs');
const { BCRYPT_ROUNDS } = require('../src/modules/auth/auth.service');

exports.seed = async function (knex) {
  await knex.raw('TRUNCATE TABLE reservations, rooms, buildings, users RESTART IDENTITY CASCADE');

  // jedyne miejsce, w którym powstaje konto ADMIN
  await knex('users').insert({
    email: 'admin@example.com',
    password_hash: await bcrypt.hash('admin-haslo-123', BCRYPT_ROUNDS),
    role: 'ADMIN',
  });

  // konta testowe (id 2-6), wszystkie z hasłem USER_PASSWORD
  const USER_PASSWORD = 'bardzo-dlugie-haslo';
  const userEmails = [
    'jan.kowalski@example.com',
    'anna.nowak@example.com',
    'piotr.zielinski@example.com',
    'ewa.lis@example.com',
    'marek.kot@example.com',
  ];
  for (const email of userEmails) {
    await knex('users').insert({
      email,
      password_hash: await bcrypt.hash(USER_PASSWORD, BCRYPT_ROUNDS),
      role: 'USER',
    });
  }

  await knex('buildings').insert([
    { name: 'Budynek A', address: 'ul. Warszawska 24, Kraków' },
    { name: 'Budynek B', address: 'ul. Podchorążych 1, Kraków' },
  ]);

  await knex('rooms').insert([
    { building_id: 1, name: '101', capacity: 30 },
    { building_id: 1, name: '102', capacity: 15 },
    { building_id: 1, name: '201', capacity: 60 },
    { building_id: 2, name: '101', capacity: 20 },
    { building_id: 2, name: '305', capacity: 10 },
  ]);

  const now = Date.now();
  await knex('reservations').insert([
    {
      room_id: 1,
      user_id: 2,
      participants: 10,
      start_time: new Date(now - 3600e3),
      end_time: new Date(now + 3600e3),
      status: 'CONFIRMED',
      internal_note: 'seed: reservation that has already started',
    },
    {
      room_id: 2,
      user_id: 3,
      participants: 5,
      start_time: '2026-11-10 10:00+01',
      end_time: '2026-11-10 12:00+01',
      status: 'CANCELLED',
      cancelled_at: '2026-11-03 09:00+01',
    },
    {
      room_id: 3,
      user_id: 4,
      participants: 40,
      start_time: '2026-11-12 09:00+01',
      end_time: '2026-11-12 11:00+01',
      status: 'CONFIRMED',
    },
    {
      room_id: 4,
      user_id: 5,
      participants: 12,
      start_time: '2026-11-13 14:00+01',
      end_time: '2026-11-13 15:30+01',
      status: 'CONFIRMED',
    },
    {
      room_id: 5,
      user_id: 6,
      participants: 8,
      start_time: '2026-11-14 08:00+01',
      end_time: '2026-11-14 09:00+01',
      status: 'CONFIRMED',
    },
  ]);
};