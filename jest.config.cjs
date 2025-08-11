module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest'
  },
  moduleFileExtensions: ['ts','tsx','js','jsx'],
  moduleNameMapper: {
    '^(.*)\\.(css|less|scss)$': '<rootDir>/styleMock.js'
  }
};
