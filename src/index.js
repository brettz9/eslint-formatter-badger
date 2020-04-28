'use strict';

// Info: https://eslint.org/docs/developer-guide/working-with-custom-formatters

const fs = require('fs');
const {promisify} = require('util');
const {resolve} = require('path');

const {CLIEngine} = require('eslint');
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
 * @param {external:ESLintResult[]} results
 * @param {PlainObject} data
 * @param {external:ESLintRulesMetaData} data.rulesMeta
 * @param {EslintFormatterBadgerOptions} [options]
 * @returns {""}
 */
module.exports = (results, {rulesMeta}, options = {}) => {
  (async () => {
    await badger({logging: 'verbose', ...options, results, rulesMeta});
  })();
  // ESLint formatters can't return Promises, but they don't
  //  prematurely exit either, so we can use the Promise above,
  //  though without the benefit of chaining to the process
  return '';
};

/**
 * @param {FormatterBadgerOptions} cfg
 * @param {external:ESLintResult[]} cfg.results
 * @param {external:ESLintRulesMetaData} cfg.rulesMeta
 * @returns {Promise<void>}
 */
const badger = module.exports.badger = async ({
  results, rulesMeta, ...options
}) => {
  const {packageJsonPath, configPath, noConfig} = options;

  // Unless neither `configPath` nor `packageJsonPath` are set, we
  //    default to the package.json` in the current working directory
  //    since otherwise `eslint -f .`-style calls will have no way to
  //    get at options.
  const opts = noConfig
    ? options
    : configPath
      // eslint-disable-next-line import/no-dynamic-require, node/global-require
      ? {...require(configPath), ...options}
      : {
        // eslint-disable-next-line max-len
        // eslint-disable-next-line import/no-dynamic-require, node/global-require
        ...require(
          packageJsonPath || resolve(process.cwd(), './package.json')
        ).eslintFormatterBadgerOptions,
        ...options
      };

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

  const log = (...msgs) => {
    if (logging === 'verbose') {
      // eslint-disable-next-line no-console
      console.log(...msgs);
    }
  };

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

  const aggregatedErrorsAndWarningsCount = aggregatedErrorCount +
    aggregatedWarningCount;
  const aggregatedErrorsAndWarningsPct =
    100 * aggregatedErrorsAndWarningsCount / total;

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
        if (100 - aggregatedErrorsAndWarningsPct >= thresh) {
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
   * @param {string} passingThresh
   * @param {string} mediumThresh
   * @returns {string[]}
  */
  function getColorForCount (passingThresh, mediumThresh) {
    let color;
    color = checkThreshold(color, passingThresh, passingColor);
    color = checkThreshold(color, mediumThresh, mediumColor);
    if (!color) {
      color = failingColor;
    }

    return color;
  }

  // eslint-disable-next-line prefer-const
  let lintingTypesWithColors, lintingInfo;
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
        ...(textColor || [getColorForCount(passingThreshold, mediumThreshold)])
      ],
      ...(lintingTypesWithColors || [])
    ];

    log(
      'Using linting',
      typeof lintingInfo === 'undefined' ? 'undefined' : lintingInfo,
      '\nprinting sections:\n', sections
    );

    const svg = await badgeUp(sections);
    await writeFile(outputPath, svg);
    log(`Finished writing to ${outputPath}`);
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
      // eslint-disable-next-line node/global-require, import/no-dynamic-require
      ? require(ruleMap)
      : ruleMap
    : {};

  // ALL RULES USED (passing or failing)
  const ruleIdToType = rulesMetaEntries.reduce((obj, [ruleId, info]) => {
    let type;
    if (userRuleIdToType[ruleId]) {
      type = userRuleIdToType[ruleId];
    } else {
      ({
        type
        // Might also destructure `docs` and then use:
        //   const {category} = docs || {}; // "Possible Errors"
      } = info || {});
    }
    if (!type) {
      type = 'missing';
    }
    obj[ruleId] = type;
    return obj;
  }, {});

  // FAILING TYPE COUNTS ONLY
  // Note: These messages are not in a consistent order
  lintingInfo = aggregatedMessages.reduce((obj, {
    ruleId,
    severity // 1 for warnings or 2 for errors
    // message // , line, column, nodeType
  }) => {
    const type = ruleIdToType[ruleId]; // e.g., "layout"
    if (!type) {
      throw new Error(
        `A rule in the results, \`${ruleId}\`, was not found in \`rulesMeta\``
      );
    }
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
      failing,
      warnings,
      errors,
      ruleIds
    } = lintingInfo[type];

    const specialTemplate = (templ) => {
      return ruleIds.map((ruleId, i) => {
        return template(templ, {
          index: i + 1,
          ruleId,
          lintingType: type
        });
      });
    };

    let templates;
    switch (type) {
    case 'missing':
      templates = specialTemplate(missingLintingTemplate);
      break;
    default:
      break;
    }

    return [type, {
      text, ruleIds,
      failing, warnings, errors, templates
    }];
  });

  filteredTypes = filteredTypes
    ? filteredTypes.split(',')
    : [];

  let filteredLintingTypes = lintingTypesWithMissing;
  if (filteredTypes.length) {
    const nonemptyPos = filteredTypes.indexOf('nonempty');
    const checkNonempty = nonemptyPos > -1;
    if (checkNonempty) {
      filteredTypes.splice(nonemptyPos, 1);
    }
    filteredLintingTypes = filteredLintingTypes.filter((
      [type, {failing}]
    ) => {
      return (checkNonempty && failing) || filteredTypes.includes(type);
    }).sort(([typeA], [typeB]) => {
      const aIndex = filteredTypes.indexOf(typeA);
      const bIndex = filteredTypes.indexOf(typeB);
      return aIndex < bIndex
        ? -1
        : aIndex > bIndex
          ? 1
          // Shouldn't be duplicates
          // istanbul ignore next
          : 0;
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
   * @param {"passing"|"medium"} range
   * @param {string} type
   * @returns {string}
   */
  function getThresholdForRangeAndType (range, type) {
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
      getThresholdForRangeAndType('passing', type),
      getThresholdForRangeAndType('medium', type)
    );
    return [color];
  }

  lintingTypesWithColors = filteredLintingTypes.map((
    [lintingType, {
      text, ruleIds,
      failing, warnings, errors, templates
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
        const [type, clr] = lintingTypeClr.split('=');
        return [type, clr.split(',')];
      }).find(([type]) => {
        return lintingType === type;
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

        failingPct: 100 * failing / aggregatedErrorsAndWarningsCount,
        warningsPct: 100 * warnings / aggregatedWarningCount,
        errorsPct: 100 * errors / aggregatedErrorCount
      })}\n${failing && failingTemplate
        ? ruleIds.sort().map((ruleId, i) => {
          return glue(ruleId, i + 1);
        }).join('')
        : ''
      }${templates ? templates.join('') : ''}`,
      ...color
    ];
  });

  await printBadge();
};

/**
* @typedef {PlainObject} BadgerEngineResults
* @property {external:ESLintResult[]} results
* @property {external:ESLintRulesMetaData} rulesMeta
*/

/**
 * @param {EslintFormatterBadgerOptions} cfg
 * @returns {Promise<BadgerEngineResults>}
 */
module.exports.badgerEngine = async (cfg) => {
  const {
    packageJsonPath,
    configPath
  } = cfg;

  const opts = configPath
    // eslint-disable-next-line import/no-dynamic-require, node/global-require
    ? {...require(configPath), ...cfg}
    : packageJsonPath
      ? {
        // eslint-disable-next-line max-len
        // eslint-disable-next-line import/no-dynamic-require, node/global-require
        ...require(packageJsonPath).eslintFormatterBadgerOptions,
        ...cfg
      }
      : cfg;

  const {
    file,
    noUseEslintIgnore = false,
    noUseEslintrc = false,
    noEslintInlineConfig = false,
    eslintConfigPath = undefined,
    eslintRulesdir = undefined
  } = opts;

  if (!file) {
    throw new Error(
      'The `file` argument is required (or use `--help` or `--version`).'
    );
  }

  const cliConfig = {
    configFile: eslintConfigPath,
    allowInlineConfig: !noEslintInlineConfig, // `true` is ESLint default
    ignore: !noUseEslintIgnore, // `true` `is ESLint default
    useEslintrc: !noUseEslintrc // `true` `is ESLint default
  };
  if (eslintRulesdir) {
    cliConfig.rulePaths = eslintRulesdir;
  }
  const cli = new CLIEngine(cliConfig);

  const {results} = cli.executeOnFiles(file);

  const rulesMeta = cli.getRules();

  await badger({
    ...opts,
    results,
    rulesMeta,
    // Already resolved
    noConfig: true,
    packageJsonPath: false
  });
  return {
    results,
    rulesMeta
  };
};
