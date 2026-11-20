const { settleEvents } = require('./helpers');

// logi requestów z requestLogger zaśmiecają wynik testów; console.error zostaje widoczny
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
});

// listenery (audit log, powiadomienia) kończą się po wysłaniu odpowiedzi - test czeka na nie,
// żeby nie wpadały do kolejnego testu ani nie logowały po przywróceniu console.log
afterEach(settleEvents);
