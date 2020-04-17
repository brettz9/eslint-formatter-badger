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
  overrides: [
    {
      files: 'test/**',
      globals: {
        expect: 'readonly'
      },
      env: {
        mocha: true
      }
    },
    {
      files: 'test/programmatic.js',
      extends: [
        'plugin:@fintechstudios/eslint-plugin-chai-as-promised/recommended',
        'plugin:chai-expect-keywords/recommended',
        'plugin:chai-expect/recommended',
        'plugin:chai-friendly/recommended'
      ],
      parserOptions: {
        sourceType: 'module'
      },
      rules: {
        'node/no-unsupported-features/es-syntax': ['error', {
          ignores: ['modules']
        }],
        'chai-expect-keywords/no-unsupported-keywords': [
          'error', {
            // allowChaiDOM: true,
            allowChaiAsPromised: true
          }
        ]
      }
    }
  ],
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
