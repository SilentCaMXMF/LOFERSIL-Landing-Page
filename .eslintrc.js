module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Allow console statements for debugging
    'no-console': 'warn',
    // Allow unused variables that start with underscore
    'no-unused-vars': 'off',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js'],
};
