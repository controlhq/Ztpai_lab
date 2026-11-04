const config = require('../src/config');
const db = require('../src/db/knex');

const BASE_URL = `http://localhost:${config.port}`;
const EMAIL = 'race-test@example.com';
const N = 10;

async function main() {
  // czysty start: usuwa tylko konto z poprzednich uruchomień skryptu
  await db('users').where({ email: EMAIL }).del();

  const responses = await Promise.all(
    Array.from({ length: N }, (_, i) =>
      fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // różna wielkość liter - po normalizacji to ten sam email
        body: JSON.stringify({
          email: i % 2 ? EMAIL.toUpperCase() : EMAIL,
          password: 'bardzo-dlugie-haslo',
        }),
      }).then(async (res) => ({ status: res.status, body: await res.json() }))
    )
  );

  responses.forEach(({ status, body }, i) =>
    console.log(`request #${i + 1}: ${status}${body.error ? ` ${body.error.code}` : ''}`)
  );

  const summary = {};
  for (const { status } of responses) summary[status] = (summary[status] || 0) + 1;
  console.log('podsumowanie:', summary);

  const [{ count }] = await db('users').where({ email: EMAIL }).count({ count: '*' });
  console.log(`kont z emailem ${EMAIL} w bazie: ${count}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.destroy());
