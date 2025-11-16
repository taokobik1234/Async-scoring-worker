module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/app.js',
      '!src/swagger/**',
      '!src/workers/**',
    ],
    testMatch: ['**/tests/**/*.test.js'],
    coverageThreshold: {
      './src/services/': {
        statements: 85,
        branches: 80,
        functions: 65,
        lines: 85,
      },
    },
    verbose: true,
    testTimeout: 10000,
    forceExit: true,
    detectOpenHandles: true,
  };