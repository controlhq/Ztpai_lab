const { createEventBus } = require('../../src/events/eventBus');

function setup() {
  const logger = { error: jest.fn() };
  return { bus: createEventBus({ logger }), logger };
}

describe('event bus', () => {
  test('delivers the payload to every subscribed listener', async () => {
    const { bus } = setup();
    const first = jest.fn();
    const second = jest.fn();
    bus.subscribe('reservation.created', first);
    bus.subscribe('reservation.created', second);

    bus.publish('reservation.created', { reservationId: 1 });
    await bus.drain();

    expect(first).toHaveBeenCalledWith({ reservationId: 1 });
    expect(second).toHaveBeenCalledWith({ reservationId: 1 });
  });

  test('a throwing listener does not affect the publisher or other listeners', async () => {
    const { bus, logger } = setup();
    const healthy = jest.fn();
    bus.subscribe('reservation.created', () => {
      throw new Error('sync failure');
    }, 'broken');
    bus.subscribe('reservation.created', healthy);

    expect(() => bus.publish('reservation.created', { reservationId: 1 })).not.toThrow();
    await bus.drain();

    expect(healthy).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('"broken"'),
      expect.any(Error)
    );
  });

  test('a rejected promise from an async listener is caught and logged', async () => {
    const { bus, logger } = setup();
    bus.subscribe('reservation.cancelled', async () => {
      throw new Error('async failure');
    }, 'broken-async');

    bus.publish('reservation.cancelled', { reservationId: 1 });
    await bus.drain();

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('"broken-async"'),
      expect.objectContaining({ message: 'async failure' })
    );
  });
});
