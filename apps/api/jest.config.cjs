module.exports = {
  displayName: 'api',
  testEnvironment: 'node',
  rootDir: '../..',
  testMatch: ['<rootDir>/apps/api/**/*.spec.ts', '<rootDir>/apps/api/**/*.e2e-spec.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/apps/api/tsconfig.app.json'
      }
    ]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  moduleFileExtensions: ['ts', 'js', 'json']
};
