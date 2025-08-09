// ESLint configuration for EchoTune AI
// Modern ESLint v9+ flat config format

const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  // Base recommended configuration
  js.configs.recommended,
  
  // Global configuration for all files
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2021,
        ...globals.jest,
      },
    },
    rules: {
      'no-unused-vars': [
        'warn',  // Changed from 'error' to 'warn' to be less strict
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-console': 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
    },
  },
  
  // Configuration for React/JSX files
  {
    files: ['**/*.jsx', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn', // Less strict for React files
    },
  },
  
  // Configuration for specific utility files
  {
    files: [
      'src/mobile/mobile-responsive.js',
      'src/security/security-manager.js',
      'src/utils/performance-manager.js',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  
  // Configuration for test files
  {
    files: ['**/*.test.js', '**/*.spec.js', 'tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      'no-unused-expressions': 'off',
      'no-unused-vars': 'warn',
    },
  },
  
  // Configuration for scripts and automation
  {
    files: ['scripts/**/*.js', 'mcp-server/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'warn',
    },
  },
  
  // Ignore configuration
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.min.js',
      'static/js/vendor/**',
    ],
  },
];