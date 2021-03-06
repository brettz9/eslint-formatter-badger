'use strict';
const {readFile: rf, unlink: ul} = require('fs');
const {promisify} = require('util');
const {join} = require('path');
const {execFile: ef} = require('child_process');

const moveFile = require('move-file');

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
const cliNoFailures = getFixturePath('cli-no-failures.svg');
const cliOneFailingSuggestionCustomRuleMap = getFixturePath(
  'cli-1-failing-suggestion-custom-rulemap.svg'
);
const cliOneFailingSuggestionFiltered = getFixturePath(
  'cli-1-failing-suggestion-filtered.svg'
);
const cliOneFailingSuggestionFilteredReverse = getFixturePath(
  'cli-1-failing-suggestion-filtered-reverse.svg'
);
const cliOneFailingSuggestionNonempty = getFixturePath(
  'cli-1-failing-suggestion-nonempty.svg'
);
const cliOneFailingSuggestionFailingThreshold = getFixturePath(
  'cli-1-failing-suggestion-failing-threshold.svg'
);
const cliOneFailingSuggestionMediumThreshold = getFixturePath(
  'cli-1-failing-suggestion-medium-threshold.svg'
);
const cliOneFailingSuggestionMediumPercentageThreshold = getFixturePath(
  'cli-1-failing-suggestion-medium-percentage-threshold.svg'
);
const cliOneFailingSuggestionMediumPercentageThresholdPlural =
  getFixturePath(
    'cli-1-failing-suggestion-medium-percentage-threshold-plural.svg'
  );
const cliOneFailingSuggestionCustomColor = getFixturePath(
  'cli-1-failing-suggestion-custom-color.svg'
);
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
          'test/fixtures/sample.js',
          '--logging', 'verbose',
          '--noUseEslintIgnore',
          '--noUseEslintrc',
          '--outputPath', outputPath
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

    it(
      'should execute main CLI with `noEslintInlineConfig`',
      async function () {
        const {stdout, stderr} = await execFile(
          binFile,
          [
            '--file', 'test/fixtures/sample.js',
            '--logging', 'verbose',
            '--noUseEslintIgnore',
            '--noUseEslintrc',
            '--noEslintInlineConfig',
            '--outputPath', outputPath
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
        const expected = await readFile(cliNoFailures, 'utf8');
        expect(contents).to.equal(expected);
      }
    );

    it(
      'should execute main CLI with `eslintCache` and `eslintCacheLocation`',
      async function () {
        let {stdout, stderr} = await execFile(
          binFile,
          [
            '--file', 'test/fixtures/sample.js',
            '--logging', 'verbose',
            '--noUseEslintIgnore',
            '--noUseEslintrc',
            '--noEslintInlineConfig',
            '--eslintCache',
            '--outputPath', outputPath
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
        let contents = await readFile(outputPath, 'utf8');
        let expected = await readFile(cliNoFailures, 'utf8');
        expect(contents).to.equal(expected);

        await moveFile(
          join(process.cwd(), '.eslintcache'), getResultsPath('.eslintcache')
        );

        ({stdout, stderr} = await execFile(
          binFile,
          [
            '--file', 'test/fixtures/sample.js',
            '--logging', 'verbose',
            '--noUseEslintIgnore',
            '--noUseEslintrc',
            '--eslintCache',
            '--eslintCacheLocation', getResultsPath('.eslintcache'),
            '--outputPath', outputPath
          ],
          {
            timeout: 15000
          }
        ));
        if (stderr) {
          // eslint-disable-next-line no-console
          console.log('stderr', stderr);
        }
        expect(stdout).to.contain(
          `Finished writing to ${outputPath}`
        );
        expect(stderr).to.equal('');
        contents = await readFile(outputPath, 'utf8');
        expected = await readFile(cliNoFailures, 'utf8');
        expect(contents).to.equal(expected);
      }
    );

    it('should execute main CLI using custom rule map', async function () {
      const {stdout, stderr} = await execFile(
        binFile,
        [
          '--ruleMap', getFixturePath('ruleMap.js'),
          '--file', 'test/fixtures/sample.js',
          '--logging', 'verbose',
          '--noUseEslintIgnore',
          '--noUseEslintrc',
          '--outputPath', outputPath
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
        cliOneFailingSuggestionCustomRuleMap, 'utf8'
      );
      expect(contents).to.equal(expected);
    });

    it('should execute main CLI (filteredTypes)', async function () {
      const {stdout, stderr} = await execFile(
        binFile,
        [
          '--filteredTypes', 'suggestion,problem',
          '--file', 'test/fixtures/sample.js',
          '--logging', 'verbose',
          '--noUseEslintIgnore',
          '--noUseEslintrc',
          '--outputPath', outputPath
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
      const expected = await readFile(cliOneFailingSuggestionFiltered, 'utf8');
      expect(contents).to.equal(expected);
    });

    it(
      'should execute main CLI (filteredTypes reverse order)',
      async function () {
        const {stdout, stderr} = await execFile(
          binFile,
          [
            '--filteredTypes', 'problem,suggestion',
            '--file', 'test/fixtures/sample.js',
            '--logging', 'verbose',
            '--noUseEslintIgnore',
            '--noUseEslintrc',
            '--outputPath', outputPath
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
          cliOneFailingSuggestionFilteredReverse, 'utf8'
        );
        expect(contents).to.equal(expected);
      }
    );

    it('should execute main CLI (nonempty filteredTypes)', async function () {
      const {stdout, stderr} = await execFile(
        binFile,
        [
          '--filteredTypes', 'nonempty',
          '--file', 'test/fixtures/sample.js',
          '--logging', 'verbose',
          '--noUseEslintIgnore',
          '--noUseEslintrc',
          '--outputPath', outputPath
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
      const expected = await readFile(cliOneFailingSuggestionNonempty, 'utf8');
      expect(contents).to.equal(expected);
    });

    it(
      'should execute main CLI falling to medium percentage thresholds',
      async function () {
        const {stdout, stderr} = await execFile(
          binFile,
          [
            '--passingThreshold', '100%',
            '--mediumThreshold', '5%',
            '--file', 'test/fixtures/sample.js',
            '--logging', 'verbose',
            '--noUseEslintIgnore',
            '--noUseEslintrc',
            '--outputPath', outputPath
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
          cliOneFailingSuggestionMediumPercentageThreshold, 'utf8'
        );
        expect(contents).to.equal(expected);
      }
    );

    it(
      'should execute main CLI falling to medium percentage ' +
        'thresholds (plural)',
      async function () {
        const {stdout, stderr} = await execFile(
          binFile,
          [
            '--passingThresholds', 'problem=20%,suggestion=100%',
            '--mediumThresholds', 'problem=10%,suggestion=5%',
            '--file', 'test/fixtures/sample.js',
            '--logging', 'verbose',
            '--noUseEslintIgnore',
            '--noUseEslintrc',
            '--outputPath', outputPath
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
          cliOneFailingSuggestionMediumPercentageThresholdPlural, 'utf8'
        );
        expect(contents).to.equal(expected);
      }
    );

    it(
      'should execute main CLI falling to medium numeric thresholds',
      async function () {
        const {stdout, stderr} = await execFile(
          binFile,
          [
            '--passingThreshold', '0',
            '--mediumThreshold', '4',
            '--file', 'test/fixtures/sample.js',
            '--logging', 'verbose',
            '--noUseEslintIgnore',
            '--noUseEslintrc',
            '--outputPath', outputPath
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
          cliOneFailingSuggestionMediumThreshold, 'utf8'
        );
        expect(contents).to.equal(expected);
      }
    );

    it(
      'should execute main CLI falling to numeric failing thresholds',
      async function () {
        const {stdout, stderr} = await execFile(
          binFile,
          [
            '--passingThreshold', '0',
            '--mediumThreshold', '1',
            '--file', 'test/fixtures/sample.js',
            '--logging', 'verbose',
            '--noUseEslintIgnore',
            '--noUseEslintrc',
            '--outputPath', outputPath
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
          cliOneFailingSuggestionFailingThreshold, 'utf8'
        );
        expect(contents).to.equal(expected);
      }
    );

    it('should execute main CLI with `lintingTypeColor`', async function () {
      const {stdout, stderr} = await execFile(
        binFile,
        [
          '--lintingTypeColor', 'problem=red,yellow',
          '--lintingTypeColor', 'suggestion=navy,s{cc00ff}',
          '--file', 'test/fixtures/sample.js',
          '--logging', 'verbose',
          '--noUseEslintIgnore',
          '--noUseEslintrc',
          '--outputPath', outputPath
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
        cliOneFailingSuggestionCustomColor, 'utf8'
      );
      expect(contents).to.equal(expected);
    });

    it('should execute main CLI without logging', async function () {
      const {stdout, stderr} = await execFile(
        binFile,
        [
          '--file', 'test/fixtures/sample.js',
          '--noUseEslintIgnore',
          '--noUseEslintrc',
          '--outputPath', outputPath
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
          '--outputPath', outputPath
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
          '--outputPath', outputPath
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
          '--outputPath', outputPath
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
            maxBuffer: Number.POSITIVE_INFINITY,
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
