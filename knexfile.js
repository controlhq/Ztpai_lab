const config = require('./src/config');

module.exports = {
  client: 'pg',
  connection: config.databaseUrl,
  migrations: { directory: './migrations' },
  seeds: { directory: './seeds' },
};
