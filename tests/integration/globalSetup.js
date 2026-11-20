const { Client } = require('pg');
const { resolveTestDatabaseUrl, assertTestDatabase, databaseName } = require('./testDatabase');

// zakłada pustą bazę testową, jeśli jeszcze nie istnieje; schemat tworzą migracje w beforeAll
module.exports = async function globalSetup() {
  process.env.NODE_ENV = 'test';
  const url = resolveTestDatabaseUrl();
  assertTestDatabase(url);

  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  const client = new Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    const name = databaseName(url);
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (rowCount === 0) {
      await client.query(`CREATE DATABASE "${name}"`);
    }
  } finally {
    await client.end();
  }
};
