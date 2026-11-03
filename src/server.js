const { createApp } = require('./app');
const db = require('./db/knex');
const { createRoomsKnexRepository } = require('./modules/rooms/rooms.repository.knex');
const {
  createReservationsKnexRepository,
} = require('./modules/reservations/reservations.repository.knex');
const {
  createBuildingsKnexRepository,
} = require('./modules/buildings/buildings.repository.knex');

const PORT = process.env.PORT || 3000;

const app = createApp({
  roomsRepository: createRoomsKnexRepository({ db }),
  reservationsRepository: createReservationsKnexRepository({ db }),
  buildingsRepository: createBuildingsKnexRepository({ db }),
  now: () => new Date(),
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});