const { createApp } = require('./app');
const db = require('./db/knex');
const { createKnexDependencies } = require('./container');
const config = require('./config');
const { createEventBus } = require('./events/eventBus');

const SHUTDOWN_TIMEOUT_MS = 8000;

const eventBus = createEventBus();

const app = createApp({
  ...createKnexDependencies(db),
  eventBus,
  jwtSecret: config.jwt.secret,
  jwtExpiresIn: config.jwt.expiresIn,
  now: () => new Date(),
});

const server = app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received - shutting down gracefully`);

  // awaryjne wyjście, gdyby jakieś połączenie blokowało zamknięcie dłużej niż timeout
  setTimeout(() => {
    console.error('Graceful shutdown timed out - forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();

  // server.close() przestaje przyjmować nowe połączenia i czeka na zakończenie trwających żądań
  server.close(async (err) => {
    if (err) console.error('Error while closing HTTP server:', err);
    else console.log('HTTP server closed');

    try {
      // listenery w toku (np. zapis do audit_log) muszą skończyć przed zamknięciem puli
      await eventBus.drain();
      await db.destroy();
      console.log('Database connection pool closed');
    } catch (dbErr) {
      console.error('Error while closing database pool:', dbErr);
      process.exit(1);
    }
    process.exit(err ? 1 : 0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
