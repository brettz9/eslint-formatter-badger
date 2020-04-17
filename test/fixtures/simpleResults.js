export default [
  {
    filePath: "path/to/file.js",
    messages: [
      {
        ruleId: "curly",
        severity: 2,
        message: "Expected { after 'if' condition.",
        line: 2,
        column: 1,
        nodeType: "IfStatement"
      },
      {
        ruleId: "no-process-exit",
        severity: 2,
        message: "Don't use process.exit(); throw an error instead.",
        line: 3,
        column: 1,
        nodeType: "CallExpression"
      }
    ],
    errorCount: 2,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
    source:
      "var err = doStuff();\nif (err) console.log('failed tests: ' + err);\nprocess.exit(1);\n"
  }
];
