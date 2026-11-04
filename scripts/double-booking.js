const config = require('../src/config');
const db = require('../src/db/knex');

const BASE_URL = `http://localhost:${config.port}`;
const ROOM_ID = 1;
const START = '2030-01-15T10:00:00.000Z';
const END = '2030-01-15T12:00:00.000Z';
const N = 10;

async function main() {
  // czysty start: usuwa tylko dane z poprzednich uruchomień skryptu
  await db('reservations').where({ room_id: ROOM_ID, start_time: START, end_time: END }).del();

  const login = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'jan.kowalski@example.com', password: 'bardzo-dlugie-haslo' }),
  }).then((res) => res.json());

  const statuses = await Promise.all(
    Array.from({ length: N }, () =>
      fetch(`${BASE_URL}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${login.accessToken}`,
        },
        body: JSON.stringify({
          roomId: ROOM_ID,
          participants: 5,
          startTime: START,
          endTime: END,
        }),
      }).then((res) => res.status)
    )
  );

  statuses.forEach((status, i) => console.log(`request #${i + 1}: ${status}`));

  const summary = {};
  for (const s of statuses) summary[s] = (summary[s] || 0) + 1;
  console.log('podsumowanie:', summary);

  const [{ count }] = await db('reservations')
    .where({ room_id: ROOM_ID, status: 'CONFIRMED' })
    .where('start_time', '<', END)
    .where('end_time', '>', START)
    .count({ count: '*' });
  console.log(`CONFIRMED w bazie dla sali ${ROOM_ID} w tym przedziale: ${count}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.destroy());