# CHANGES for eslint-formatter-badger

## 0.6.0

- Enhancement: Pass in `numFiles` to templates

## 0.5.1

- Fix: Docs for `lintingTypeTemplate` were missing list of arguments.
- Fix: Put `ruleMapCount` on `mainTemplate` (as added to
    `lintingTypeTemplate`).

## 0.5.0

- Enhancement: Provide `ruleMapCount` to `mainTemplate` (Useful if
    presence in rule map indicates that a rule is of interest)

## 0.4.2

- Fix: Help message for `filteredTypes`

## 0.4.1

- Fix: Ensure `configPath`, `ruleMap`, and `packageJsonPath` options
    take into account current working directory
- npm: Update devDeps

## 0.4.0

- Breaking change (CLI): Made `file` the default option and `outputPath`
    non-default (use `-o` or `--outputPath`). Allows for easier use
   (e.g., with passing on `es-file-traverse` results)

## 0.3.0

- Enhancement: Add `noEslintInlineConfig` option

## 0.2.0

- Fix: Ensure sorting of `filteredTypes` works properly
- Linting: Reapply `global-require` rule
- npm: Update deps (badge-up) and devDeps.

## 0.1.0

- Initial version
