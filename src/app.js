const express = require('express');

const { requestLogger } = require('./middleware/requestLogger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const { createRoomsService } = require('./modules/rooms/rooms.service');
const { createRoomsController } = require('./modules/rooms/rooms.controller');
const { createRoomsRouter } = require('./modules/rooms/rooms.routes');

const { createReservationsService } = require('./modules/reservations/reservations.service');
const { createReservationsController } = require('./modules/reservations/reservations.controller');
const { createReservationsRouter } = require('./modules/reservations/reservations.routes');

// Buduje aplikację, ale jej nie uruchamia. Repositories i zegar wstrzykiwane z zewnątrz.
function createApp({ roomsRepository, reservationsRepository, now = () => new Date() }) {
  const app = express();

  app.use(requestLogger);
  app.use(express.json());

  const roomsService = createRoomsService({ roomsRepository });
  const reservationsService = createReservationsService({
    reservationsRepository,
    roomsRepository,
    now,
  });

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