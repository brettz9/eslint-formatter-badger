'use strict';
const {join} = require('path');

module.exports = [
  {
    filePath: join(__dirname, '/sample.js'),
    messages: [
      {
        ruleId: 'no-console',
        severity: 2,
        message: 'Unexpected console statement.',
        line: 2,
        column: 1,
        nodeType: 'MemberExpression',
        messageId: 'unexpected',
        endLine: 2,
        endColumn: 12
      }
    ],
    errorCount: 1,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
    source: '/* eslint \'no-console\': [\'error\'] */\nconsole.log(\'test\');\n'
  }
];
