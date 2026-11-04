const { createApp } = require('./app');
const db = require('./db/knex');
const { createRoomsKnexRepository } = require('./modules/rooms/rooms.repository.knex');
const { createRunInTransaction } = require('./db/runInTransaction');
const {
  createReservationsKnexRepository,
} = require('./modules/reservations/reservations.repository.knex');
const {
  createBuildingsKnexRepository,
} = require('./modules/buildings/buildings.repository.knex');
const { createUsersKnexRepository } = require('./modules/users/users.repository.knex');

const config = require('./config');

const app = createApp({
  roomsRepository: createRoomsKnexRepository({ db }),
  reservationsRepository: createReservationsKnexRepository({ db }),
  buildingsRepository: createBuildingsKnexRepository({ db }),
  usersRepository: createUsersKnexRepository({ db }),
  runInTransaction: createRunInTransaction(db),
  jwtSecret: config.jwt.secret,
  jwtExpiresIn: config.jwt.expiresIn,
  now: () => new Date(),
});

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});