'use strict';

module.exports = {
  reporter: 'cypress-multi-reporters',
  'reporter-option': [
    'configFile=mocha-multi-reporters.json'
  ],
  require: [
    'esm', 'chai/register-expect'
  ]
};
