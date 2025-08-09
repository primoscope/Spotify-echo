module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '**/tests/**/*.test.js'
    ],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/test/**',
        '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testTimeout: 30000,
    maxWorkers: 1, // Prevent worker process issues
    forceExit: true, // Force exit to prevent hanging
    detectOpenHandles: false, // Disable to prevent circular reference issues
    transformIgnorePatterns: [
        'node_modules/(?!(mongodb|bson|@opentelemetry)/)'
    ],
    moduleFileExtensions: ['js', 'json', 'mjs'],
    transform: {
        '^.+\\.js$': 'babel-jest',
        '^.+\\.mjs$': 'babel-jest'
    },
    // Set up global test environment
    globals: {
        'TextEncoder': TextEncoder,
        'TextDecoder': TextDecoder
    },
    projects: [
        {
            displayName: 'node',
            testEnvironment: 'node',
            testMatch: [
                '**/tests/api/**/*.test.js',
                '**/tests/database/**/*.test.js',
                '**/tests/ml/**/*.test.js',
                '**/tests/security/**/*.test.js',
                '**/tests/integration/**/*.test.js',
                '**/tests/admin/**/*.test.js'  // Added admin tests
            ],
            transformIgnorePatterns: [
                'node_modules/(?!(mongodb|bson|@opentelemetry)/)'
            ],
            maxWorkers: 1,
            globals: {
                'TextEncoder': TextEncoder,
                'TextDecoder': TextDecoder
            }
        },
        {
            displayName: 'jsdom',
            testEnvironment: 'jsdom',
            testMatch: [
                '**/tests/utils/**/*.test.js',
                '**/tests/mobile/**/*.test.js',
                '**/tests/chat/**/*.test.js'
            ],
            setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
            transformIgnorePatterns: [
                'node_modules/(?!(mongodb|bson|@opentelemetry)/)'
            ],
            maxWorkers: 1
        }
    ]
};
