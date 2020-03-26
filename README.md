# lint-badger

Create badges to reflect the number/types of passing eslint rules.

**NOTE: This project is not yet functional.**

## To-dos

1. Option to pass on to another reporter (so don't need to add
    [eslint-multiplexer](https://github.com/pimlie/eslint-multiplexer)
    in all cases. Could default to `spec` while allowing empty string
    if someone really didn't want any visuals.
1. Support config file which will allow mapping eslint rules to
    different types, e.g., `no-eval` to `security` instead of just
    `problem` (then show these types in the results, passing in
    custom variable name to template, etc.).
