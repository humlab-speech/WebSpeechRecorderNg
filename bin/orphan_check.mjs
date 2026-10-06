#!/usr/bin/env node
/**
 * Orphan check for the files under `bin/`: each one is a tool or a fixture, so each must be referenced by
 * something — by name, or through a directory a consumer scans.
 *
 * §11.70 did this cross-check by hand and reported that all twenty-three files then present had a referrer, which
 * closed §11.35's "fixtures nothing runs" class. Nothing re-ran it. `bin/` has since grown five fixture trees, and
 * six sweeps in this register (five of them recorded in §11.146) went wrong in their *own* inputs — a glob that
 * missed `bin/*.js`, a terminator that missed a last-in-job step, a regex that matched only single-method rows, a
 * file list that omitted `server/`, a pattern with a trailing slash where the caller has none. A hand sweep is
 * exactly as good as its pattern, so this is the pattern, run on every push.
 *
 * Two ways to be referenced:
 *   - **by name** — any other text file in the repository mentions the basename. Docs count: a fixture a person
 *     runs from the README is used, which is how `bin/audit/use-locale-sv.js` is referenced.
 *   - **through a directory** — for a file in a subdirectory of the root, that subdirectory's name appears
 *     somewhere, which is how a fixture tree is referenced when a check is pointed at it (`--root bin/lint_fixtures`).
 *     A file directly in the root has no such directory: `bin` itself is not a reference, or everything would pass.
 *
 * Usage: node bin/orphan_check.mjs [--root <dir>] [--verbose]
 *
 * `--root` exists so the check can be shown to bite: `bin/orphan_fixtures/` holds one file nothing names and one
 * its own README names.
 */
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {dirname, join, relative, basename} from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const ROOT = opt('root', 'bin');
const VERBOSE = args.includes('--verbose');

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'data']);
const TEXT = /\.(md|json|ya?ml|mjs|js|cjs|ts|html|scss|css|txt|sh)$/;

const walk = (dir) => readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
  if (entry.name.startsWith('.') || (entry.isDirectory() && SKIP_DIRS.has(entry.name))) {
    return [];
  }
  const path = join(dir, entry.name);
  return entry.isDirectory() ? walk(path) : [path];
});

/** Every text file in the repository, read once: the search space, not a hand-picked list of directories. */
const corpus = new Map();
for (const path of walk('.')) {
  if (TEXT.test(path)) {
    try {
      corpus.set(path, readFileSync(path, 'utf8'));
    } catch {
      // A file that cannot be read cannot reference anything; it is not this check's business.
    }
  }
}

const files = walk(ROOT).filter((path) => statSync(path).isFile());
const orphans = [];
let byName = 0;
let byDirectory = 0;

for (const path of files) {
  const name = basename(path);
  const directory = relative(ROOT, dirname(path)); // '' for a file directly in the root
  // A file always mentions itself in the corpus; that is not a reference.
  const others = [...corpus].filter(([other]) => other !== path);
  const named = others.some(([, text]) => text.includes(name));
  if (named) {
    byName += 1;
    continue;
  }
  // Only a *proper* subdirectory counts, and only its own name: the root is not a reference.
  const viaDirectory = directory !== '' && others.some(([, text]) => text.includes(directory));
  if (viaDirectory) {
    byDirectory += 1;
    continue;
  }
  orphans.push({path, directory});
}

if (VERBOSE) {
  console.log(`${ROOT}: ${files.length} file(s) — ${byName} referenced by name, ${byDirectory} through a directory`);
}
if (orphans.length === 0) {
  console.log(`Orphan check passed: ${files.length} file(s) under ${ROOT}, every one referenced.`);
  process.exit(0);
}

console.error(`\n${orphans.length} file(s) under ${ROOT} are referenced by nothing:`);
for (const {path, directory} of orphans) {
  console.error(`  ${path}${directory === '' ? '' : ` (nothing names it, and nothing points at ${directory})`}`);
}
console.error('\nWire each one up — a command, a check, a test, a document — or delete it.');
process.exit(1);
