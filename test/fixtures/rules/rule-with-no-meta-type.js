'use strict';

module.exports = {
  meta: {},
  create (context) {
    return {
      FunctionDeclaration (node) {
        context.report({message: 'Oops2', node});
      }
    };
  }
};
