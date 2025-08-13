// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  coverageProvider: 'v8',
  transform: {
    '^.+\\.(t|j)sx?$': [
      'babel-jest',
  {
	configFile: path.join(__dirname, 'babel.config.cjs'),
        babelrc: false,
        sourceType: 'unambiguous',
        plugins: ['@babel/plugin-syntax-import-meta'],
      },
    ],
  },
  moduleFileExtensions: ['ts','tsx','js','jsx'],
  moduleNameMapper: {
    '^(.*)\\.(css|less|scss)$': '<rootDir>/styleMock.cjs'
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
