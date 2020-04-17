import {join} from 'path';

export default [
  {
    filePath: join(__dirname, 'simple.js'),
    messages: [
      {
        ruleId: 'curly',
        severity: 2,
        message: 'Expected { after \'if\' condition.',
        line: 2,
        column: 1,
        nodeType: 'IfStatement',
        messageId: 'missingCurlyAfterCondition',
        fix: {
          range: [30, 66],
          text: '{console.log(\'failed tests: \' + err);}'
        }
      },
      {
        ruleId: 'no-process-exit',
        severity: 1,
        message: 'Don\'t use process.exit(); throw an error instead.',
        line: 3,
        column: 1,
        nodeType: 'CallExpression',
        endLine: 3,
        endColumn: 16
      }
    ],
    errorCount: 1,
    warningCount: 1,
    fixableErrorCount: 1,
    fixableWarningCount: 0,
    source: 'var err = doStuff();\nif (err) console.log(\'failed tests: \' + err);\nprocess.exit(1);\n' }
 ];
