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
const outputPath = getResultsPath('results.svg');
const eslintBadgeFixturePath = getFixturePath('eslint-badge.svg');
const mainEslintBadgeFixturePath = getFixturePath('main-eslint-badge.svg');
const oneFailingSuggestion = getFixturePath('1-failing-suggestion.svg');

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

    describe('Main badger export (`eslint -f`)', function () {
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
  });
});
