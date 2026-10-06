/**
 * The client's paths, probed against the real server.
 *
 * `rest-api.md` calls itself the list of every endpoint the editor needs, and the editor's own specs exercise
 * HTTP through `HttpTestingController` — where the expected path is written by hand. A wrong path in a service
 * therefore passes every one of them and fails as a 404 only against a real server. This file is the one place
 * the editor's client and the receiver meet (§11.140).
 *
 * The paths are *read from the services* rather than repeated here, so a change to one is what this notices.
 * The assertions are deliberately about **routing**: a path the server does not know answers `unknown API
 * resource …` or `unsupported <something> route …`, while a path it knows but cannot satisfy answers something
 * else — `script probe does not exist`, `GET is not supported on …` — and both of those are fine here. The last
 * test is the control: a bogus subpath must still produce one of the two messages, so this file cannot pass
 * because the server stopped distinguishing.
 *
 * It lives in `server/` because it needs `api-harness.mjs` and the receiver's own routing; the server job already
 * runs `node --test server/*.test.mjs`.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {withServer} from './api-harness.mjs';

const SERVICES = 'projects/spr-script-editor/src/app/core';
const NOT_ROUTED = /unknown API resource|unsupported [a-z ]*route/;
const PROJECT = 'demo';
const PLACEHOLDER = 'probe';

/** Every path the editor's services build, taken from their source rather than repeated here. */
function clientPaths() {
  const found = new Map();
  for (const file of readdirSync(SERVICES).filter((name) => name.endsWith('.service.ts'))) {
    const text = readFileSync(join(SERVICES, file), 'utf8');
    for (const match of text.matchAll(/(projectPath|apiPath)\(\s*this\.base\s*,\s*([^)]*)\)/g)) {
      const args = match[2].split(',').map((argument) => argument.trim()).filter((argument) => argument !== '');
      const segments = (match[1] === 'projectPath' ? args.slice(1) : args)
        .map((argument) => (/^'/.test(argument) ? argument.replace(/'/g, '') : PLACEHOLDER));
      found.set('/' + segments.join('/'), match[1]);
    }
  }
  return found;
}

const paths = clientPaths();

test('the services build the paths this test knows about', () => {
  // The extraction is this test's own input. If it silently stopped matching — a renamed helper, a service moved
  // out of `core/` — every probe below would still pass while checking nothing. Measured in §11.140: an
  // extraction that matched only some of the calls reported agreement it had not established.
  assert.ok(paths.size >= 14, `expected at least 14 client paths, found ${paths.size}`);
  for (const path of paths.keys()) {
    assert.match(path, /^\/[a-z]/, `implausible path extracted: ${path}`);
    assert.ok(!path.includes('this.base'), `a call was not resolved: ${path}`);
  }
});

test('the server routes every path the editor builds', async () => {
  await withServer(async ({base}) => {
    for (const [path, helper] of paths) {
      const url = helper === 'projectPath' ? `${base}/project/${PROJECT}${path}` : `${base}${path}`;
      const response = await fetch(url);
      const body = await response.json().catch(() => ({}));
      assert.ok(!NOT_ROUTED.test(body.message ?? ''),
        `GET ${url} is not a route the server knows: ${response.status} ${body.message ?? ''}`);
    }
  });
});

test('a path the server does not know is what those assertions would catch', async () => {
  await withServer(async ({base}) => {
    const response = await fetch(`${base}/project/${PROJECT}/script/${PLACEHOLDER}/nonexistent`);
    const body = await response.json().catch(() => ({}));
    assert.equal(response.status, 404);
    assert.match(body.message ?? '', NOT_ROUTED,
      'the server no longer names an unknown route, so the test above cannot fail');
  });
});
