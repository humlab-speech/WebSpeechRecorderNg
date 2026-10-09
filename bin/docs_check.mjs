#!/usr/bin/env node
/**
 * The receiver's flags, against the README that documents them.
 *
 * §11.166 found that `server/server.mjs` takes twenty flags and the root README named none of them — including the
 * five this work added, one of which (`--recorder-version`) a deployment must set correctly or the version gate
 * compares against the wrong number. The gap was found by hand, once; this is the part of it that can be a check, so
 * a flag added without documentation fails a job instead of going unnoticed.
 *
 * One direction each way, both of them defects: a flag the server accepts and the document does not name is a
 * deployment setting nobody can discover, and a flag the document names and the server does not accept is the worse
 * kind of documentation — §11.161's false claim.
 *
 * Usage: node bin/docs_check.mjs [--server <file>] [--doc <file>] [--section <heading>] [--verbose]
 *
 * Only the document's section whose heading contains `--section` is read, because a README is full of other
 * programs' flags: the root README documents `--url` and `--viewports` for the audits, and a check that scanned the
 * whole file would call those documentation for a flag the receiver does not have. The default is the section that
 * documents the receiver's options.
 *
 * `--server` and `--doc` exist so the check can be shown to bite: `bin/docs_fixtures/` holds a small parser and a
 * document that each name one flag the other does not.
 */
import {readFileSync} from 'node:fs';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const SERVER = opt('server', 'server/server.mjs');
const DOC = opt('doc', 'README.md');
const SECTION = opt('section', "The receiver's options");
const VERBOSE = args.includes('--verbose');

/** Flags the argument parser accepts. `--help` is excluded: it is not a setting. */
const acceptedIn = (text) => new Set([...text.matchAll(/case '(--[a-z][a-z-]*)'/g)]
  .map((match) => match[1])
  .filter((flag) => flag !== '--help'));

/** Flags a piece of prose names, in a table row or inline, as a code span or in prose. */
const namedIn = (text) => new Set([...text.matchAll(/(?<![\w-])(--[a-z][a-z-]*)/g)].map((match) => match[1]));

/**
 * The section of `text` whose heading contains `heading`, up to the next heading of the same or a higher level.
 * Nothing is scanned when the section is absent: the check says so rather than passing on an empty set.
 */
const sectionOf = (text, heading) => {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => /^#{2,6} /.test(line) && line.includes(heading));
  if (start < 0) {
    return null;
  }
  const level = lines[start].match(/^#+/)[0].length;
  const end = lines.findIndex((line, i) => i > start && /^#{1,6} /.test(line) && line.match(/^#+/)[0].length <= level);
  return lines.slice(start + 1, end < 0 ? lines.length : end).join('\n');
};

const accepted = acceptedIn(readFileSync(SERVER, 'utf8'));
const section = sectionOf(readFileSync(DOC, 'utf8'), SECTION);
if (section === null) {
  console.error(`${DOC} has no section whose heading contains "${SECTION}" — nothing to check against`);
  process.exit(1);
}
const named = namedIn(section);

const problems = [];
for (const flag of [...accepted].sort()) {
  if (!named.has(flag)) {
    problems.push(`${SERVER} accepts ${flag}, which ${DOC}'s "${SECTION}" does not name — a setting nobody can discover`);
  }
}
for (const flag of [...named].sort()) {
  if (!accepted.has(flag)) {
    problems.push(`${DOC}'s "${SECTION}" names ${flag}, which ${SERVER} does not accept — documentation for a flag that is not there`);
  }
}

if (VERBOSE) {
  console.log(`${SERVER}: ${accepted.size} flag(s); "${SECTION}" names ${named.size}`);
}
if (problems.length === 0) {
  console.log(`Docs check passed: all ${accepted.size} flag(s) of ${SERVER} are named in ${DOC}'s "${SECTION}", and it names none it does not accept.`);
  process.exit(0);
}

console.error(`${problems.length} documentation problem(s):`);
for (const problem of problems) {
  console.error('  ' + problem);
}
process.exit(1);
