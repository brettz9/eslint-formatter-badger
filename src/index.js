'use strict';

// Todo: Convert this for eslint-formatter-badger! Should use colors depending
//   on failing thresholds instead

const fs = require('fs');
const {promisify} = require('util');
const {resolve} = require('path');

const badgeUp = require('badge-up').v2;
const template = require('es6-template-strings');

const readFile = promisify(fs.readFile);
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
 * @external ESLintResult
 * @see https://eslint.org/docs/developer-guide/working-with-custom-formatters#the-result-object
 * @see For messages, see https://eslint.org/docs/developer-guide/working-with-custom-formatters#the-message-object
 */

/**
* @external ESLintRulesMetaData
* @see https://eslint.org/docs/developer-guide/working-with-custom-formatters#the-data-argument
*/

// eslint-disable-next-line import/no-dynamic-require
const options = require(resolve(process.cwd(), './package.json'));

/**
 * @param {ESLintResult[]} results
 * @param {PlainObject} data
 * @param {ESLintRulesMetaData} data.rulesMeta
 * @returns {Promise<void>}
 */
module.exports = async (results, {rulesMeta}) => {
  /**
   * @type {EslintFormatterBadgerOptions} options
   */
  const {
    // Path to module returning or JSON of custom map between
    //   rule names and categories (including existing like "layout"
    //   (in case rule doesn't have own meta) or new ones like
    //   "security" or "performance")
    ruleMap,
    outputPath = resolve(process.cwd(), './eslint-badge.svg'),
    logging = false,
    failingColor = 'red',
    mediumColor = 'CCCC00', // dark yellow
    passingColor = 'green',
    // Whether to only create one template (also using `lintingTypeTemplate`)
    singlePane = false,
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

  const rulesMetaEntries = Object.entries(rulesMeta);
  const total = rulesMetaEntries.length;

  let rulesToType = rulesMetaEntries.reduce((obj, [ruleId, {
    type
    // Might also use destructure `docs` and then use:
    //   const {category} = docs || {}; // "Possible Errors"
  }]) => {
    obj[ruleId] = type;
    return obj;
  }, {});
  if (ruleMap) {
    const userRulesToType = typeof ruleMap === 'string'
      // eslint-disable-next-line global-require, import/no-dynamic-require
      ? require(ruleMap)
      : ruleMap;
    rulesToType = {...rulesToType, ...userRulesToType};
  }

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

  // Unlike other reporters, unlikely to need to report on each file
  //  separately (i.e., to make a separate badge for each file)
  const aggregatedMessages = [];
  let aggregatedErrorCount = 0;
  let aggregatedWarningCount = 0;
  let aggregatedLineCount = 0;
  await Promise.all(
    results.map(async ({
      messages,
      filePath,
      errorCount,
      warningCount,
      source
    }) => {
      aggregatedMessages.push(...messages);
      // ruleId, severity; message
      aggregatedErrorCount += errorCount;
      aggregatedWarningCount += warningCount;
      if (!source) {
        source = await readFile(filePath, 'utf8');
      }
      aggregatedLineCount += source.split('\n').length;
    })
  );

  // Note: These messages are not in a consistent order
  const usedTypesToCount = aggregatedMessages.reduce((obj, {
    ruleId
    // severity, // 1 for warnings or 2 for errors
    // message // , line, column, nodeType
  }) => {
    const type = rulesToType[ruleId]; // e.g., "layout"
    if (!obj[type]) {
      obj[type] = 0;
    }
    obj[type]++;
    return obj;
  }, {});

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

  if (typeof textColor === 'string') {
    textColor = textColor.split(',');
  }
  const sections = [
    [template(mainTemplate, {
      // lintingTypeCount: usedLintingTypes.length
      total,
      errorTotal: aggregatedErrorCount,
      warningTotal: aggregatedWarningCount,
      lineTotal: aggregatedLineCount
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
