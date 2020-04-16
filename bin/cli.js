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

const {
  file,
  noUseEslintIgnore = false,
  noUseEslintrc = false,
  packageJsonPath,
  configPath
} = optionDefinitions;

if (!file) {
  // eslint-disable-next-line no-console
  console.error(
    'The `file` argument is required (or use `--help` or `--version`).'
  );
  process.exit();
}

(async () => {
const cli = new CLIEngine({
  ignore: !noUseEslintIgnore, // `true` `is ESLint default
  useEslintrc: !noUseEslintrc // `true` `is ESLint default
});

const {results} = cli.executeOnFiles(file);
// console.log('results', results);

const rulesMeta = cli.getRules();
// console.log('rulesMeta', rules.entries());

/*
results.map(({filePath}) => {
  return cli.getConfigForFile(filePath);
  // console.log('cfg', cfg);
});
*/

await badger({
  results,
  rulesMeta,
  ...optionDefinitions,
  noConfig: !packageJsonPath && !configPath,
  packageJsonPath
});
})();
