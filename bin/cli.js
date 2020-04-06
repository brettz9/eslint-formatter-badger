#!/usr/bin/env node
'use strict';

const eslint = require('eslint');

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
// Todo: Built `results` from eslint
await mainScript(results, {rulesMeta}, {packageJsonPath});
})();
