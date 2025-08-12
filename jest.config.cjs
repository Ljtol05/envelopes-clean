module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  coverageProvider: 'v8',
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest'
  },
  moduleFileExtensions: ['ts','tsx','js','jsx'],
  moduleNameMapper: {
    '^(.*)\\.(css|less|scss)$': '<rootDir>/styleMock.js'
  },
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}','!src/**/*.d.ts'],
  coverageReporters: ['text','lcov'],
  coverageThreshold: {
    global: {
      lines: 4,
      statements: 4,
      branches: 2,
  functions: 2
    }
  }
};
