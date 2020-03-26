#!/usr/bin/env node
'use strict';

const {join} = require('path');
const {cliBasics} = require('command-line-basics');
const mainScript = require('../src/index.js');

const optionDefinitions = cliBasics(
  join(__dirname, '../src/optionDefinitions.js')
);

if (!optionDefinitions) { // cliBasics handled
  process.exit();
}

(async () => {
// Use `optionDefinitions`
await mainScript(optionDefinitions);
})();
