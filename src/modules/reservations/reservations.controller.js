const {
  toReservationResponse,
  toReservationDetailResponse,
} = require('./reservations.mapper');


function createReservationsController({ reservationsService }) {
  return {
    async list(req, res) {
      const { data, meta } = await reservationsService.list(req.validated.query, req.user);
      res.json({ data: data.map(toReservationDetailResponse), meta });
    },

    async getById(req, res) {
      const reservation = await reservationsService.getById(req.validated.params.id, req.user);
      res.json(toReservationDetailResponse(reservation));
    },

    async create(req, res) {
      const reservation = await reservationsService.create(req.validated.body, req.user);
      res
        .status(201)
        .location(`/api/reservations/${reservation.id}`)
        .json(toReservationResponse(reservation));
    },

    async cancel(req, res) {
      const reservation = await reservationsService.cancel(req.validated.params.id, req.user);
      res.status(200).json(toReservationResponse(reservation));
    },
  };
}

module.exports = { createReservationsController };
