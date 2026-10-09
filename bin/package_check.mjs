#!/usr/bin/env node
/**
 * Packaging invariants for the library tarball — the deliverable, which nothing in this repository
 * consumes (the demo imports the library from source), so its shape is only ever checked when
 * somebody looks. Three things cost a consumer a broken build when they are wrong:
 *
 *   1. every path the manifest's public surface names exists in the package — the `exports` map, and
 *      `main`/`module`/`types`. An `exports` map is exhaustive, so a typo here is a subpath nobody
 *      can import, and a missing file behind an entry is a resolution failure at the consumer's end;
 *   2. every external package the shipped *code* imports is declared as a dependency or peer — every `.mjs` and
 *      `.js` the package ships, wherever it sits, not one directory of them, so a secondary entry point's bundle is
 *      covered the day it appears (§11.237). An import the manifest does not declare fails at install time for the
 *      consumer, not here.
 *
 *   3. the licence travels with the package, declared in the manifest and shipped as a file whose
 *      text matches the repository's. MIT's own condition is that the notice accompanies copies, so
 *      a package without it breaks the licence; and two copies of the text are two chances to edit
 *      one of them.
 *
 * Usage: node bin/package_check.mjs   (after `npm run build_module`)
 *
 * `--package-dir <dir>` points the check at another built package, which exists so it can be shown to bite:
 * `bin/package_fixtures/` is a package whose manifest promises files it does not contain, whose bundle imports
 * a package it does not declare, and whose licence is absent from the manifest and differs from the
 * repository's. The library job's sensitivity step requires every one of those to be reported — and the
 * declared import not to be.
 */
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const PACKAGE_DIR = opt('package-dir', 'dist/speechrecorderng');
const problems = [];

if (!existsSync(PACKAGE_DIR)) {
  console.error(`${PACKAGE_DIR} does not exist — run \`npm run build_module\` first.`);
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(join(PACKAGE_DIR, 'package.json'), 'utf8'));
const exists = (relative) => existsSync(join(PACKAGE_DIR, relative.replace(/^\.\//, '')));

/** The paths the manifest promises: the exports map (all conditions), and the classic fields. */
const promised = [];
if (manifest.exports && typeof manifest.exports === 'object') {
  const walk = (node, key) => {
    if (typeof node === 'string') {
      promised.push([key, node]);
      return;
    }
    if (node && typeof node === 'object') {
      for (const [condition, value] of Object.entries(node)) {
        walk(value, `${key}[${condition}]`);
      }
    }
  };
  for (const [subpath, target] of Object.entries(manifest.exports)) {
    walk(target, subpath);
  }
}
for (const field of ['main', 'module', 'types', 'typings']) {
  if (typeof manifest[field] === 'string') {
    promised.push([field, manifest[field]]);
  }
}
for (const [key, relative] of promised) {
  if (!exists(relative)) {
    problems.push(`the manifest points ${key} at ${relative}, which the package does not contain`);
  }
}

/** What the shipped code imports, against what the manifest declares. */
const declared = new Set([
  ...Object.keys(manifest.dependencies ?? {}),
  ...Object.keys(manifest.peerDependencies ?? {}),
  ...Object.keys(manifest.optionalDependencies ?? {}),
]);
/** Every JavaScript file the package ships, wherever it sits: `fesm2022/` holds the primary bundle, and a secondary
 * entry point gets a `fesm2022/` of its own, so a scan of one directory stops covering the package the day a second
 * entry point is added — and nothing else declares imports (§11.237). */
const shipped = [];
const collectCode = (dir) => {
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    if (entry.name === 'node_modules') {
      continue;
    }
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectCode(path);
    } else if (/\.(mjs|js)$/.test(entry.name)) {
      shipped.push(path);
    }
  }
};
collectCode(PACKAGE_DIR);

const imported = new Map();
const firstSeenIn = new Map();
for (const file of shipped) {
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = /^(?:import|export)[^'"]*['"]([^'"]+)['"]/.exec(line.trim());
    if (!match) {
      continue;
    }
    const specifier = match[1];
    if (specifier.startsWith('.') || specifier.startsWith('node:')) {
      continue;
    }
    const name = specifier.startsWith('@')
      ? specifier.split('/').slice(0, 2).join('/')
      : specifier.split('/')[0];
    imported.set(name, (imported.get(name) ?? 0) + 1);
    if (!firstSeenIn.has(name)) {
      firstSeenIn.set(name, file);
    }
  }
}
for (const name of [...imported.keys()].sort()) {
  if (!declared.has(name)) {
    problems.push(`the shipped code in ${firstSeenIn.get(name)} imports ${name}, `
      + 'which the manifest does not declare');
  }
}

/** The licence: declared, shipped, and the same text as the repository's copy. */
const REPO_LICENSE = 'LICENSE.txt';
if (typeof manifest.license !== 'string' || manifest.license === '') {
  problems.push('the manifest declares no license, so a consumer cannot tell what they may do with it');
}
const packageLicense = join(PACKAGE_DIR, 'LICENSE');
if (!existsSync(packageLicense)) {
  problems.push(`the package carries no LICENSE — copy the repository's ${REPO_LICENSE} beside the library's `
    + 'package.json (named LICENSE, which is the name the build copies) so the tarball ships it');
} else if (existsSync(REPO_LICENSE)
    && readFileSync(packageLicense, 'utf8') !== readFileSync(REPO_LICENSE, 'utf8')) {
  problems.push(`the package's LICENSE differs from the repository's ${REPO_LICENSE}`);
}

if (problems.length) {
  console.error(`${problems.length} packaging problem(s):`);
  for (const problem of problems) {
    console.error('  ' + problem);
  }
  process.exit(1);
}
console.log(`Package check passed: ${promised.length} promised path(s) present, `
  + `${imported.size} imported package(s) all declared (${[...imported.keys()].sort().join(', ')}) `
  + `across ${shipped.length} shipped file(s), licence ${manifest.license}.`);
