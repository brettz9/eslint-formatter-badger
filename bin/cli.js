#!/usr/bin/env node
'use strict';

const {join} = require('path');

const {CLIEngine} = require('eslint');
const {cliBasics} = require('command-line-basics');
const {badger} = require('../src/index.js');

const optionDefinitions = cliBasics(
  join(__dirname, '../src/optionDefinitions.js')
);

if (!optionDefinitions) { // cliBasics handled
  process.exit();
}

(async () => {
const cli = new CLIEngine({
  useEslintrc: true // `true` `is default
});

const {results} = cli.executeOnFiles(optionDefinitions.files);

await badger({results, rulesMeta, options: {
  packageJsonPath: optionDefinitions.packageJsonPath
}});
})();
