#!/usr/bin/env node

import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

import {cliBasics} from 'command-line-basics';
import {badgerEngine} from '../src/index.js';

const dir = dirname(fileURLToPath(import.meta.url));

const optionDefinitions = await cliBasics(
  join(dir, '../src/optionDefinitions.js')
);

if (!optionDefinitions) { // cliBasics handled
  // eslint-disable-next-line n/no-process-exit -- Intended
  process.exit();
}

try {
  await badgerEngine(optionDefinitions);
} catch (err) {
  // eslint-disable-next-line no-console -- Report error to user
  console.error(err);
  // eslint-disable-next-line n/no-process-exit -- Intended
  process.exit();
}
