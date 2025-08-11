module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json', useESM: false }]
  },
  moduleFileExtensions: ['ts','tsx','js','jsx'],
  testEnvironmentOptions: {},
  moduleNameMapper: {
    '^(.*)\\.(css|less|scss)$': '<rootDir>/styleMock.js'
  }
};
