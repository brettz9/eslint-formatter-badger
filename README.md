# eslint-formatter-badger

Create badges to reflect the number/types of passing eslint rules.

**NOTE: This project is in very early alpha.**

## Installation

```sh
npm i eslint-formatter-badger
```

## Usage

```sh
eslint -f badger .
```

## To-dos

1. Support/document usage if after the fact (not as eslint formatter, but acting
    on eslint result files?)
1. Use [CLIEngine.getConfigForFile](https://eslint.org/docs/developer-guide/nodejs-api#cliengine-getconfigforfile)
    to find rules in action. For file paths, can look at results passed to formatter
    for all possible files (caching the config for each file).
1. Option to pass on to another reporter (so don't need to add
    [eslint-multiplexer](https://github.com/pimlie/eslint-multiplexer)
    or [eslint-formatter-multiple](https://github.com/halkeye/eslint-formatter-multiple)
    in all cases. Could default to `spec` while allowing empty string
    if someone really didn't want any visuals.
1. Support config file which will allow mapping eslint rules to
    different types, e.g., `no-eval` to `security` instead of just
    `problem` (then show these types in the results, passing in
    custom variable name to template, etc.). Provide a useful optional
    built-in config map.
1. Mention idea when ready of listing linting of dependencies per
    [eslint-plugin-privileges](https://github.com/brettz9/eslint-plugin-privileges)
    ideas (incomplete project), providing some security
    or at least best practices assurances
1. See about getting tooltips into `badge-up` if external SVG allows; so can
    list all linting rules per section (also add to license-badger showing
    relevant npm packages per license type, and possibly the test names for
    failing Mocha tests in `mocha-badge-reporter`)
