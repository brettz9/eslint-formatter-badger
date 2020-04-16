'use strict';
const {readFile: rf, unlink: ul} = require('fs');
const {promisify} = require('util');
const {join} = require('path');
const {execFile: ef} = require('child_process');

const readFile = promisify(rf);
const execFile = promisify(ef);
const unlink = promisify(ul);

const binFile = join(__dirname, '../bin/cli.js');

const getFixturePath = (path) => {
  return join(__dirname, `fixtures/${path}`);
};
const getResultsPath = (path) => {
  return join(__dirname, `results/${path}`);
};
const outputPath = getResultsPath('cli-results.svg');
const cliOneFailingSuggestion = getFixturePath('cli-1-failing-suggestion.svg');

describe('Binary', function () {
  this.timeout(8000);
  it('should log help', async function () {
    const {stdout} = await execFile(binFile, ['-h']);
    expect(stdout).to.contain(
      'Create badges'
    );
  });

  it('should err without `file` (or help/version) flag', async function () {
    const {stderr} = await execFile(binFile, []);
    expect(stderr).to.contain(
      'The `file` argument is required (or use `--help` or `--version`).'
    );
  });

  describe('Executing', function () {
    const unlinker = async () => {
      try {
        return await unlink(outputPath);
      } catch (err) {}
      return undefined;
    };
    before(unlinker);
    after(unlinker);

    it('should execute', async function () {
      const {stdout, stderr} = await execFile(
        binFile,
        [
          '--file', 'test/fixtures/sample.js',
          '--logging', 'verbose',
          '--noUseEslintIgnore',
          '--noUseEslintrc',
          outputPath
        ],
        {
          timeout: 15000
        }
      );
      if (stderr) {
        // eslint-disable-next-line no-console
        console.log('stderr', stderr);
      }
      expect(stdout).to.contain(
        `Finished writing to ${outputPath}`
      );
      expect(stderr).to.equal('');
      const contents = await readFile(outputPath, 'utf8');
      const expected = await readFile(cliOneFailingSuggestion, 'utf8');
      expect(contents).to.equal(expected);
    });
  });
});
