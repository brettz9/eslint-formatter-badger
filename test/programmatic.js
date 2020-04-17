import {readFile as rf, unlink as ul} from 'fs';
import {promisify} from 'util';
import {join} from 'path';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {badger, badgerEngine} from '../src/index.js';
import rulesMeta from './fixtures/rulesMeta.js';
import simpleResults from './fixtures/simpleResults.js';

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
const textColorPath = getFixturePath('text-color.svg');
const emptyTextTemplatePath = getFixturePath('emptyTextTemplatePath.svg');

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

    describe('`badgerEngine`', function () {
      it('should return `badgerEngine` results', async function () {
        const {
          results,
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

        expect(results[0].filePath).to.contain('test/fixtures/simple.js');
        expect(results[0].errorCount).to.equal(1);
        expect(results[0].warningCount).to.equal(1);
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

    it('should work with string text color', async function () {
      await badger({
        file: 'test/fixtures/sample.js',
        outputPath,
        textColor: 'orange,s{blue}',
        logging
      });
      const contents = await readFile(outputPath, 'utf8');
      const expected = await readFile(textColorPath, 'utf8');
      expect(contents).to.equal(expected);
    });

    it('should work with empty `textTemplate`', async function () {
      await badger({
        file: 'test/fixtures/sample.js',
        textTemplate: '',
        outputPath,
        textColor: 'orange,s{blue}',
        logging
      });
      const contents = await readFile(outputPath, 'utf8');
      const expected = await readFile(emptyTextTemplatePath, 'utf8');
      expect(contents).to.equal(expected);
    });
  });
});
