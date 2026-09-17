#!/usr/bin/env node
/**
 * Production builds replace `src/environments/environment.ts` with `environment.prod.ts` (see the
 * `fileReplacements` entry of `WebSpeechRecorderNg:build:production` in angular.json). That file is
 * deployment specific and therefore not tracked by git, so a fresh checkout has none and the build
 * fails before it starts. Run as a `pre` hook of the scripts that build the production
 * configuration: it creates the file from the sample when it is missing, and never touches an
 * existing one, so a deployment's own values survive every build.
 */
import {copyFileSync, existsSync} from 'node:fs';

const SAMPLE = 'src/environments/environment.prod.sample.ts';
const TARGET = 'src/environments/environment.prod.ts';

if (existsSync(TARGET)) {
  process.exit(0);
}

if (!existsSync(SAMPLE)) {
  console.error(`${TARGET} is missing and its template ${SAMPLE} is missing too: cannot configure the production build.`);
  process.exit(1);
}

copyFileSync(SAMPLE, TARGET);
console.log(`${TARGET} was missing: created it from ${SAMPLE}.`);
console.log('It is ignored by git: edit it with this deployment\'s API endpoint and options.');
