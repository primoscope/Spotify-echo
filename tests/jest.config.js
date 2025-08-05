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
    setupFilesAfterEnv: ['<rootDir>/setup.js'],
    testTimeout: 30000,
    maxWorkers: 1, // Prevent worker process issues
    forceExit: true, // Force exit to prevent hanging
    detectOpenHandles: false, // Disable to prevent circular reference issues
    // Transform ES modules
    transform: {
        '^.+\\.js$': 'babel-jest'
    },
    transformIgnorePatterns: [
        'node_modules/(?!(mongodb|bson|@google/generative-ai)/)'
    ],
    // Module name mapping for common ES module issues
    moduleNameMapping: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
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
                '**/tests/integration/**/*.test.js'
            ],
            maxWorkers: 1,
            transform: {
                '^.+\\.js$': 'babel-jest'
            },
            transformIgnorePatterns: [
                'node_modules/(?!(mongodb|bson|@google/generative-ai)/)'
            ]
        },
        {
            displayName: 'jsdom',
            testEnvironment: 'jsdom',
            testMatch: [
                '**/tests/utils/**/*.test.js',
                '**/tests/mobile/**/*.test.js',
                '**/tests/chat/**/*.test.js'
            ],
            setupFilesAfterEnv: ['<rootDir>/setup.js'],
            maxWorkers: 1,
            transform: {
                '^.+\\.js$': 'babel-jest'
            },
            transformIgnorePatterns: [
                'node_modules/(?!(mongodb|bson|@google/generative-ai)/)'
            ]
        }
    ]
};
