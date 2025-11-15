module.exports = {
  displayName: '@react-native-iconify/api-integration',
  preset: 'react-native',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/**/*.test.{ts,tsx}'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react'
      }
    }]
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/__mocks__/'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
