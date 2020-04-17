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

if (!optionDefinitions.file) {
  // eslint-disable-next-line no-console
  console.error(
    'The `file` argument is required (or use `--help` or `--version`).'
  );
  process.exit();
}

(async () => {
await badgerEngine(optionDefinitions);
})();
