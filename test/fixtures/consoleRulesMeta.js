// Adapted from https://eslint.org/docs/developer-guide/working-with-custom-formatters#the-data-argument
export default {
  'no-console': {
    type: 'suggestion',
    docs: {
      description: 'disallow the use of `console`',
      category: 'Possible Errors',
      recommended: false,
      url: 'https://eslint.org/docs/rules/no-console'
    },
    schema: [
      {
        type: 'object',
        properties: {
          allow: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            uniqueItems: true
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      unexpected: 'Unexpected console statement.'
    }
  }
};
