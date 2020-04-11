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
    name: 'files', type: String, multiple: true,
    description: 'Repeat for each file or file glob you wish to be linted.',
    typeLabel: '{underline file path}'
  },
  {
    name: 'outputPath', type: String, defaultOption: true, alias: 'o',
    description: 'Path to which to save the file; default to ' +
      '"lint-badge.svg" in the current working directory',
    typeLabel: '{underline outputPath}'
  },
  {
    name: 'filteredTypes', type: String, alias: 'f',
    description: 'Comma-separated list of specific linting types to display ' +
      'and/or "nonempty"; defaults to no filter; can be one of ' +
      '"problem"|"suggestion"|"layout"|"uncategorized"',
    typeLabel: '{underline list of "nonempty" or value}'
  },
  {
    name: 'ruleMap', type: String,
    description: 'Path to module which returns an object map of ESLint ' +
      'rule IDs to type (whether from the built-in `meta.type`\'s, ' +
      '"problem", "suggestion", or "layout", or a custom type, e.g.,' +
      '"security")',
    typeLabel: '{underline path-to-map}'
  },
  {
    name: 'textColor', type: String,
    description: 'Color for "Linting" subject. Follow by comma for ' +
      'additional (e.g., to add a stroke color)',
    typeLabel: getBracketedChalkTemplateEscape(
      'underline <typeName>=<color> (<color>: CSS-Color|Hex as: ' +
        'ffffff|Hex stroke as s{ffffff})'
    )
  },
  {
    name: 'lintingTypeColor', type: String,
    multiple: true,
    description: 'Key-value set for mapping a linting type name to color. ' +
      'Reuse for different types. Follow by comma for additional (e.g., to ' +
      'add a stroke color)',
    typeLabel: getBracketedChalkTemplateEscape(
      'underline <typeName>=<color> (<color>: CSS-Color|Hex as: ' +
        'ffffff|Hex stroke as s{ffffff})'
    )
  },
  {
    name: 'textTemplate', type: String,
    description: 'Template for text of lint badge; defaults to: ' +
      '"Linting"; passed `problemCount`, `suggestionCount`, `layoutCount`, ' +
      '`uncategorizedCount`; remember to escape `$` with backslash for CLI use',
    typeLabel: '{underline textTemplate}'
  },
  {
    name: 'uncategorizedTemplate', type: String,
    description: 'Template for listing uncategorized rule names; defaults ' +
      getChalkTemplateSingleEscape(
        // eslint-disable-next-line no-template-curly-in-string
        'to: "\n${index}. ${ruleId}"; passed `ruleId` and `index` (1-based); '
      ) +
      'remember to escape `$` with backslash for CLI use',
    typeLabel: '{underline uncategorizedTemplate}'
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
      '\n\n{italic eslint-formatter-badger --files file1.js ' +
        '--files fileGlob* [outputPath]}'
  },
  {
    optionList: optionDefinitions
  }
];

exports.getChalkTemplateSingleEscape = getChalkTemplateSingleEscape;
exports.getBracketedChalkTemplateEscape = getBracketedChalkTemplateEscape;
exports.definitions = optionDefinitions;
exports.sections = cliSections;
