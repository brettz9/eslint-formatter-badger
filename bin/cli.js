#!/usr/bin/env node
'use strict';

const {join} = require('path');

const {cliBasics} = require('command-line-basics');
const {badgerEngine} = require('../src/index.js');

const optionDefinitions = cliBasics(
  join(__dirname, '../src/optionDefinitions.js')
);

if (!optionDefinitions) { // cliBasics handled
  process.exit();
}

(async () => {
try {
  await badgerEngine(optionDefinitions);
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit();
}
})();
