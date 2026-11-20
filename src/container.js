const { createRoomsKnexRepository } = require('./modules/rooms/rooms.repository.knex');
const {
  createReservationsKnexRepository,
} = require('./modules/reservations/reservations.repository.knex');
const { createBuildingsKnexRepository } = require('./modules/buildings/buildings.repository.knex');
const { createUsersKnexRepository } = require('./modules/users/users.repository.knex');
const { createAuditLogKnexRepository } = require('./modules/audit-log/audit-log.repository.knex');
const { createRunInTransaction } = require('./db/runInTransaction');

// zależności createApp() oparte o PostgreSQL - wspólne dla servera i testów integracyjnych
function createKnexDependencies(db) {
  return {
    roomsRepository: createRoomsKnexRepository({ db }),
    reservationsRepository: createReservationsKnexRepository({ db }),
    buildingsRepository: createBuildingsKnexRepository({ db }),
    usersRepository: createUsersKnexRepository({ db }),
    auditLogRepository: createAuditLogKnexRepository({ db }),
    runInTransaction: createRunInTransaction(db),
  };
}

module.exports = { createKnexDependencies };
