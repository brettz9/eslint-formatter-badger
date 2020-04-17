'use strict';
const {readFile: rf, unlink: ul} = require('fs');
const {promisify} = require('util');
const {join} = require('path');
const {execFile: ef} = require('child_process');

const readFile = promisify(rf);
const execFile = promisify(ef);
const unlink = promisify(ul);

const binFile = join(__dirname, '../bin/cli.js');
const eslintBadgePath = join(__dirname, '../eslint-badge.svg');
const eslintBinFile = join(__dirname, '../node_modules/eslint/bin/eslint.js');

const getFixturePath = (path) => {
  return join(__dirname, `fixtures/${path}`);
};
const getResultsPath = (path) => {
  return join(__dirname, `results/${path}`);
};
const outputPath = getResultsPath('cli-results.svg');
const cliOneFailingSuggestion = getFixturePath('cli-1-failing-suggestion.svg');
const cliOneFailingSuggestionSinglePane = getFixturePath(
  'cli-1-failing-suggestion-singlePane.svg'
);
const mainEslintBadgeFixturePath = getFixturePath('cli-main-eslint-badge.svg');

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

    it('should execute main CLI', async function () {
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

    it('should execute main CLI without logging', async function () {
      const {stdout, stderr} = await execFile(
        binFile,
        [
          '--file', 'test/fixtures/sample.js',
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
      expect(stdout).to.equal('');
      expect(stderr).to.equal('');
      const contents = await readFile(outputPath, 'utf8');
      const expected = await readFile(cliOneFailingSuggestion, 'utf8');
      expect(contents).to.equal(expected);
    });

    it('should execute main CLI with `configPath`', async function () {
      const {stdout, stderr} = await execFile(
        binFile,
        [
          '--configPath',
          getFixturePath('config.js'),
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

    it('should execute main CLI with `packageJsonPath`', async function () {
      const {stdout, stderr} = await execFile(
        binFile,
        [
          '--packageJsonPath',
          getFixturePath('package.json'),
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

    it('should execute main CLI with `singlePane`', async function () {
      const {stdout, stderr} = await execFile(
        binFile,
        [
          '--file', 'test/fixtures/sample.js',
          '--singlePane',
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
      const expected = await readFile(
        cliOneFailingSuggestionSinglePane, 'utf8'
      );
      expect(contents).to.equal(expected);
    });

    it('should work with `eslint -f`', async function () {
      try {
        await execFile(
          eslintBinFile,
          [
            '-f', './src/index.js',
            // We are ignoring so our project doesn't report when linting
            '--no-ignore',
            '--no-eslintrc',
            '--config',
            './test/fixtures/eslint-config.js',
            'test/fixtures/simple.js'
          ],
          {
            maxBuffer: Infinity,
            stdio: 'inherit',
            timeout: 15000
          }
        );
      } catch (err) {
        expect(err.stdout).to.contain(
          `Finished writing to ${eslintBadgePath}`
        );
        expect(err.stderr).to.equal('');
        const contents = await readFile(eslintBadgePath, 'utf8');
        const expected = await readFile(mainEslintBadgeFixturePath, 'utf8');
        expect(contents).to.equal(expected);
        return;
      }
      const expected = false;
      expect(expected).to.be.true;
    });
  });
});
