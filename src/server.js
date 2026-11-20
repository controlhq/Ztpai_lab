const { createApp } = require('./app');
const db = require('./db/knex');
const { createKnexDependencies } = require('./container');
const config = require('./config');

const app = createApp({
  ...createKnexDependencies(db),
  jwtSecret: config.jwt.secret,
  jwtExpiresIn: config.jwt.expiresIn,
  now: () => new Date(),
});

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
