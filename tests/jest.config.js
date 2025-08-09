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
    maxWorkers: 1,
    forceExit: true,
    detectOpenHandles: false,
    transformIgnorePatterns: [
        'node_modules/(?!(mongodb|bson|@opentelemetry)/)'
    ],
    moduleFileExtensions: ['js', 'json', 'mjs'],
    globals: {
        'TextEncoder': TextEncoder,
        'TextDecoder': TextDecoder
    }
};
