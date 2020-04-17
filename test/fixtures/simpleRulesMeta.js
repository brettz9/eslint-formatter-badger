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
  }
};
