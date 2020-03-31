'use strict';

// Todo: Convert this for eslint-formatter-badger! Should use colors depending
//   on failing thresholds instead

const fs = require('fs');
const {promisify} = require('util');
const {resolve} = require('path');

const badgeUp = require('badge-up').v2;
const template = require('es6-template-strings');

const writeFile = promisify(fs.writeFile);

const defaultTextColor = ['navy'];
const lintingTypes = [
  ['problem', {
    color: ['darkgreen'],
    text: 'Problem'
  }],
  ['suggestion', {
    color: ['green'],
    text: 'Suggestion'
  }],
  ['layout', {
    color: ['CCCC00'], // dark yellow
    text: 'Layout'
  }],
  ['uncategorized', {
    // darkgray is lighter than gray!
    color: ['darkgray'],
    text: 'Uncategorized'
  }],
  ['missing', {
    color: ['lightgray'],
    text: 'Missing'
  }]
];

/**
 * @external EslintResult
 * @see https://eslint.org/docs/developer-guide/working-with-custom-formatters#the-result-object
 * @see For messages, see https://eslint.org/docs/developer-guide/working-with-custom-formatters#the-message-object
 */

/**
 * @param {EslintResult[]} results
 * @returns {Promise<void>}
 */
module.exports = async (results) => {
  /**
   * @type {EslintFormatterBadgerOptions} options
   */
  const {
    packagePath,
    packageJson,
    production,
    allDevelopment,
    outputPath = resolve(process.cwd(), './eslint-badge.svg'),
    logging = false,
    textTemplate = 'ESLint',
    /* eslint-disable no-template-curly-in-string */
    lintingTypeTemplate = '${type}: ${total}',
    uncategorizedLintingTemplate = '\n${index}. ${ruleId}',
    /* eslint-enable no-template-curly-in-string */
    filteredTypes = null,
    textColor = defaultTextColor,
    lintingTypeColor = []
  } = options;
  if (!outputPath || typeof outputPath !== 'string') {
    throw new TypeError('Bad output path provided.');
  }
  if (typeof textColor === 'string') {
    textColor = textColor.split(',');
  }

  const lintingTypeColorInfo = lintingTypeColor.map((typeAndColor) => {
    const [type, colors] = typeAndColor.split('=');
    return [type, colors.split(',')];
  });
  const customLintingTypeToColor = new Map(
    lintingTypeColorInfo
  );

  let lintingInfo; // Todo: Get

  const usedLintingTypes = [];
  const lintingTypesWithUncategorized = lintingTypes.map((
    [type, {color, text}]
  ) => {
    if (!lintingInfo.has(type)) {
      lintingInfo.set(type, new Set());
    }

    const specialTemplate = (typ, templ) => {
      const mapped = [...lintingInfo.get(typ)].map((
        {name, custom, lintingType}
      ) => {
        return template(templ, {
          name, custom, lintingType
        });
      });
      if (mapped.length) {
        // Get rid of objects now that data mapped
        const set = lintingInfo.get(type);
        set.clear();
        mapped.forEach((item) => {
          set.add(item);
        });
      }
    };

    switch (type) {
    case 'uncategorized':
    case 'missing':
      specialTemplate(type, uncategorizedLintingTemplate);
      break;
    default:
      break;
    }

    const lintingTypeList = [...lintingInfo.get(type)];
    const lintingTypeCount = lintingTypeList.length;
    usedLintingTypes.push(...lintingTypeList);
    return [type, {color, text, lintingTypeCount, lintingTypeList}];
  });

  filteredTypes = filteredTypes
    ? filteredTypes.split(',')
    : [];

  let filteredLintingTypes = lintingTypesWithUncategorized;
  const nonemptyPos = filteredTypes.indexOf('nonempty');
  if (nonemptyPos > -1) {
    filteredTypes.splice(nonemptyPos, 1);
    filteredLintingTypes = filteredLintingTypes.filter((
      [type, {lintingTypeCount}]
    ) => {
      return lintingTypeCount || filteredTypes.includes(type);
    });
  }

  const lintingTypesWithColors = filteredLintingTypes.map((
    [type, {color, text, lintingTypeCount, lintingTypeList}]
  ) => {
    const glue = (lintingType, index) => {
      return template(lintingTypeTemplate, {
        lintingType,
        index
      });
    };
    return [
      `${template(lintingTypeTemplate, {
        text,
        lintingTypeCount
      })}\n${lintingTypeCount
        ? lintingTypeList.sort().map((lintingType, i) => {
          return glue(lintingType, i + 1);
        }).join('')
        : ''
      }`,
      ...(customLintingTypeToColor.has(type)
        ? customLintingTypeToColor.get(type)
        : color)
    ];
  });

  results.forEach(({
    messages,
    filePath, // Use for config
    errorCount, warningCount
    // , source, output
  }) => {
    messages.forEach(({
      ruleId,
      severity // 1 for warnings or 2 for errors
      // , message, line, column, nodeType
    }, i) => {

    });
  });

  const sections = [
    [template(textTemplate, {
      lintingTypeCount: usedLintingTypes.length
    }), ...textColor],
    ...lintingTypesWithColors
  ];

  if (logging === 'verbose') {
    // eslint-disable-next-line no-console
    console.log(
      'Using linting', lintingInfo, '\nprinting sections:\n', sections
    );
  }

  const svg = await badgeUp(sections);
  await writeFile(outputPath, svg);
};
