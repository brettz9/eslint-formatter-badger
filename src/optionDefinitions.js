'use strict';

const pkg = require('../package.json');

// Todo: We really need a comamnd-line-args-TO-typedef-jsdoc generator!
/* eslint-disable jsdoc/require-property */
/**
* @typedef {PlainObject} LintBadgerOptions
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
      '\n\n{italic eslint-formatter-badger [outputPath]}'
  },
  {
    optionList: optionDefinitions
  }
];

exports.getChalkTemplateSingleEscape = getChalkTemplateSingleEscape;
exports.getBracketedChalkTemplateEscape = getBracketedChalkTemplateEscape;
exports.definitions = optionDefinitions;
exports.sections = cliSections;
