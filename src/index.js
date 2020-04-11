'use strict';

// Info: https://eslint.org/docs/developer-guide/working-with-custom-formatters

const fs = require('fs');
const {promisify} = require('util');
const {resolve} = require('path');

const badgeUp = require('badge-up').v2;
const template = require('es6-template-strings');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

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
* @typedef {PlainObject} FormatterBadgerOptions
* @property {string} [packageJsonPath=
* resolve(process.cwd(), './package.json')]
*/

/**
 * @param {external:ESLintResult[]} results
 * @param {PlainObject} data
 * @param {external:ESLintRulesMetaData} data.rulesMeta
 * @param {FormatterBadgerOptions} [options]
 * @returns {Promise<void>}
 */
module.exports = (results, {rulesMeta}, {packageJsonPath} = {}) => {
  return badger({results, rulesMeta, options: {packageJsonPath}});
};

/**
 * @param {PlainObject} cfg
 * @param {external:ESLintResult[]} cfg.results
 * @param {external:ESLintRulesMetaData} cfg.rulesMeta
 * @param {FormatterBadgerOptions} [cfg.options]
 * @returns {Promise<void>}
 */
const badger = module.exports.badger = async ({
  results, rulesMeta, options = {}
} = {}) => {
  const {packageJsonPath, configPath, noConfig} = options;

  // The `noConfig` allows our CLI to set this when neither `configPath`
  //   nor `packageJsonPath` is set, but we otherwise default to the
  //   `package.json` in the current working directory since otherwise,
  //    `eslint -f .`-style calls will have no way to get at options.
  const opts = noConfig
    ? options
    : configPath
      // eslint-disable-next-line import/no-dynamic-require, global-require
      ? require(configPath)
      // eslint-disable-next-line import/no-dynamic-require, global-require
      : require(
        packageJsonPath || resolve(process.cwd(), './package.json')
      ).eslintFormatterBadgerOptions || options;

  /**
  * @external EslintFormatterBadgerRuleMap
  * @see https://eslint.org/docs/developer-guide/nodejs-api#cliengine-getrules
  */

  /**
  * @typedef {PlainObject} EslintFormatterBadgerRuleMapOptions
  * @property {external:RuleMap|external:EslintFormatterBadgerRuleMap} ruleMap
  */

  /**
   * Note that this should really be an intersection of the types.
   * @type {EslintFormatterBadgerOptions|
   * EslintFormatterBadgerRuleMapOptions} options
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
    // Todo: Make separate thresholds for errors and warnings?
    mediumThreshold = '', // "80%" or "9"
    passingThreshold = '100%', // "95%" or "2"
    mediumThresholds = '', // "suggestion=30,layout=40" or just "40"
    passingThresholds = '100%', // "suggestion=75,layout=90" or just "80"
    /* eslint-disable no-template-curly-in-string */
    mainTemplate = 'ESLint (${passing}/${total} rules passing)',
    lintingTypeTemplate = '${lintingType}: ${failing}',
    missingLintingTemplate = '\n${index}. ${ruleId}',
    failingTemplate = null,
    lintingTypeColor = null
    /* eslint-enable no-template-curly-in-string */
  } = opts;
  if (!outputPath || typeof outputPath !== 'string') {
    throw new TypeError('Bad output path provided.');
  }
  let {
    textColor,
    filteredTypes = null
  } = opts;

  const rulesMetaEntries =
    {}.toString.call(rulesMeta) === '[object Map]'
      ? [...rulesMeta.entries()].map(([ruleId, {meta}]) => {
        // Slightly different format between:
        // 1. The `data` argument per: https://eslint.org/docs/developer-guide/working-with-custom-formatters
        // 2. `cli.getRules()` per: https://eslint.org/docs/developer-guide/nodejs-api#cliengine-getrules
        return [ruleId, meta];
      })
      : Object.entries(rulesMeta);
  const total = rulesMetaEntries.length;

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
  console.log('aggregatedErrorCount + aggregatedWarningCount', aggregatedErrorCount,
      aggregatedWarningCount, aggregatedErrorCount + aggregatedWarningCount);
  const aggregatedErrorsAndWarningsCount = aggregatedErrorCount +
    aggregatedWarningCount;
  const aggregatedErrorsAndWarningsPct =
    aggregatedErrorsAndWarningsCount / total;

  /**
   * @param {string} color
   * @param {string} threshold
   * @param {string} thresholdColor
   * @returns {string}
   */
  function checkThreshold (color, threshold, thresholdColor) {
    if (!color && threshold) {
      if (threshold.endsWith('%')) {
        const thresh = Number.parseFloat(threshold.slice(0, -1));
        if (thresh > aggregatedErrorsAndWarningsPct) {
          color = thresholdColor;
        }
      } else {
        const thresh = Number.parseFloat(threshold);
        if (thresh > aggregatedErrorsAndWarningsCount) {
          color = thresholdColor;
        }
      }
    }
    return color;
  }

  /**
   * Gets the color per current counts and thresholds.
   * @param {string} mediumThresh
   * @param {string} passingThresh
   * @returns {string[]}
  */
  function getColorForCount (mediumThresh, passingThresh) {
    let color;
    color = checkThreshold(color, passingThresh, passingColor);
    color = checkThreshold(color, mediumThresh, mediumColor);
    if (!color) {
      color = failingColor;
    }

    return color;
  }

  // eslint-disable-next-line prefer-const
  let lintingTypesWithColors;
  /**
   * @returns {void}
   */
  async function printBadge () {
    const sections = [
      [
        template(
          mainTemplate,
          {
            total,
            passing: total - aggregatedErrorsAndWarningsCount,
            errorTotal: aggregatedErrorCount,
            warningTotal: aggregatedWarningCount,
            errorWarningsTotal: aggregatedErrorsAndWarningsCount,
            lineTotal: aggregatedLineCount,

            errorWarningsPct: aggregatedErrorsAndWarningsPct
          }
        ),
        ...(textColor || [getColorForCount(mediumThreshold, passingThreshold)])
      ],
      ...(lintingTypesWithColors || [])
    ];

    if (logging === 'verbose') {
      // eslint-disable-next-line no-console
      console.log(
        'Using linting', lintingInfo, '\nprinting sections:\n', sections
      );
    }

    const svg = await badgeUp(sections);
    await writeFile(outputPath, svg);
  }

  if (typeof textColor === 'string') {
    textColor = textColor.split(',');
  }

  if (singlePane) {
    await printBadge();
    return;
  }

  // DEFINITIONS OF USER
  const userRuleIdToType = ruleMap
    ? typeof ruleMap === 'string'
      // eslint-disable-next-line global-require, import/no-dynamic-require
      ? require(ruleMap)
      : ruleMap
    : {};

  // ALL RULES USED (passing or failing)
  const ruleIdToType = rulesMetaEntries.reduce((obj, [ruleId, info]) => {
    let {
      type
      // Might also destructure `docs` and then use:
      //   const {category} = docs || {}; // "Possible Errors"
    } = info || {};
    if (userRuleIdToType[ruleId]) {
      type = userRuleIdToType[ruleId];
    }
    if (!type) {
      type = 'missing';
    }
    obj[ruleId] = type;
    return obj;
  }, {});

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

  // ALL POSSIBLE TYPES PER USER (if any) + DEFAULTS
  const lintingTypes = ruleMap
    ? [...new Set([
      ...defaultLintingTypes, ...Object.values(userRuleIdToType)
    ])]
    : defaultLintingTypes;

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

  const thresholdContainer = {
    medium: null,
    passing: null
  };

  /**
   * @param {string} range
   * @param {string} thresholds
   * @returns {void}
   */
  const parseThreshold = (range, thresholds) => {
    const typeThresholds = thresholds.split(',');
    if (typeThresholds.length === 1) {
      thresholdContainer[range] = typeThresholds[0];
      return;
    }
    thresholdContainer[range] = {};
    typeThresholds.forEach((typeThreshold) => {
      const [type, value] = typeThreshold.split('=');
      thresholdContainer[range][type] = value;
    });
  };
  // "suggestion=6;layout=10" or just "9"
  parseThreshold('passing', passingThresholds);
  parseThreshold('medium', mediumThresholds);

  /**
   * @param {string} type
   * @param {"passing"|"medium"} range
   * @returns {string}
   */
  function getThresholdForRangeAndType (type, range) {
    let thresh;
    if (thresholdContainer[range]) {
      if (typeof thresholdContainer[range] === 'string') {
        thresh = thresholdContainer[range];
      } else {
        thresh = thresholdContainer[range][type];
      }
    }
    return thresh;
  }
  /**
   * @param {string} type
   * @returns {string[]}
   */
  function getColorForThresholds (type) {
    const color = getColorForCount(
      getThresholdForRangeAndType('medium', type),
      getThresholdForRangeAndType('passing', type)
    );
    return [color];
  }

  lintingTypesWithColors = filteredLintingTypes.map((
    [lintingType, {
      text, ruleIds,
      failing, warnings, errors
    }]
  ) => {
    const glue = (ruleId, index) => {
      return template(failingTemplate, {
        ruleId,
        index
      });
    };

    let color;
    if (lintingTypeColor) {
      color = lintingTypeColor.map((lintingTypeClr) => {
        return lintingTypeClr.split(',');
      }).find(([typ]) => {
        return lintingType === typ;
      });
      color = color && color[1];
    }
    if (!color) {
      color = getColorForThresholds(lintingType);
    }

    return [
      `${template(lintingTypeTemplate, {
        text,
        lintingType,

        total,
        passing: total - aggregatedErrorsAndWarningsCount,
        errorTotal: aggregatedErrorCount,
        warningTotal: aggregatedWarningCount,
        errorWarningsTotal: aggregatedErrorsAndWarningsCount,

        failing,
        warnings,
        errors,

        failingPct: failing / aggregatedErrorsAndWarningsCount,
        warningsPct: warnings / aggregatedWarningCount,
        errorsPct: errors / aggregatedErrorCount
      })}\n${failing && failingTemplate
        ? ruleIds.sort().map((ruleId, i) => {
          return glue(ruleId, i + 1);
        }).join('')
        : ''
      }`,
      ...color
    ];
  });

  await printBadge();
};
