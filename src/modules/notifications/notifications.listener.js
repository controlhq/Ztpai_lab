const { EVENTS } = require('../../events/eventBus');

// symulacja powiadomienia: właściciel dostaje informację, gdy jego rezerwację anulował ADMIN
function registerNotificationListener({ eventBus, usersRepository, logger = console }) {
  eventBus.subscribe(
    EVENTS.RESERVATION_CANCELLED,
    async ({ reservationId, userId, cancelledBy }) => {
      if (cancelledBy === userId) return;

      const canceller = await usersRepository.findById(cancelledBy);
      if (!canceller || canceller.role !== 'ADMIN') return;

      const owner = await usersRepository.findById(userId);
      if (!owner) return;

      logger.log(
        `[notification] to: ${owner.email} - your reservation #${reservationId} was cancelled by an administrator (${canceller.email})`
      );
    },
    'notification'
  );
}

module.exports = { registerNotificationListener };
