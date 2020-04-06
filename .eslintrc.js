'use strict';

module.exports = {
  extends: [
    'ash-nazg/sauron',
    'plugin:node/recommended-script'
  ],
  env: {
    browser: false,
    es6: true
  },
  settings: {
    polyfills: [
    ]
  },
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  rules: {
    'import/no-commonjs': 0,
    'no-process-exit': 0,
    'compat/compat': 0
  }
};
