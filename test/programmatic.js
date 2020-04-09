import {readFile as rf, unlink as ul} from 'fs';
import {promisify} from 'util';
import {join} from 'path';
import {filesizeBadger} from '../src/index.js';

const logging = 'verbose';

const readFile = promisify(rf);
const unlink = promisify(ul);

const getFixturePath = (path) => {
  return join(__dirname, `fixtures/${path}`);
};
const getResultsPath = (path) => {
  return join(__dirname, `results/${path}`);
};

const filesizeBadgePath = join(__dirname, '../filesize-badge.svg');
const outputPath = getResultsPath('results.svg');
const filesizeBadgeFixturePath = 'filesize-badge.svg';
const textColorPath = getFixturePath('text-color.svg');
const emptyTextTemplatePath = getFixturePath('emptyTextTemplatePath.svg');
const emptySizeTypesPath = getFixturePath('emptySizeTypesPath.svg');
const redBundleSizePath = getFixturePath('redBundleSizePath.svg');
const blueMinSizeFalsePath = getFixturePath('blueMinSizeFalsePath.svg');
const blueGzippedFalseSizePath = getFixturePath('blueGzippedFalseSizePath.svg');
const blueMinAndGzippedSizeFalsePath = getFixturePath(
  'blueMinAndGzippedSizeFalsePath.svg'
);

describe('`filesizeBadger`', function () {
  this.timeout(15000);
  it('should throw with a bad output path', async () => {
    let err;
    try {
      await filesizeBadger({outputPath: '', fileName: 'file.js', logging});
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

    it('should work with default output path', async function () {
      await filesizeBadger({
        file: 'test/fixtures/sample.js',
        filesizeFormat: {},
        textColor: 'orange,s{blue}',
        logging
      });
      const contents = await readFile(filesizeBadgePath, 'utf8');
      const expected = await readFile(filesizeBadgeFixturePath, 'utf8');
      expect(contents).to.equal(expected);
    });

    it('should work with string text color', async function () {
      await filesizeBadger({
        file: 'test/fixtures/sample.js',
        filesizeFormat: {},
        outputPath,
        textColor: 'orange,s{blue}',
        logging
      });
      const contents = await readFile(outputPath, 'utf8');
      const expected = await readFile(textColorPath, 'utf8');
      expect(contents).to.equal(expected);
    });

    it('should work with empty `textTemplate`', async function () {
      await filesizeBadger({
        file: 'test/fixtures/sample.js',
        filesizeFormat: {},
        textTemplate: '',
        outputPath,
        textColor: 'orange,s{blue}',
        logging
      });
      const contents = await readFile(outputPath, 'utf8');
      const expected = await readFile(emptyTextTemplatePath, 'utf8');
      expect(contents).to.equal(expected);
    });

    it('should work with empty `sizeTypes`', async function () {
      await filesizeBadger({
        file: 'test/fixtures/sample.js',
        filesizeFormat: {},
        showBrotliSize: true,
        /* eslint-disable no-template-curly-in-string */
        textTemplate: 'File path: ${filePath}; file name: ${fileName}; ' +
          'bundle size: ${bundleSize}; brotli size: ${brotliSize}; min ' +
          'size: ${minSize}; gzip size: ${gzipSize}',
        /* eslint-enable no-template-curly-in-string */
        sizeTypes: '',
        outputPath,
        textColor: 'orange,s{blue}',
        logging
      });
      const contents = await readFile(outputPath, 'utf8');
      const expected = await readFile(emptySizeTypesPath, 'utf8');
      expect(contents).to.equal(expected);
    });

    it('should work with non-default `sizeColors`', async function () {
      await filesizeBadger({
        file: 'test/fixtures/sample.js',
        filesizeFormat: {},
        outputPath,
        sizeTypes: ['bundleSize'],
        sizeColors: ['red,s{white}'],
        logging
      });
      const contents = await readFile(outputPath, 'utf8');
      const expected = await readFile(redBundleSizePath, 'utf8');
      expect(contents).to.equal(expected);
    });

    it(
      'should work with `showMinifiedSize` and `showGzippedSize` disabled ' +
        'and `filesizeFormat` enabled',
      async function () {
        await filesizeBadger({
          file: 'test/fixtures/sample.js',
          showMinifiedSize: false,
          showGzippedSize: false,
          filesizeFormat: {
            bits: true
          },
          outputPath,
          sizeTypes: ['minSize', 'gzipSize', 'bundleSize'],
          sizeColors: ['yellow', 'orange', 'blue,s{white}'],
          logging
        });
        const contents = await readFile(outputPath, 'utf8');
        const expected = await readFile(blueMinAndGzippedSizeFalsePath, 'utf8');
        expect(contents).to.equal(expected);
      }
    );

    it(
      'should work with `showGzippedSize` disabled and ' +
        '`filesizeFormat` enabled',
      async function () {
        await filesizeBadger({
          file: 'test/fixtures/sample.js',
          showGzippedSize: false,
          filesizeFormat: {
            bits: true
          },
          outputPath,
          sizeTypes: ['gzipSize', 'bundleSize'],
          sizeColors: ['yellow', 'blue,s{white}'],
          logging
        });
        const contents = await readFile(outputPath, 'utf8');
        const expected = await readFile(blueGzippedFalseSizePath, 'utf8');
        expect(contents).to.equal(expected);
      }
    );

    it(
      'should work with `showMinifiedSize` disabled and `filesizeFormat`' +
      'enabled',
      async function () {
        await filesizeBadger({
          file: 'test/fixtures/sample.js',
          showMinifiedSize: false,
          filesizeFormat: {
            bits: true
          },
          outputPath,
          sizeTypes: ['minSize', 'bundleSize'],
          sizeColors: ['yellow', 'blue,s{white}'],
          logging
        });
        const contents = await readFile(outputPath, 'utf8');
        const expected = await readFile(blueMinSizeFalsePath, 'utf8');
        expect(contents).to.equal(expected);
      }
    );
  });
});
