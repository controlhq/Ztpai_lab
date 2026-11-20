const { EVENTS } = require('../../events/eventBus');

// każdy event rezerwacji trafia do tabeli audit_log
function registerAuditLogListener({ eventBus, auditLogRepository }) {
  for (const eventType of Object.values(EVENTS)) {
    eventBus.subscribe(
      eventType,
      (payload) => auditLogRepository.create({ eventType, payload }),
      'audit-log'
    );
  }
}

module.exports = { registerAuditLogListener };
