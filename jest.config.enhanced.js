/**
 * Enhanced Jest Configuration for EchoTune AI
 * 
 * Addresses testing infrastructure issues identified in comprehensive analysis:
 * - Comprehensive test coverage requirements (80%+)
 * - MCP server testing integration
 * - Performance testing capabilities
 * - AI/ML model testing support
 * - Security and compliance testing
 */

module.exports = {
  // Test environment configuration
  testEnvironment: 'node',
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },

  // Test discovery patterns
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|ts|jsx|tsx)',
    '**/tests/**/*.(test|spec).(js|ts|jsx|tsx)',
    '**/*.(test|spec).(js|ts|jsx|tsx)'
  ],

  // Files to ignore during testing
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/.next/',
    '<rootDir>/coverage/',
    '<rootDir>/validation-reports/',
    '<rootDir>/enhanced-perplexity-results/'
  ],

  // Module path mapping for clean imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@mcp/(.*)$': '<rootDir>/src/mcp/$1',
    '^@frontend/(.*)$': '<rootDir>/src/frontend/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },

  // Setup files that run before tests
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/global-setup.js',
    '<rootDir>/tests/setup/mcp-setup.js',
    '<rootDir>/tests/setup/ai-mocks.js'
  ],

  // Global setup and teardown
  globalSetup: '<rootDir>/tests/setup/jest-global-setup.js',
  globalTeardown: '<rootDir>/tests/setup/jest-global-teardown.js',

  // Transform configuration for different file types
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript'
      ],
      plugins: [
        '@babel/plugin-transform-runtime',
        '@babel/plugin-proposal-class-properties'
      ]
    }],
    '^.+\\.css$': 'identity-obj-proxy',
    '^.+\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/mocks/file-mock.js'
  },

  // Files to ignore during transformation
  transformIgnorePatterns: [
    'node_modules/(?!(@modelcontextprotocol|@browserbasehq|FileScopeMCP)/)',
    '\\.pnp\\.[^\\/]+$'
  ],

  // Coverage configuration for comprehensive reporting
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,ts,jsx,tsx}',
    'mcp-server/**/*.{js,ts}',
    'mcp-servers/**/*.{js,ts}',
    'scripts/**/*.js',
    '!src/**/*.d.ts',
    '!src/test/**',
    '!src/mocks/**',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/*.config.js',
    '!**/*.config.ts'
  ],

  // Coverage thresholds - enforces quality gates
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Critical components require higher coverage
    './src/api/': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85
    },
    './src/mcp/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/utils/': {
      branches: 80,
      functions: 85,
      lines: 80,
      statements: 80
    }
  },

  // Coverage reporting formats
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'clover'
  ],

  // Coverage output directory
  coverageDirectory: '<rootDir>/coverage',

  // Test result processors for enhanced reporting
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '<rootDir>/test-results/junit',
      outputName: 'test-results.xml'
    }],
    ['jest-html-reporters', {
      publicPath: '<rootDir>/test-results/html',
      filename: 'test-report.html',
      expand: true,
      hideIcon: false
    }],
    ['@jest/test-result-processor', '<rootDir>/tests/processors/performance-processor.js']
  ],

  // Test timeout configuration
  testTimeout: 30000, // 30 seconds for comprehensive tests
  
  // Enhanced error handling for debugging
  verbose: true,
  bail: false, // Continue running tests after failures
  errorOnDeprecated: true,

  // Watch mode configuration for development
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],

  // Custom test environments for different test types
  projects: [
    // Unit tests
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.(js|ts)'],
      testEnvironment: 'node'
    },

    // Integration tests
    {
      displayName: 'integration', 
      testMatch: ['<rootDir>/tests/integration/**/*.test.(js|ts)'],
      testEnvironment: 'node',
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/integration-setup.js'
      ]
    },

    // Frontend/React tests
    {
      displayName: 'frontend',
      testMatch: [
        '<rootDir>/src/frontend/**/*.test.(js|jsx|ts|tsx)',
        '<rootDir>/src/components/**/*.test.(js|jsx|ts|tsx)'
      ],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/frontend-setup.js'
      ]
    },

    // MCP server tests
    {
      displayName: 'mcp',
      testMatch: [
        '<rootDir>/tests/mcp/**/*.test.(js|ts)',
        '<rootDir>/mcp-servers/**/*.test.(js|ts)'
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/mcp-setup.js'
      ],
      testTimeout: 60000 // Longer timeout for MCP tests
    },

    // E2E tests
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.(js|ts)'],
      testEnvironment: 'node',
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/e2e-setup.js'
      ],
      testTimeout: 120000 // 2 minutes for E2E tests
    },

    // Performance tests  
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/tests/performance/**/*.test.(js|ts)'],
      testEnvironment: 'node',
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/performance-setup.js'
      ],
      testTimeout: 300000 // 5 minutes for performance tests
    },

    // Security tests
    {
      displayName: 'security',
      testMatch: ['<rootDir>/tests/security/**/*.test.(js|ts)'],
      testEnvironment: 'node',
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup/security-setup.js'
      ]
    }
  ],

  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,

  // Module directories for resolving dependencies
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src',
    '<rootDir>/tests'
  ],

  // File extensions Jest will process
  moduleFileExtensions: [
    'js',
    'jsx',
    'ts',
    'tsx',
    'json',
    'node'
  ],

  // Custom matchers for enhanced assertions
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/custom-matchers.js'
  ],

  // Test data and fixtures
  modulePathIgnorePatterns: [
    '<rootDir>/tests/fixtures/large-datasets/'
  ],

  // Snapshot configuration
  snapshotSerializers: [
    'jest-serializer-vue'
  ],

  // Custom resolver for complex module resolution
  resolver: '<rootDir>/tests/config/custom-resolver.js',

  // Notify on test completion (development only)
  notify: process.env.NODE_ENV === 'development',
  notifyMode: 'failure-change',

  // Collect and display slow tests
  slowTestThreshold: 5,

  // Max worker processes for parallel testing
  maxWorkers: process.env.CI ? 2 : '50%',

  // Cache configuration for faster subsequent runs
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',

  // ESM support
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};