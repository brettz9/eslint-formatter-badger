'use strict';

module.exports = {
  create (context) {
    return {
      FunctionDeclaration (node) {
        context.report({message: 'Oops', node});
      }
    };
  }
};
