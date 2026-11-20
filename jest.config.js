module.exports = {
  verbose: true,
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      globalSetup: '<rootDir>/tests/integration/globalSetup.js',
      setupFiles: ['<rootDir>/tests/integration/setupEnv.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/integration/silenceRequestLogs.js'],
    },
  ],
};
