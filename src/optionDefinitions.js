'use strict';

const pkg = require('../package.json');

// Todo: We really need a comamnd-line-args-TO-typedef-jsdoc generator!
//  Might see about https://github.com/dsheiko/bycontract/
/* eslint-disable jsdoc/require-property */
/**
* @typedef {PlainObject} EslintFormatterBadgerOptions
*/
/* eslint-enable jsdoc/require-property */

const getChalkTemplateSingleEscape = (s) => {
  return s.replace(/[{}\\]/gu, (ch) => {
    return `\\u${ch.codePointAt().toString(16).padStart(4, '0')}`;
  });
};

const getChalkTemplateEscape = (s) => {
  return s.replace(/[{}\\]/gu, (ch) => {
    return `\\\\u${ch.codePointAt().toString(16).padStart(4, '0')}`;
  });
};

const getBracketedChalkTemplateEscape = (s) => {
  return '{' + getChalkTemplateEscape(s) + '}';
};

const optionDefinitions = [
  {
    name: 'file', type: String, multiple: true,
    description: 'Repeat for each file or file glob you wish to be linted. ' +
      'Required.',
    typeLabel: '{underline file path}'
  },
  {
    name: 'noUseEslintrc', type: Boolean,
    description: 'Whether to use an .eslintrc files. Corresponds to ' +
      'inverse of ESLint\'s option of the same name.'
  },
  {
    name: 'noUseEslintIgnore', type: Boolean,
    description: 'Whether to use ignore files; corresponds to ' +
      'inverse of ESLint\'s `ignore`.'
  },
  {
    name: 'outputPath', type: String, defaultOption: true, alias: 'o',
    description: 'Path to which to save the file; defaults to ' +
      '"eslint-badge.svg" in the current working directory',
    typeLabel: '{underline outputPath}'
  },
  {
    name: 'configPath', type: String,
    description: 'Path to config file for options. Lower priority than ' +
      'other CLI options. Defaults to non-use.',
    typeLabel: '{underline path to config file}'
  },
  {
    name: 'packageJsonPath', type: String,
    description: 'Path to `package.json` for discovery of its ' +
      '`eslintFormatterBadgerOptions` property. In non-`formatter-badger` ' +
      'CLI use, i.e., `eslint -f .`, this defaults to checking ' +
      '`process.cwd()`, but here will default to not checking for a ' +
      '`package.json` and just using the regular CLI options. Ignored ' +
      'if `configPath` is set.',
    typeLabel: '{underline path to package.json}'
  },
  {
    name: 'filteredTypes', type: String, alias: 'f',
    description: 'Comma-separated list of specific linting types to display ' +
      'and/or "nonempty"; defaults to no filter; can be one of ' +
      '"problem"|"suggestion"|"layout"|"uncategorized".',
    typeLabel: '{underline list of "nonempty" or value}'
  },
  {
    name: 'ruleMap', type: String,
    description: 'Path to module which returns an object map of ESLint ' +
      'rule IDs to type (whether from the built-in `meta.type`\'s, ' +
      '"problem", "suggestion", or "layout", or a custom type, e.g.,' +
      '"security"). Empty by default.',
    typeLabel: '{underline path-to-map}'
  },
  {
    name: 'textColor', type: String,
    description: 'Color for `mainTemplate` subject. Follow by comma for ' +
      'additional (e.g., to add a stroke color). Defaults to determining ' +
      'color by threshold instead.',
    typeLabel: getBracketedChalkTemplateEscape(
      'underline <typeName>=<color> (<color>: CSS-Color|Hex as: ' +
        'ffffff|Hex stroke as s{ffffff})'
    )
  },
  {
    name: 'failingColor', type: String,
    description: 'Color used when failing a threshold. Follow by comma for ' +
      'additional (e.g., to add a stroke color). Defaults to "red".',
    typeLabel: getBracketedChalkTemplateEscape(
      'underline <typeName>=<color> (<color>: CSS-Color|Hex as: ' +
        'ffffff|Hex stroke as s{ffffff})'
    )
  },
  {
    name: 'mediumColor', type: String,
    description: 'Color used when reaching the medium level of a threshold. ' +
      'Follow by comma for additional (e.g., to add a stroke color). ' +
      'Defaults to "CCCC00" (a dark yellow).',
    typeLabel: getBracketedChalkTemplateEscape(
      'underline <typeName>=<color> (<color>: CSS-Color|Hex as: ' +
        'ffffff|Hex stroke as s{ffffff})'
    )
  },
  {
    name: 'passingColor', type: String,
    description: 'Color used when passing a threshold. Follow by comma for ' +
      'additional (e.g., to add a stroke color). Defaults to "green".',
    typeLabel: getBracketedChalkTemplateEscape(
      'underline <typeName>=<color> (<color>: CSS-Color|Hex as: ' +
        'ffffff|Hex stroke as s{ffffff})'
    )
  },
  {
    name: 'singlePane', type: Boolean,
    description: 'Whether to only create one block of the badge and not ' +
      'for each linting type. Defaults to `false`.'
  },
  {
    name: 'passingThreshold', type: String,
    description: 'Threshold at which, a result will use ' +
      'the `passingColor` (instead of `mediumColor` or `failingColor`). ' +
      'If set to a number, will be checked against the total of errors ' +
      'and warnings. If set to a percent, will be checked to the percent ' +
      'of errors and warnings relative to the total results. Defaults to ' +
      '100%. See `passingThresholds` for per-type thresholds.',
    typeLabel: '{underline number or percent}'
  },
  {
    name: 'mediumThreshold', type: String,
    description: 'Threshold at which, a non-passing result will use ' +
      'the `mediumColor` (instead of `failingColor`). If set to a ' +
      'number, will be checked against the total of errors and warnings. ' +
      'If set to a percent, will be checked to the percent of errors and ' +
      'warnings relative to the total results. Defaults to no threshold ' +
      'being checked. See `mediumThresholds` for per-type thresholds.',
    typeLabel: '{underline number or percent}'
  },
  {
    name: 'passingThresholds', type: String,
    description: 'Indicates thresholds for individual type panels. Set to ' +
      'a single number or percent (to apply to all types) or to a map of ' +
      'types to thresholds at which, a result will use ' +
      'the `passingColor` (instead of `mediumColor` or `failingColor`). ' +
      'Comma-separated list of <key>=<value> pairs where the key ' +
      'is a linting type (e.g., "suggestion") and the value is a number ' +
      'or percent.' +
      'If set to a number, will be checked against the total of errors ' +
      'and warnings. If set to a percent, will be checked to the percent ' +
      'of errors and warnings relative to the total results. Defaults to ' +
      '100%. See `passingThreshold` for the threshold applying to the ' +
      'aggregate panel.',
    typeLabel: '{underline number or percent}'
  },
  {
    name: 'mediumThresholds', type: String,
    description: 'Indicates thresholds for individual type panels. Set to ' +
      'a single number or percent (to apply to all types) or to a map of ' +
      'types to thresholds at which, a result will use the `mediumColor` ' +
      '(instead of `failingColor`). Comma-separated list of <key>=<value> ' +
      'pairs where the key is a linting type (e.g., "suggestion") and the ' +
      'value is a number or percent. If set to a number, will be checked ' +
      'against the total of errors and warnings. If set to a percent, will ' +
      'be checked to the percent of errors and warnings relative to the ' +
      'total results. Defaults to 100%. See `mediumThreshold` for the ' +
      'threshold applying to the aggregate panel.',
    typeLabel: '{underline number or percent}'
  },
  {
    name: 'lintingTypeColor', type: String,
    multiple: true,
    description: 'Key-value set for mapping a linting type name to color. ' +
      'Reuse for different types. Follow by comma for additional (e.g., to ' +
      'add a stroke color). Defaults to not being used and colors being ' +
      'determined by pass-fail colors and thresholds.',
    typeLabel: getBracketedChalkTemplateEscape(
      'underline <typeName>=<color> (<color>: CSS-Color|Hex as: ' +
        'ffffff|Hex stroke as s{ffffff})'
    )
  },
  {
    name: 'mainTemplate', type: String,
    description: 'Template for text of lint badge; defaults to: ' +
      getChalkTemplateSingleEscape(
        // eslint-disable-next-line no-template-curly-in-string
        '"ESLint (${passing}/${total} rules passing)";'
      ) +
      'passed `total`, `passing`, `errorTotal`, `warningTotal`, ' +
      '`errorWarningsTotal`, `lineTotal`, `errorWarningsPct`; ' +
      'remember to escape `$` with backslash for ' +
      'CLI use.',
    typeLabel: '{underline mainTemplate}'
  },
  {
    name: 'lintingTypeTemplate',
    description: 'Defaults to' +
      getChalkTemplateSingleEscape(
        // eslint-disable-next-line no-template-curly-in-string
        '"${lintingType}: ${failing}";'
      ) +
      'remember to escape `$` with backslash for CLI use.',
    typeLabel: '{underline lintingTypeTemplate}'
  },
  {
    name: 'failingTemplate',
    description: 'If present, should be an ES6-template-as-string and will ' +
      'be passed `ruleId` and `index` (1-based) for each failing rule ID. ' +
      'Defaults to not being used. Remember to escape `$` with backslash ' +
      'for CLI use.',
    typeLabel: '{underline failingTemplate}'
  },
  {
    name: 'missingLintingTemplate',
    description: 'ES6-template-as-string passed `ruleId` and `index` ' +
      '(1-based) for each rule ID that is missing. Defaults to ' +
      getChalkTemplateSingleEscape(
        // eslint-disable-next-line no-template-curly-in-string
        '"\n${index}. ${ruleId}". '
      ) +
      'Remember to escape `$` with backslash for CLI use.',
    typeLabel: '{underline missingLintingTemplate}'
  },
  {
    name: 'logging', type: String,
    description: 'Logging level; default is "off".',
    typeLabel: '{underline "verbose"|"off"}'
  }
];

const cliSections = [
  {
    // Add italics: `{italic textToItalicize}`
    content: pkg.description +
      '\n\n{italic eslint-formatter-badger --file file1.js ' +
        '--file fileGlob* [outputPath]}'
  },
  {
    optionList: optionDefinitions
  }
];

exports.getChalkTemplateSingleEscape = getChalkTemplateSingleEscape;
exports.getBracketedChalkTemplateEscape = getBracketedChalkTemplateEscape;
exports.definitions = optionDefinitions;
exports.sections = cliSections;
