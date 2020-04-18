import {readFile as rf, unlink as ul} from 'fs';
import {promisify} from 'util';
import {join} from 'path';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import delay from 'delay';
// eslint-disable-next-line import/no-named-default
import {badger, badgerEngine, default as mainBadger} from '../src/index.js';
import rulesMeta from './fixtures/rulesMeta.js';
import simpleRulesMeta from './fixtures/simpleRulesMeta.js';
import consoleRulesMeta from './fixtures/consoleRulesMeta.js';
import simpleResults from './fixtures/simpleResults.js';
import results from './fixtures/results.js';
import noConsoleResults from './fixtures/noConsoleResults.js';

chai.use(chaiAsPromised);

const logging = 'verbose';

const readFile = promisify(rf);
const unlink = promisify(ul);

const getFixturePath = (path) => {
  return join(__dirname, `fixtures/${path}`);
};
const getResultsPath = (path) => {
  return join(__dirname, `results/${path}`);
};

const eslintBadgePath = join(__dirname, '../eslint-badge.svg');
const eslintBadgeWithTemplatesPath = getFixturePath(
  'eslintBadgeWithTemplatesPath.svg'
);
const eslintBadgeCustomRulesPath = getFixturePath(
  'eslintBadgeCustomRulesPath.svg'
);
const eslintBadgeWithFailingTemplatesPath = getFixturePath(
  'eslintBadgeWithFailingTemplatesPath.svg'
);
const outputPath = getResultsPath('results.svg');
const eslintBadgeFixturePath = getFixturePath('eslint-badge.svg');
const mainEslintBadgeFixturePath = getFixturePath('main-eslint-badge.svg');
const oneFailingSuggestion = getFixturePath('1-failing-suggestion.svg');
const oneFailingSuggestionWithLines = getFixturePath(
  '1-failing-suggestion-with-lines.svg'
);
const oneFailingSuggestionCustomRuleMap = getFixturePath(
  '1-failing-suggestion-custom-rulemap.svg'
);

describe('`badger`', function () {
  this.timeout(15000);
  it('should throw with a bad output path', async () => {
    let err;
    try {
      await badger({outputPath: '', fileName: 'file.js', logging});
    } catch (error) {
      err = error;
    }
    expect(err.message).to.equal('Bad output path provided.');
  });

  describe('Main functionality', function () {
    const unlinker = async () => {
      try {
        return await unlink(outputPath);
      } catch (err) {}
      return undefined;
    };
    before(unlinker);
    after(unlinker);

    describe('Main badger export (API for `eslint -f`)', function () {
      it('should return default badger export results', async function () {
        // This doesn't return a Promise (to avoid printing
        //   `Promise { <pending> }`), so we have to try at a timeout
        mainBadger(
          results,
          {rulesMeta: simpleRulesMeta},
          {
            // Using file contents from https://eslint.org/docs/developer-guide/working-with-custom-formatters#the-data-argument
            //   though triggering a warning for one rule instead
            textColor: 'orange,s{blue}',
            logging
          }
        );
        await delay(5000);
        const contents = await readFile(eslintBadgePath, 'utf8');
        // This fixture shows a smaller number of rules than
        //  other tests despite our not narrowing the config given our
        //  smaller `simpleRulesMeta`.
        const expected = await readFile(mainEslintBadgeFixturePath, 'utf8');
        expect(contents).to.equal(expected);
      });
    });
    describe('`badgerEngine`', function () {
      it('should return `badgerEngine` results', async function () {
        const {
          results: returnedResults,
          rulesMeta: returnedRulesMeta
        } = await badgerEngine({
          noUseEslintrc: true,
          noUseEslintIgnore: true,
          eslintConfigPath: getFixturePath('eslint-config.js'),
          // Using file contents from https://eslint.org/docs/developer-guide/working-with-custom-formatters#the-data-argument
          //   though triggering a warning for one rule instead
          file: 'test/fixtures/simple.js',
          textColor: 'orange,s{blue}',
          logging
        });
        const contents = await readFile(eslintBadgePath, 'utf8');
        const expected = await readFile(eslintBadgeFixturePath, 'utf8');
        expect(contents).to.equal(expected);
        expect([...returnedRulesMeta.entries()].some(([ruleId]) => {
          return ruleId === 'curly';
        })).to.be.true;
        expect(returnedResults[0].filePath).to.contain(
          'test/fixtures/simple.js'
        );
        expect(returnedResults[0].errorCount).to.equal(1);
        expect(returnedResults[0].warningCount).to.equal(1);
      });

      it(
        'should return `badgerEngine` results using rules with missing meta',
        async function () {
          const {
            results: returnedResults,
            rulesMeta: returnedRulesMeta
          } = await badgerEngine({
            noUseEslintrc: true,
            noUseEslintIgnore: true,
            eslintRulesdir: [getFixturePath('rules')],
            eslintConfigPath: getFixturePath(
              'eslint-config-with-custom-rules.js'
            ),
            // Using file contents from https://eslint.org/docs/developer-guide/working-with-custom-formatters#the-data-argument
            //   though triggering a warning for one rule instead
            file: 'test/fixtures/function.js',
            textColor: 'orange,s{blue}',
            logging
          });
          const contents = await readFile(eslintBadgePath, 'utf8');
          const expected = await readFile(eslintBadgeCustomRulesPath, 'utf8');
          expect(contents).to.equal(expected);
          expect([...returnedRulesMeta.entries()].map(([ruleId]) => {
            return ruleId;
          })).to.include.members([
            'rule-with-meta-type',
            'rule-with-no-meta-type',
            'rule-with-no-meta'
          ]);
          expect(returnedResults[0].filePath).to.contain(
            'test/fixtures/function.js'
          );
          expect(returnedResults[0].errorCount).to.equal(2);
          expect(returnedResults[0].warningCount).to.equal(0);
        }
      );

      it(
        'should return `badgerEngine` results with templates',
        async function () {
          const {
            results: returnedResults,
            rulesMeta: returnedRulesMeta
          } = await badgerEngine({
            noUseEslintrc: true,
            noUseEslintIgnore: true,
            eslintConfigPath: getFixturePath('eslint-config.js'),
            /* eslint-disable no-template-curly-in-string */
            mainTemplate: 'total: ${total}; passing: ${passing};\n' +
              'errorTotal: ${errorTotal}; warningTotal: ${warningTotal}; ' +
              'errorWarningsTotal: ${errorWarningsTotal}; lineTotal: ' +
              '${lineTotal};\nerrorWarningsPct: ${errorWarningsPct}',
            lintingTypeTemplate: 'text: ${text}; lintingType: ' +
              '${lintingType};\ntotal: ${total}; passing: ' +
              '${passing};\nerrorTotal: ${errorTotal}; warningTotal: ' +
              '${warningTotal};\nerrorWarningsTotal: ${errorWarningsTotal}; ' +
              'failing: ${failing};\nwarnings: ${warnings}; errors: ' +
              '${errors};\nfailingPct: ${failingPct}; warningsPct: ' +
              '${warningsPct}; errorsPct: ${errorsPct}',
            /* eslint-enable no-template-curly-in-string */
            // Using file contents from https://eslint.org/docs/developer-guide/working-with-custom-formatters#the-data-argument
            //   though triggering a warning for one rule instead
            file: 'test/fixtures/simple.js',
            textColor: 'orange,s{blue}',
            outputPath,
            logging
          });
          const contents = await readFile(outputPath, 'utf8');
          const expected = await readFile(eslintBadgeWithTemplatesPath, 'utf8');
          expect(contents).to.equal(expected);
          expect([...returnedRulesMeta.entries()].some(([ruleId]) => {
            return ruleId === 'curly';
          })).to.be.true;
          expect(returnedResults[0].filePath).to.contain(
            'test/fixtures/simple.js'
          );
          expect(returnedResults[0].errorCount).to.equal(1);
          expect(returnedResults[0].warningCount).to.equal(1);
        }
      );
      it(
        'should return `badgerEngine` results with `failingTemplate`',
        async function () {
          const {
            results: returnedResults,
            rulesMeta: returnedRulesMeta
          } = await badgerEngine({
            noUseEslintrc: true,
            noUseEslintIgnore: true,
            eslintConfigPath: getFixturePath('eslint-config.js'),
            /* eslint-disable no-template-curly-in-string */
            failingTemplate: '\nruleId: ${ruleId}; index: ${index}',
            /* eslint-enable no-template-curly-in-string */
            // Using file contents from https://eslint.org/docs/developer-guide/working-with-custom-formatters#the-data-argument
            //   though triggering a warning for one rule instead
            file: 'test/fixtures/simple.js',
            textColor: 'orange,s{blue}',
            outputPath,
            logging
          });
          const contents = await readFile(outputPath, 'utf8');
          const expected = await readFile(
            eslintBadgeWithFailingTemplatesPath, 'utf8'
          );
          expect(contents).to.equal(expected);
          expect([...returnedRulesMeta.entries()].some(([ruleId]) => {
            return ruleId === 'curly';
          })).to.be.true;
          expect(returnedResults[0].filePath).to.contain(
            'test/fixtures/simple.js'
          );
          expect(returnedResults[0].errorCount).to.equal(1);
          expect(returnedResults[0].warningCount).to.equal(1);
        }
      );

      // Todo: test special template arguments
    });

    it('should allow custom rule map as object', async function () {
      const {
        results: returnedResults,
        rulesMeta: returnedRulesMeta
      } = await badgerEngine({
        ruleMap: {
          'no-console': 'debugging'
        },
        file: 'test/fixtures/sample.js',
        logging: 'verbose',
        noUseEslintIgnore: true,
        noUseEslintrc: true,
        outputPath
      });
      const contents = await readFile(outputPath, 'utf8');
      const expected = await readFile(
        oneFailingSuggestionCustomRuleMap, 'utf8'
      );
      expect(contents).to.equal(expected);

      expect([...returnedRulesMeta.entries()].some(([ruleId]) => {
        return ruleId === 'no-console';
      })).to.be.true;
      expect(returnedResults[0].filePath).to.contain(
        'test/fixtures/sample.js'
      );
      expect(returnedResults[0].errorCount).to.equal(1);
      expect(returnedResults[0].warningCount).to.equal(0);
    });

    it('should throw with results not matching `rulesMeta`', function () {
      return expect(badger({
        file: 'test/fixtures/sample.js',
        textColor: 'orange,s{blue}',
        logging,
        rulesMeta,
        results: simpleResults
      })).to.be.rejectedWith(
        Error,
        'A rule in the results, `curly`, was not found in `rulesMeta`'
      );
    });

    it('should execute with `configPath` (as in CLI)', async function () {
      await badger({
        results: noConsoleResults,
        rulesMeta: consoleRulesMeta,
        configPath: getFixturePath('config.js'),
        outputPath
      });
      const contents = await readFile(outputPath, 'utf8');
      const expected = await readFile(oneFailingSuggestion, 'utf8');
      expect(contents).to.equal(expected);
    });

    it('should auto-set missing `source` in results', async function () {
      await badger({
        results: [{
          ...noConsoleResults[0],
          source: undefined
        }],
        // eslint-disable-next-line no-template-curly-in-string
        mainTemplate: '${passing}/${total}; lineTotal: ${lineTotal}',
        rulesMeta: consoleRulesMeta,
        configPath: getFixturePath('config.js'),
        outputPath
      });
      const contents = await readFile(outputPath, 'utf8');
      const expected = await readFile(oneFailingSuggestionWithLines, 'utf8');
      expect(contents).to.equal(expected);
    });
  });
});
