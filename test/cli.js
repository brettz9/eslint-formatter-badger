'use strict';
const {readFile: rf, unlink: ul} = require('fs');
const {promisify} = require('util');
const {join} = require('path');
const {execFile: ef} = require('child_process');

const readFile = promisify(rf);
const execFile = promisify(ef);
const unlink = promisify(ul);

const binFile = join(__dirname, '../bin/index.js');

const getFixturePath = (path) => {
  return join(__dirname, `fixtures/${path}`);
};
const getResultsPath = (path) => {
  return join(__dirname, `results/${path}`);
};
const outputPath = getResultsPath('cli-results.svg');
const cliSimplePath = getFixturePath('cliSimplePath.svg');
const cliSizeTypesPath = getFixturePath('cliSizeTypesPath.svg');

describe('Binary', function () {
  this.timeout(8000);
  it('should log help', async function () {
    const {stdout} = await execFile(binFile, ['-h']);
    expect(stdout).to.contain(
      'Create file size badges'
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
          '--filesizeFormat', '{}',
          '--logging', 'verbose',
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
      const expected = await readFile(cliSimplePath, 'utf8');
      expect(contents).to.equal(expected);
    });

    it('should execute with `sizeTypes`', async function () {
      const {stdout, stderr} = await execFile(
        binFile,
        [
          '--file', 'test/fixtures/sample.js',
          '--filesizeFormat', '{}',
          '--logging', 'verbose',
          '--sizeTypes', 'brotliSize,minSize',
          '--showBrotliSize',
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
      const expected = await readFile(cliSizeTypesPath, 'utf8');
      expect(contents).to.equal(expected);
    });
  });
});
