// ESLint configuration for EchoTune AI
// Modern ESLint v9+ flat config format

const js = require('@eslint/js');
const globals = require('globals');

const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');


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
      'no-unused-vars': 'off',
      'no-console': 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
    },
  },
  
  // Configuration for React files (including .js files with JSX)
  {

    files: ['src/**/*.jsx', 'src/**/*.tsx', 'src/**/*.js'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
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

      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-vars': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
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