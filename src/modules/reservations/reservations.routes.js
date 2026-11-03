const { Router } = require('express');
const { validate } = require('../../middleware/validate');
const {
  createReservationBody,
  reservationIdParams,
  listReservationsQuery,
} = require('./reservations.schemas');

function createReservationsRouter({ reservationsController }) {
  const router = Router();

  router.get('/', validate({ query: listReservationsQuery }), reservationsController.list);
  router.get('/:id', validate({ params: reservationIdParams }), reservationsController.getById);
  router.post('/', validate({ body: createReservationBody }), reservationsController.create);
  router.patch(
    '/:id/cancel',
    validate({ params: reservationIdParams }),
    reservationsController.cancel
  );

  return router;
}

module.exports = { createReservationsRouter };
