// logi requestów z requestLogger zaśmiecają wynik testów; console.error zostaje widoczny
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
});
