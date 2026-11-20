// uruchamiany przed każdym plikiem testów, zanim zostanie załadowany src/config
const { resolveTestDatabaseUrl, assertTestDatabase } = require('./testDatabase');

process.env.NODE_ENV = 'test';

const url = resolveTestDatabaseUrl();
assertTestDatabase(url);

// dotenv w src/config nie nadpisuje już ustawionych zmiennych
process.env.DATABASE_URL = url;
