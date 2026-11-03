exports.seed = async function (knex) {
  await knex.raw('TRUNCATE TABLE reservations, rooms, buildings RESTART IDENTITY CASCADE');

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
      reserved_by: 'Jan Kowalski',
      participants: 10,
      start_time: new Date(now - 3600e3),
      end_time: new Date(now + 3600e3),
      status: 'CONFIRMED',
      internal_note: 'seed: reservation that has already started',
    },
    {
      room_id: 2,
      reserved_by: 'Anna Nowak',
      participants: 5,
      start_time: '2026-11-10 10:00+01',
      end_time: '2026-11-10 12:00+01',
      status: 'CANCELLED',
      cancelled_at: '2026-11-03 09:00+01',
    },
    {
      room_id: 3,
      reserved_by: 'Piotr Zieliński',
      participants: 40,
      start_time: '2026-11-12 09:00+01',
      end_time: '2026-11-12 11:00+01',
      status: 'CONFIRMED',
    },
    {
      room_id: 4,
      reserved_by: 'Ewa Lis',
      participants: 12,
      start_time: '2026-11-13 14:00+01',
      end_time: '2026-11-13 15:30+01',
      status: 'CONFIRMED',
    },
    {
      room_id: 5,
      reserved_by: 'Marek Kot',
      participants: 8,
      start_time: '2026-11-14 08:00+01',
      end_time: '2026-11-14 09:00+01',
      status: 'CONFIRMED',
    },
  ]);
};