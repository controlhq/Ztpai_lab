const { toReservationResponse } = require('./reservations.mapper');

// Brak try/catch - Express 5 sam przekazuje odrzucone Promise do error middleware.
function createReservationsController({ reservationsService }) {
  return {
    async list(req, res) {
      const reservations = await reservationsService.list(req.validated.query);
      res.json(reservations.map(toReservationResponse));
    },

    async create(req, res) {
      const reservation = await reservationsService.create(req.validated.body);
      res
        .status(201)
        .location(`/api/reservations/${reservation.id}`)
        .json(toReservationResponse(reservation));
    },

    async cancel(req, res) {
      const reservation = await reservationsService.cancel(req.validated.params.id);
      res.status(200).json(toReservationResponse(reservation));
    },
  };
}

module.exports = { createReservationsController };
