const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./docs/openapi');

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

const { createAuthService } = require('./modules/auth/auth.service');
const { createAuthController } = require('./modules/auth/auth.controller');
const { createAuthRouter } = require('./modules/auth/auth.routes');
const { createAuthenticate } = require('./middleware/authenticate');

// Buduje aplikację, ale jej nie uruchamia. Repositories i zegar wstrzykiwane z zewnątrz.
function createApp({
  roomsRepository,
  reservationsRepository,
  buildingsRepository,
  usersRepository,
  runInTransaction,
  jwtSecret,
  jwtExpiresIn,
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
  const authService = createAuthService({ usersRepository, jwtSecret, jwtExpiresIn });
  const authenticate = createAuthenticate({ jwtSecret });

  app.use(
    '/api/auth',
    createAuthRouter({ authController: createAuthController({ authService }), authenticate })
  );

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

  // publiczne są tylko /api/auth/register, /api/auth/login i /api/docs (wyżej) - wszystko poniżej wymaga tokenu
  app.use('/api', authenticate);

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