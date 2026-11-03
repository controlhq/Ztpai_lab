const { createRoomsKnexRepository } = require('../modules/rooms/rooms.repository.knex');
const {
  createReservationsKnexRepository,
} = require('../modules/reservations/reservations.repository.knex');

function createRunInTransaction(db) {
  return (work) =>
    db.transaction((trx) =>
      work({
        roomsRepository: createRoomsKnexRepository({ db: trx }),
        reservationsRepository: createReservationsKnexRepository({ db: trx }),
      })
    );
}

module.exports = { createRunInTransaction };