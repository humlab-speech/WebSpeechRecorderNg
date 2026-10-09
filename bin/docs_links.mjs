#!/usr/bin/env node
/**
 * The markdown itself: every relative link resolves, and every fragment names a real heading.
 *
 * §11.231 established the gap by reading all six CI checkers: **nothing in CI reads a markdown link.** `docs_check`
 * is not a link checker — it compares the receiver's flags against one README section — and the reason it was twice
 * believed to verify links (§11.216) is that nobody had looked. The sweep that followed was done by hand: 91 relative
 * links across 12 documents, none broken, seven anchors matching their headings. A hand sweep is a measurement, not a
 * gate: it cannot fail a pull request, and it cannot notice the next link that rots.
 *
 * This is that measurement made permanent. Both directions are defects — a link to a file that moved is a reader sent
 * nowhere, and a fragment that no longer matches its heading is worse, because the page opens and the reader is left
 * to hunt. Headings are slugged the way GitHub slugs them (see `slugOf`), which is the rule the links were written
 * against: `#theme-umeå-university` keeps its `å` because GitHub keeps letters, while `\w` does not.
 *
 * Usage: node bin/docs_links.mjs [--root <dir>] [--verbose] [--min-links <n>]
 *
 * `--min-links` is a floor, and it is not decoration: a walk that found nothing — a moved directory, a wrong root —
 * would otherwise report "0 links, none broken" and pass. **The case that proves it fires is the sensitivity step's
 * second half**: `node bin/docs_links.mjs --root bin/audit` is a real directory holding almost no markdown, and the step
 * requires it to exit non-zero. `--root` exists for that. §11.269 corrected this paragraph, which had described a
 * `bin/docs_links_fixtures/` that has never existed, while the check was in fact proved by planting into the live README
 * — the audit jobs' own pattern (§11.204), not a fixture directory.
 *
 * **And the code citations** (§11.269): a markdown link is not the only pointer a document writes. `path/to/file.ts:120`
 * in a backtick span is a claim a reader can go and check, and the line number is the part that drifts when a file is
 * edited — `docs_check` compares the receiver's flags, `dead_exports` reads symbols, and nothing read a line number. Each
 * citation resolves by the path as written, then by basename when the sentence names the directory once and the file
 * afterwards; a name several files share is left alone rather than guessed. The count is printed on every run, because a
 * scan that examined nothing must not look like a pass — the same reason `--min-links` exists.
 *
 * **And the register's cross-references** (§11.270): `§11.120` names an *entry*, not a file, and the register leans on
 * that numbering for its navigation — 813 references over 206 entries when the rule was added, 269 entries 1..269 with
 * no gap and no duplicate. When the plan is one of the documents walked, every `§11.N` in the set must name an entry that
 * exists; fenced blocks are skipped, as above. The count is printed for the same reason as the citations'.
 */
import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs';
import {basename, dirname, relative, resolve, sep} from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const ROOT = opt('root', '.');
const VERBOSE = args.includes('--verbose');
const MIN_LINKS = Number(opt('min-links', 40));

/** Directories that hold no authored markdown: dependencies, build output, history, tool caches. */
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.angular', 'coverage', '.claude']);

/** Every markdown file under `dir`, in a stable order. */
const walk = (dir) => {
  const found = [];
  for (const entry of readdirSync(dir).sort()) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = resolve(dir, entry);
    if (statSync(path).isDirectory()) {
      found.push(...walk(path));
    } else if (entry.endsWith('.md')) {
      found.push(path);
    }
  }
  return found;
};

/**
 * GitHub's heading slug. Inline code, emphasis and links are reduced to their text; letters and digits survive,
 * punctuation does not; spaces become hyphens. Duplicates get `-1`, `-2` in document order, which is what a link to
 * the second heading of the same name must name.
 */
const slugOf = (heading) => heading
  .replace(/`([^`]*)`/g, '$1')
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/[*_]/g, '')
  .toLowerCase()
  .replace(/[^\p{L}\p{N} _-]/gu, '')
  .trim()
  .replace(/ +/g, '-');

/** The slugs a document offers, in order, de-duplicated the way GitHub de-duplicates them. */
const slugsIn = (text) => {
  const seen = new Map();
  const slugs = new Set();
  for (const line of linesWithoutCode(text)) {
    const heading = /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(line);
    if (!heading) continue;
    const base = slugOf(heading[1]);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    slugs.add(count === 0 ? base : `${base}-${count}`);
  }
  return slugs;
};

/**
 * A document's lines with fenced blocks and inline code spans reduced away: a markdown *example* is not a link, and
 * this file's own header is full of them. Fences keep their line count so reported line numbers stay true.
 */
function* linesWithoutCode(text) {
  let fenced = false;
  for (const line of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      yield '';
      continue;
    }
    yield fenced ? '' : line.replace(/`[^`]*`/g, '');
  }
}

/** Every inline link and image target in `text`, with the line it sits on. `[text](target)` and `![alt](target)`. */
const linksIn = (text) => {
  const links = [];
  let line = 0;
  for (const current of linesWithoutCode(text)) {
    line += 1;
    for (const match of current.matchAll(/!?\[[^\]]*\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g)) {
      links.push({target: match[1], line});
    }
  }
  return links;
};

/** True when the target is fetched rather than resolved on disk. */
const isExternal = (target) => /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//');

const files = walk(resolve(ROOT));
const findings = [];
let links = 0;
let fragments = 0;

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const {target, line} of linksIn(text)) {
    if (isExternal(target)) continue;
    links += 1;
    const [path, fragment] = target.split('#');
    const destination = path === '' ? file : resolve(dirname(file), path);
    const where = `${relative(resolve(ROOT), file)}:${line}`;
    if (!existsSync(destination)) {
      findings.push(`${where}: no such file — ${path}`);
      continue;
    }
    if (fragment === undefined || fragment === '') continue;
    fragments += 1;
    const anchor = destination.endsWith('.md') ? destination : null;
    if (!anchor) {
      findings.push(`${where}: fragment #${fragment} on a non-markdown target — ${target}`);
      continue;
    }
    if (!slugsIn(readFileSync(anchor, 'utf8')).has(fragment)) {
      findings.push(`${where}: no heading slugs to #${fragment} — ${target}`);
    }
  }
}

/** `path/to/file.ts:120` in a backtick span: a claim about a file and a line, which no link check reads (§11.269). */
const repoFiles = new Map();
const collect = (dir) => {
  for (const entry of readdirSync(dir)) {
    if (['.git', 'node_modules', 'dist', '.angular'].includes(entry)) continue;
    const path = resolve(dir, entry);
    if (statSync(path).isDirectory()) collect(path);
    else repoFiles.set(entry, [...(repoFiles.get(entry) ?? []), path]);
  }
};
collect(resolve('.'));
const lineCounts = new Map();
const linesIn = (path) => {
  if (!lineCounts.has(path)) lineCounts.set(path, readFileSync(path, 'utf8').split('\n').length);
  return lineCounts.get(path);
};
const citationFindings = [];
let citations = 0;
for (const file of files) {
  let fenced = false;
  readFileSync(file, 'utf8').split('\n').forEach((text, index) => {
    if (/^\s*```/.test(text)) {
      fenced = !fenced;
      return;
    }
    // A fenced block is an example, not a claim — the same reason the link scan reads `linesWithoutCode` (§11.269).
    if (fenced) return;
    for (const match of text.matchAll(/`([A-Za-z0-9_./-]+\.(?:mjs|js|ts|html|scss|json|yml|md)):(\d+)(?:-(\d+))?`/g)) {
      citations += 1;
      const [, given, first, last] = match;
      const beside = resolve(dirname(file), given);
      const candidates = existsSync(beside) ? [beside] : existsSync(resolve(given)) ? [resolve(given)] : (repoFiles.get(basename(given)) ?? []);
      const where = `${relative(resolve(ROOT), file)}:${index + 1}`;
      if (candidates.length > 1) continue; // a name several files share cannot be settled here
      if (candidates.length === 0) {
        citationFindings.push(`${where}: no such file — ${given}`);
        continue;
      }
      const cited = Number(last ?? first);
      if (cited > linesIn(candidates[0])) {
        citationFindings.push(`${where}: ${given} has ${linesIn(candidates[0])} line(s), cited at ${cited}`);
      }
    }
  });
}
if (citationFindings.length > 0) {
  console.error(`\n${citationFindings.length} stale citation(s):\n`);
  for (const finding of citationFindings) console.error(`  ${finding}`);
  console.error('\nPoint each one at the line it means, or drop the number.\n');
}

/** `§11.120`: a cross-reference names an *entry*, not a file — the same claim as a citation, one document over (§11.270). */
const register = files.find((file) => /implementation-plan\.md$/.test(file));
const entries = new Set();
if (register) {
  for (const match of readFileSync(register, 'utf8').matchAll(/^### 11\.(\d+) /gm)) entries.add(match[1]);
}
const referenceFindings = [];
let references = 0;
if (register) {
  for (const file of files) {
    let fenced = false;
    readFileSync(file, 'utf8').split('\n').forEach((text, index) => {
      if (/^\s*```/.test(text)) {
        fenced = !fenced;
        return;
      }
      if (fenced) return;
      for (const match of text.matchAll(/§11\.(\d+)/g)) {
        references += 1;
        if (!entries.has(match[1])) {
          referenceFindings.push(`${relative(resolve(ROOT), file)}:${index + 1}: §11.${match[1]} names no entry`);
        }
      }
    });
  }
}
if (referenceFindings.length > 0) {
  console.error(`\n${referenceFindings.length} dangling reference(s):\n`);
  for (const finding of referenceFindings) console.error(`  ${finding}`);
  console.error('\nPoint each at the entry it means, or drop the number.\n');
}

if (findings.length > 0) {
  console.error(`\n${findings.length} broken link(s):\n`);
  for (const finding of findings) console.error(`  ${finding}`);
  console.error('\nPoint each one at what it means to reach, or drop it.\n');
}

if (findings.length + citationFindings.length + referenceFindings.length > 0) {
  process.exit(1);
}

if (links < MIN_LINKS) {
  console.error(`\nOnly ${links} link(s) checked under ${ROOT} — under the floor of ${MIN_LINKS}.`);
  console.error('A run that examined almost nothing is not a pass: check the root it was pointed at.\n');
  process.exit(1);
}

if (VERBOSE) {
  console.log(`${files.length} markdown file(s) under ${ROOT}, ${links} relative link(s), ${fragments} with a fragment, ${citations} code citation(s), ${references} register reference(s)`);
}
console.log(`Docs-links check passed: ${links} relative link(s) across ${files.length} document(s), every one resolving, ${citations} code citation(s) in range, ${references} register reference(s) resolving.`);
