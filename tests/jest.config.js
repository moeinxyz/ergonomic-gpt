module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Timeout for async tests (browser operations can be slow)
  testTimeout: 30000,

  // Setup file
  setupFilesAfterEnv: ['<rootDir>/setup.js'],

  // Test file patterns
  testMatch: [
    '**/*.test.js',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    '../content-scripts/**/*.js',
    '../popup/**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Coverage output
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Verbose output
  verbose: true,

  // Detect open handles (helpful for debugging)
  detectOpenHandles: true,

  // Force exit after tests complete
  forceExit: true,

  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Transform files (if we add TypeScript later)
  transform: {},
};
