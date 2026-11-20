const { EventEmitter } = require('events');

const EVENTS = Object.freeze({
  RESERVATION_CREATED: 'reservation.created',
  RESERVATION_CANCELLED: 'reservation.cancelled',
});

// Event bus na EventEmitter z izolacją błędów: wyjątek (także odrzucony Promise z listenera async)
// jest logowany i nie dociera do kodu, który opublikował event, ani do pozostałych listenerów.
function createEventBus({ logger = console } = {}) {
  const emitter = new EventEmitter();
  const pending = new Set();

  return {
    subscribe(eventType, listener, name = listener.name || 'anonymous') {
      emitter.on(eventType, (payload) => {
        // EventEmitter nie łapie odrzuconych Promise, dlatego każdy listener ma własny try/catch
        const run = (async () => {
          try {
            await listener(payload);
          } catch (err) {
            logger.error(`[event-bus] listener "${name}" failed on ${eventType}:`, err);
          }
        })();
        pending.add(run);
        run.finally(() => pending.delete(run));
      });
    },

    publish(eventType, payload) {
      emitter.emit(eventType, payload);
    },

    // czeka na zakończenie listenerów w toku (graceful shutdown, testy)
    async drain() {
      while (pending.size > 0) {
        await Promise.allSettled([...pending]);
      }
    },
  };
}

module.exports = { createEventBus, EVENTS };
