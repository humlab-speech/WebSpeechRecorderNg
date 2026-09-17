#!/usr/bin/env node
/**
 * i18n guard for the recorder and the demo application.
 *
 * Checks three things a half-translated release would otherwise ship:
 *   1. every key of `en.json` exists in every other locale, and no value is empty;
 *   2. every key of the library's `SPR_STRINGS` appears in all locales — the recorder's own
 *      English fallback must be overridable;
 *   3. every key referenced from the source (`t('…')`, `| transloco`) exists in `en.json`, so a
 *      typo cannot silently fall back to the key text.
 *
 * Usage: node bin/validate_i18n.mjs [i18nDir]
 * Exits non-zero when something is missing.
 */
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {join, relative} from 'node:path';

const I18N_DIR = process.argv[2] || 'src/assets/i18n';
const SOURCE_LOCALE = 'en';
const ROOTS = ['src', 'projects/speechrecorderng/src'];
const EXTENSIONS = ['.ts', '.html'];

const flatten = (value, prefix = '') => {
  const out = [];
  for (const [key, entry] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (entry !== null && typeof entry === 'object' && !Array.isArray(entry)) {
      out.push(...flatten(entry, path));
    } else {
      out.push([path, entry]);
    }
  }
  return out;
};

const walkSources = (dir) => {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === 'assets') continue;
      files.push(...walkSources(full));
    } else if (EXTENSIONS.some(ext => entry.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
};

const failures = [];
const warnings = [];

// --- catalogues -------------------------------------------------------------
const locales = readdirSync(I18N_DIR).filter(f => f.endsWith('.json'));
if (!locales.includes(`${SOURCE_LOCALE}.json`)) {
  console.error(`No ${SOURCE_LOCALE}.json in ${I18N_DIR}`);
  process.exit(2);
}
const catalogues = {};
for (const file of locales) {
  const locale = file.replace(/\.json$/, '');
  catalogues[locale] = Object.fromEntries(flatten(JSON.parse(readFileSync(join(I18N_DIR, file), 'utf8'))));
}

const sourceKeys = Object.keys(catalogues[SOURCE_LOCALE]);
for (const [locale, entries] of Object.entries(catalogues)) {
  if (locale === SOURCE_LOCALE) continue;
  for (const key of sourceKeys) {
    if (!(key in entries)) failures.push(`${locale}.json is missing "${key}"`);
  }
  for (const key of Object.keys(entries)) {
    if (!sourceKeys.includes(key)) warnings.push(`${locale}.json has an extra key "${key}"`);
  }
  for (const [key, value] of Object.entries(entries)) {
    if (typeof value !== 'string' || !value.trim()) failures.push(`${locale}.json has an empty value for "${key}"`);
  }
}

// --- the library's fallback catalogue must be translatable -------------------
const libraryStrings = readFileSync('projects/speechrecorderng/src/lib/i18n/translate.ts', 'utf8');
const libraryKeys = Array.from(libraryStrings.matchAll(/^\s*'([a-z0-9.]+)':/gim), m => m[1]);
if (!libraryKeys.length) failures.push('could not read SPR_STRINGS from the library');
for (const key of libraryKeys) {
  for (const locale of Object.keys(catalogues)) {
    if (!(key in catalogues[locale])) {
      failures.push(`SPR_STRINGS key "${key}" is not in ${locale}.json`);
    }
  }
}

// --- keys referenced from the source ----------------------------------------
const referenced = new Map();
for (const root of ROOTS) {
  for (const file of walkSources(root)) {
    const text = readFileSync(file, 'utf8');
    const patterns = [
      /\bi18n\.t\(\s*'([^']+)'/g,          // library template string literals
      /\.t\(\s*'([a-z][a-z0-9.]*)'/g,      // any translator call with a literal key
      /'([a-z][a-z0-9.]*)'\s*\|\s*transloco/g, // app templates
    ];
    for (const pattern of patterns) {
      for (const match of text.matchAll(pattern)) {
        referenced.set(match[1], relative('.', file));
      }
    }
  }
}
for (const [key, file] of referenced) {
  if (!(key in catalogues[SOURCE_LOCALE])) {
    failures.push(`${file} references "${key}", which ${SOURCE_LOCALE}.json does not define`);
  }
}

// --- report -----------------------------------------------------------------
console.log(`locales: ${Object.keys(catalogues).join(', ')}`);
console.log(`keys: ${sourceKeys.length} in ${SOURCE_LOCALE}.json, ${libraryKeys.length} in SPR_STRINGS, ${referenced.size} referenced from source`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  warnings.forEach(w => console.log('  ! ' + w));
}
if (failures.length) {
  console.log(`\n${failures.length} problem(s):`);
  failures.slice(0, 40).forEach(f => console.log('  ✗ ' + f));
  if (failures.length > 40) console.log(`  … and ${failures.length - 40} more`);
  process.exit(1);
}
console.log('\ni18n validation passed.');
