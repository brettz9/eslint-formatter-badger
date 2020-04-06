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

const defaultLintingTypes = [
  'problem', 'suggestion', 'layout', 'missing'
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

/**
 * @param {ESLintResult[]} results
 * @param {PlainObject} data
 * @param {ESLintRulesMetaData} data.rulesMeta
 * @returns {Promise<void>}
 */
module.exports = async (results, {rulesMeta}, {packageJsonPath} = {}) => {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const options = require(
    packageJsonPath || resolve(process.cwd(), './package.json')
  );

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
    mediumThreshold, // "80%" or "9"
    passingThreshold, // "95%" or "2"
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

  // DEFINITIONS OF USER
  const userRuleIdToType = ruleMap
    ? typeof ruleMap === 'string'
      // eslint-disable-next-line global-require, import/no-dynamic-require
      ? require(ruleMap)
      : ruleMap
    : {};

  // ALL POSSIBLE TYPES PER USER (if any) + DEFAULTS
  const lintingTypes = ruleMap
    ? [...new Set([
      ...defaultLintingTypes, ...Object.values(userRuleIdToType)
    ])]
    : defaultLintingTypes;

  // ALL RULES USED (passing or failing)
  const ruleIdToType = rulesMetaEntries.reduce((obj, [ruleId, {
    type
    // Might also use destructure `docs` and then use:
    //   const {category} = docs || {}; // "Possible Errors"
  }]) => {
    if (userRuleIdToType[ruleId]) {
      type = userRuleIdToType[ruleId];
    }
    if (!type) {
      type = 'missing';
    }
    obj[ruleId] = type;
    return obj;
  }, {});

  // Unlike other reporters, unlikely to need to report on each file
  //  separately (i.e., to make a separate badge for each file)
  const aggregatedMessages = [];
  let aggregatedErrorCount = 0;
  let aggregatedWarningCount = 0;
  // Includes both passing and failing files
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

  // FAILING TYPE COUNTS ONLY
  // Note: These messages are not in a consistent order
  const lintingInfo = aggregatedMessages.reduce((obj, {
    ruleId,
    severity // 1 for warnings or 2 for errors
    // message // , line, column, nodeType
  }) => {
    const type = ruleIdToType[ruleId]; // e.g., "layout"
    if (!obj[type]) {
      obj[type] = {
        failing: 0,
        warnings: 0,
        errors: 0,
        ruleIds: []
      };
    }
    obj[type].ruleIds.push(ruleId);
    obj[type].failing++;
    switch (severity) {
    case 1:
      obj[type].warnings++;
      break;
    /* case 2: */ default:
      obj[type].errors++;
      break;
    }
    return obj;
  }, {});

  // singlePane = false, // Whether to only create one template
  //   (also using `lintingTypeTemplate`)
  const lintingTypesWithMissing = lintingTypes.map((type) => {
    const text = type.charAt().toUpperCase() + type.slice(1);
    if (!lintingInfo[type]) {
      lintingInfo[type] = {
        failing: 0,
        warnings: 0,
        errors: 0,
        ruleIds: []
      };
    }
    const {
      failing = 0,
      warnings = 0,
      errors = 0,
      ruleIds = []
    } = lintingInfo[type];

    const specialTemplate = (typ, templ) => {
      const mapped = ruleIds.map((ruleId, i) => {
        return template(templ, {
          index: i + 1,
          ruleId,
          lintingType: type
        });
      });
      if (mapped.length) {
        // Get rid of objects now that data mapped
        const set = lintingInfo[type];
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

    return [type, {
      text, ruleIds,
      failing, warnings, errors
    }];
  });

  filteredTypes = filteredTypes
    ? filteredTypes.split(',')
    : [];

  let filteredLintingTypes = lintingTypesWithMissing;
  const nonemptyPos = filteredTypes.indexOf('nonempty');
  if (nonemptyPos > -1) {
    filteredTypes.splice(nonemptyPos, 1);
    filteredLintingTypes = filteredLintingTypes.filter((
      [type, {failing}]
    ) => {
      return failing || filteredTypes.includes(type);
    });
  }

  const lintingTypesWithColors = filteredLintingTypes.map((
    [type, {
      text, ruleIds,
      failing, warnings, errors
    }]
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

    // Todo: Make separate thresholds for errors and warnings?
    mediumThreshold, // "80%" or "9"
    passingThreshold, // "95%" or "2"
    mediumThresholdByType, // "suggestion=6;layout=10" or just "9"
    passingThresholdByType; // "suggestion=0;layout=1" or just "2"

    return [
      `${template(lintingTypeTemplate, {
        text,

        aggregatedErrorCount,
        aggregatedWarningCount,

        failing,
        warnings,
        errors,

        failingPct: failing / (aggregatedErrorCount + aggregatedWarningCount),
        warningsPct: warnings / aggregatedWarningCount,
        errorsPct: errors / aggregatedErrorCount
      })}\n${failing
        ? ruleIds.sort().map((ruleId, i) => {
          return glue(ruleId, i + 1);
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
      // failing?
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
