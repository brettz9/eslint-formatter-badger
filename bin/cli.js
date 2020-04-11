#!/usr/bin/env node
'use strict';

const {join} = require('path');

const eslint = require('eslint');
const {cliBasics} = require('command-line-basics');
const {badger} = require('../src/index.js');

const optionDefinitions = cliBasics(
  join(__dirname, '../src/optionDefinitions.js')
);

if (!optionDefinitions) { // cliBasics handled
  process.exit();
}

(async () => {
// Use `optionDefinitions`
// Todo: Built `results` from eslint
await badger({results, rulesMeta, options: {packageJsonPath}});
})();
