'use strict';

module.exports = {
  extends: [
    'ash-nazg/sauron-node-script-overrides'
  ],
  env: {
    browser: false,
    es6: true
  },
  overrides: [
    {
      files: '**/*.mjs',
      parserOptions: {
        sourceType: 'module'
      }
    },
    {
      files: 'test/**',
      parserOptions: {
        sourceType: 'module'
      },
      extends: [
        'plugin:@fintechstudios/eslint-plugin-chai-as-promised/recommended',
        'plugin:chai-expect-keywords/recommended',
        'plugin:chai-expect/recommended',
        'plugin:chai-friendly/recommended'
      ],
      globals: {
        expect: 'readonly'
      },
      env: {
        mocha: true
      },
      rules: {
        'n/no-unsupported-features/es-syntax': ['error', {
          ignores: ['modules']
        }],
        'chai-expect-keywords/no-unsupported-keywords': [
          'error', {
            // allowChaiDOM: true,
            allowChaiAsPromised: true
          }
        ]
      }
    },
    {
      files: 'test/programmatic.js',
      parserOptions: {
        sourceType: 'module'
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
  parserOptions: {
    ecmaVersion: 2022
  },
  rules: {
    'import/no-commonjs': 0,
    'no-process-exit': 0,
    'compat/compat': 0,
    'n/global-require': 'error',

    // Ignore for now
    'eslint-comments/require-description': 0
  }
};
