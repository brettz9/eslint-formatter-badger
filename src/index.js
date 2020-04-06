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
    text: 'Problem'
  }],
  ['suggestion', {
    text: 'Suggestion'
  }],
  ['layout', {
    text: 'Layout'
  }],
  ['missing', {
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
    // Path to module returning or JSON of custom map between
    //   rule names and categories (including existing like "layout"
    //   (in case rule doesn't have own meta) or new ones like
    //   "security" or "performance")
    ruleMapPath,
    outputPath = resolve(process.cwd(), './eslint-badge.svg'),
    logging = false,
    failingColor = 'red',
    mediumColor = 'CCCC00', // dark yellow
    passingColor = 'green',
    singlePane = false, // Whether to only create one template (also using `lintingTypeTemplate`)
    mediumThresholds, // "suggestion=30;layout=40" or just "40"
    passingThresholds, // "suggestion=75;layout=90" or just "80"
    /* eslint-disable no-template-curly-in-string */
    mainTemplate = 'ESLint (${total} rules)',
    lintingTypeTemplate = '${type}: ${typeTotal}',
    missingLintingTemplate = '\n${index}. ${ruleId}'
    /* eslint-enable no-template-curly-in-string */
  } = options;
  if (!outputPath || typeof outputPath !== 'string') {
    throw new TypeError('Bad output path provided.');
  }
  let {
    textColor = defaultTextColor,
    filteredTypes = null
  } = options;

  let lintingInfo; // Todo: Get

  const usedLintingTypes = [];

  // Todo: Merge with user's own map
  // singlePane = false, // Whether to only create one template
  //   (also using `lintingTypeTemplate`)
  const lintingTypesWithMissing = lintingTypes.map((
    [type, {text}]
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
    case 'missing':
      specialTemplate(type, missingLintingTemplate);
      break;
    default:
      break;
    }

    const lintingTypeList = [...lintingInfo.get(type)];
    const lintingTypeCount = lintingTypeList.length;
    usedLintingTypes.push(...lintingTypeList);
    return [type, {text, lintingTypeCount, lintingTypeList}];
  });

  filteredTypes = filteredTypes
    ? filteredTypes.split(',')
    : [];

  let filteredLintingTypes = lintingTypesWithMissing;
  const nonemptyPos = filteredTypes.indexOf('nonempty');
  if (nonemptyPos > -1) {
    filteredTypes.splice(nonemptyPos, 1);
    filteredLintingTypes = filteredLintingTypes.filter((
      [type, {lintingTypeCount}]
    ) => {
      return lintingTypeCount || filteredTypes.includes(type);
    });
  }

  // We need to get at eslint config so as to:
  //  1. Find total number of rules in use (not just failing rules)
  //  2. Get at rule meta-data (to determine rule type)

  // We should also get at source of *all* linted files (e.g., while `source`
  //   of reported `files could let us get at line count, it would only be
  //   for reported files and not indicating whole size of project being
  //   successfully linted)

  // Unlike other reporters, unlikely to need to report on each file
  //  separately (i.e., to make a separate badge for each file)
  const aggregatedMessages = [];
  let aggregatedErrorCount = 0;
  let aggregatedWarningCount = 0;
  results.forEach(({
    messages,
    filePath,
    errorCount, warningCount
  }) => {
    aggregatedMessages.push(...messages);
    // ruleId, severity; message
    aggregatedErrorCount += errorCount;
    aggregatedWarningCount += warningCount;
  });

  const lintingTypesWithColors = filteredLintingTypes.map((
    [type, {text, lintingTypeCount, lintingTypeList}]
  ) => {
    const glue = (lintingType, index) => {
      return template(lintingTypeTemplate, {
        lintingType,
        index
      });
    };

    failingColor = 'red',
    mediumColor = 'CCCC00', // dark yellow
    passingColor = 'green',

    mediumThresholds, // "suggestion=30;layout=40" or just "40"
    passingThresholds; // "suggestion=75;layout=90" or just "80"

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
      ...color
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
      severity, // 1 for warnings or 2 for errors
      message // , line, column, nodeType
    }, i) => {

    });
  });

  if (typeof textColor === 'string') {
    textColor = textColor.split(',');
  }
  const sections = [
    [template(mainTemplate, {
      // lintingTypeCount: usedLintingTypes.length
      total
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
