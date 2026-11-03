const express = require('express');

const { requestLogger } = require('./middleware/requestLogger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const { createRoomsService } = require('./modules/rooms/rooms.service');
const { createRoomsController } = require('./modules/rooms/rooms.controller');
const { createRoomsRouter } = require('./modules/rooms/rooms.routes');

const { createBuildingsService } = require('./modules/buildings/buildings.service');
const { createBuildingsController } = require('./modules/buildings/buildings.controller');
const { createBuildingsRouter } = require('./modules/buildings/buildings.routes');

const { createReservationsService } = require('./modules/reservations/reservations.service');
const { createReservationsController } = require('./modules/reservations/reservations.controller');
const { createReservationsRouter } = require('./modules/reservations/reservations.routes');

// Buduje aplikację, ale jej nie uruchamia. Repositories i zegar wstrzykiwane z zewnątrz.
function createApp({
  roomsRepository,
  reservationsRepository,
  buildingsRepository,
  runInTransaction,
  now = () => new Date(),
}) {
  const app = express();

  app.use(requestLogger);
  app.use(express.json());

  const roomsService = createRoomsService({ roomsRepository, buildingsRepository });
  const buildingsService = createBuildingsService({ buildingsRepository, roomsRepository });
  const reservationsService = createReservationsService({
    reservationsRepository,
    roomsRepository,
    runInTransaction,
    now,
  });

  app.use(
    '/api/buildings',
    createBuildingsRouter({
      buildingsController: createBuildingsController({ buildingsService }),
    })
  );

  app.use('/api/rooms', createRoomsRouter({ roomsController: createRoomsController({ roomsService }) }));
  app.use(
    '/api/reservations',
    createReservationsRouter({
      reservationsController: createReservationsController({ reservationsService }),
    })
  );

  app.get('/api/debug/crash', () => {
    throw new Error('boom');
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };