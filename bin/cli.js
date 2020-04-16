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

if (!optionDefinitions.file) {
  throw new Error(
    'The `file` argument is required (or use `--help` or `--version`).'
  );
}

(async () => {
const cli = new CLIEngine({
  useEslintrc: true // `true` `is default
});

const {results} = cli.executeOnFiles(optionDefinitions.file);
// console.log('results', results);

const rulesMeta = cli.getRules();
// console.log('rulesMeta', rules.entries());

/*
results.map(({filePath}) => {
  return cli.getConfigForFile(filePath);
  // console.log('cfg', cfg);
});
*/

await badger({results, rulesMeta, options: {
  ...optionDefinitions,
  noConfig: !optionDefinitions.packageJsonPath && !optionDefinitions.configPath,
  packageJsonPath: optionDefinitions.packageJsonPath
}});
})();
