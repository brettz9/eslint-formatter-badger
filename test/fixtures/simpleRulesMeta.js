// Adapted from https://eslint.org/docs/developer-guide/working-with-custom-formatters#the-data-argument
export default {
  'no-extra-semi': {
    type: 'suggestion',
    docs: {
      description: 'disallow unnecessary semicolons',
      category: 'Possible Errors',
      recommended: true,
      url: 'https://eslint.org/docs/rules/no-extra-semi'
    },
    fixable: 'code',
    schema: [],
    messages: {
      unexpected: 'Unnecessary semicolon.'
    }
  },
  'no-process-exit': {
    type: 'suggestion',
    docs: {
      description: 'disallow the use of `process.exit()`',
      category: 'Node.js and CommonJS',
      recommended: false,
      url: 'https://eslint.org/docs/rules/no-process-exit'
    },
    schema: []
  },
  curly: {
    type: 'suggestion',
    docs: {
      description: 'enforce consistent brace style for all control statements',
      category: 'Best Practices',
      recommended: false,
      url: 'https://eslint.org/docs/rules/curly'
    },
    schema: {
      anyOf: [
        {type: 'array', items: [{enum: ['all']}], minItems: 0, maxItems: 1},
        {type: 'array', items: [
          {enum: ['multi', 'multi-line', 'multi-or-nest']},
          {enum: ['consistent']}
        ], minItems: 0, maxItems: 2}
      ]
    },
    fixable: 'code',
    messages: {
      missingCurlyAfter: 'Expected { after \'{{name}}\'.',
      missingCurlyAfterCondition: 'Expected { after \'{{name}}\' condition.',
      unexpectedCurlyAfter: 'Unnecessary { after \'{{name}}\'.',
      unexpectedCurlyAfterCondition: 'Unnecessary { after \'{{name}}\' condition.'
    }
  },
};
