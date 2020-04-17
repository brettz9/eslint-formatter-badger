'use strict';

module.exports = {
  reporter: 'mocha-multi-reporters',
  'reporter-option': [
    'configFile=mocha-multi-reporters.json'
  ],
  require: [
    'esm', 'chai/register-expect'
  ]
};
