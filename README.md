[![npm](https://img.shields.io/npm/v/eslint-formatter-badger.svg)](https://www.npmjs.com/package/eslint-formatter-badger)
[![Dependencies](https://img.shields.io/david/brettz9/eslint-formatter-badger.svg)](https://david-dm.org/brettz9/eslint-formatter-badger)
[![devDependencies](https://img.shields.io/david/dev/brettz9/eslint-formatter-badger.svg)](https://david-dm.org/brettz9/eslint-formatter-badger?type=dev)

<!--[![Actions Status](https://github.com/brettz9/eslint-formatter-badger/workflows/Node%20CI/badge.svg)](https://github.com/brettz9/eslint-formatter-badger/actions)-->
[![testing badge](https://raw.githubusercontent.com/brettz9/eslint-formatter-badger/master/badges/tests-badge.svg?sanitize=true)](badges/tests-badge.svg)
[![coverage badge](https://raw.githubusercontent.com/brettz9/eslint-formatter-badger/master/badges/coverage-badge.svg?sanitize=true)](badges/coverage-badge.svg)
<!--
[![Actions Status](https://github.com/brettz9/eslint-formatter-badger/workflows/Coverage/badge.svg)](https://github.com/brettz9/eslint-formatter-badger/actions)
-->

[![Known Vulnerabilities](https://snyk.io/test/github/brettz9/eslint-formatter-badger/badge.svg)](https://snyk.io/test/github/brettz9/eslint-formatter-badger)
[![Total Alerts](https://img.shields.io/lgtm/alerts/g/brettz9/eslint-formatter-badger.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/brettz9/eslint-formatter-badger/alerts)
[![Code Quality: Javascript](https://img.shields.io/lgtm/grade/javascript/g/brettz9/eslint-formatter-badger.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/brettz9/eslint-formatter-badger/context:javascript)

<!--[![License](https://img.shields.io/npm/l/eslint-formatter-badger.svg)](LICENSE-MIT.txt)-->
[![Licenses badge](https://raw.githubusercontent.com/brettz9/eslint-formatter-badger/master/badges/licenses-badge.svg?sanitize=true)](badges/licenses-badge.svg)

(see also [licenses for dev. deps.](https://raw.githubusercontent.com/brettz9/eslint-formatter-badger/master/badges/licenses-badge-dev.svg?sanitize=true))

[![issuehunt-to-marktext](https://issuehunt.io/static/embed/issuehunt-button-v1.svg)](https://issuehunt.io/r/brettz9/eslint-formatter-badger)

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
