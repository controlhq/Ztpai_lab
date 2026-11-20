const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const DEFAULT_TEST_DB = 'room_booking_test';

// TEST_DATABASE_URL ma pierwszeństwo (CI); lokalnie bierzemy host i dane logowania
// z DATABASE_URL w .env i podmieniamy nazwę bazy na testową
function resolveTestDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;

  const envFile = path.join(__dirname, '../../.env');
  const fromFile = fs.existsSync(envFile) ? dotenv.parse(fs.readFileSync(envFile)) : {};
  const base = process.env.DATABASE_URL || fromFile.DATABASE_URL;
  if (!base) {
    throw new Error('Set TEST_DATABASE_URL or DATABASE_URL to run integration tests');
  }

  const url = new URL(base);
  url.pathname = `/${DEFAULT_TEST_DB}`;
  return url.toString();
}

function databaseName(url) {
  return new URL(url).pathname.slice(1);
}

// testy czyszczą wszystkie tabele - nie mogą nigdy trafić w bazę deweloperską
function assertTestDatabase(url) {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(`Integration tests require NODE_ENV=test (got "${process.env.NODE_ENV}")`);
  }
  const name = databaseName(url);
  if (!/^[a-z0-9_]+_test$/.test(name)) {
    throw new Error(`Refusing to run integration tests against database "${name}"`);
  }
}

module.exports = { resolveTestDatabaseUrl, assertTestDatabase, databaseName };
