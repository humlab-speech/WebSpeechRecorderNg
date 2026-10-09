/**
 * The chunked recording upload, end to end (plan §11.192): prepare, the chunk PUTs, the concat, and the
 * deferral that happens when concat overtakes the last chunk.
 *
 * This is the one place the receiver assembles a recording from its parts, and the one place it waits
 * for an upload still in flight, so it is worth a test of its own rather than being exercised only by
 * the recorder running against it. `api-harness` sets `concatWaitMs: 0`, which makes both concat
 * branches deterministic: every chunk present publishes, any chunk missing defers.
 *
 * Each chunk is a WAVE file in its own right - the recorder encodes one per chunk - so the fixtures
 * below are two whole WAVEs, not one WAVE split down the middle.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildWavHeader} from './wav.mjs';
import {withServer, jsonRequest} from './api-harness.mjs';

const SAMPLE_RATE = 16000;
const CHUNK_BYTES = SAMPLE_RATE; // half a second at 16-bit mono
const CHUNK_FRAMES = CHUNK_BYTES / 2;
const CHUNKS = 2;

/** Two WAVE chunks of one recording, each a valid WAVE on its own. */
function chunkWaves() {
  return Array.from({length: CHUNKS}, () =>
    Buffer.concat([
      buildWavHeader({audioFormat: 1, channels: 1, sampleRate: SAMPLE_RATE, bitsPerSample: 16}, CHUNK_BYTES),
      Buffer.alloc(CHUNK_BYTES),
    ]));
}

const putChunk = (base, sessionId, uuid, idx, bytes) =>
  fetch(`${base}/session/${sessionId}/recfile/${uuid}/${idx}`, {
    method: 'POST',
    headers: {'content-type': 'application/octet-stream'},
    body: bytes,
  });

const concat = (base, sessionId, uuid) =>
  fetch(`${base}/session/${sessionId}/recfile/${uuid}/concatChunksRequest`, jsonRequest('POST', {chunkCount: CHUNKS}));

test('chunked upload: a deferred concat is completed by the chunk that was still in flight', async () => {
  await withServer(async ({base, store}) => {
    store.createSession('c1', {project: 'demo', script: null, type: 'NORM'});
    const uuid = 'chunked-deferred';
    const chunks = chunkWaves();

    const prepare = await fetch(`${base}/session/c1/recfile/${uuid}/prepareChunksRequest`, jsonRequest('POST', {chunks: CHUNKS}));
    assert.equal(prepare.status, 201, 'prepare opens the chunk session');

    // A chunk the server does not hold is the documented 404, not a failure.
    assert.equal((await fetch(`${base}/session/c1/recfile/${uuid}/1`)).status, 404);

    // One chunk in hand, the client asks to concat before the second arrives: defer, do not publish a
    // truncated recording.
    assert.equal((await putChunk(base, 'c1', uuid, 0, chunks[0])).status, 200);
    const early = await (await concat(base, 'c1', uuid)).json();
    assert.equal(early.pending, true, 'a chunk still to come defers the concat');
    assert.equal(early.chunksReceived, 1);

    assert.equal((await (await fetch(`${base}/project/demo/session/c1/recfile`)).json()).length, 0,
      'nothing is published while the recording is incomplete');

    // The chunk the client had queued behind that request completes the deferred concat. The
    // completion runs inside this upload, before its response: the chunks are already consumed, so
    // the upload reports none left.
    const late = await (await putChunk(base, 'c1', uuid, 1, chunks[1])).json();
    assert.equal(late.stored, true);
    assert.equal(late.chunkCount, 0, 'the deferred concat consumed the chunks before the upload answered');

    const recorded = await (await fetch(`${base}/project/demo/session/c1/recfile`)).json();
    assert.equal(recorded.length, 1, 'the late chunk completed what the concat deferred');
    assert.equal(recorded[0].frames, CHUNKS * CHUNK_FRAMES, 'the recording holds every chunk\'s frames');
  });
});

test('an upload retried with the same key stores one recording, not two', async () => {
  await withServer(async ({base, store}) => {
    store.createSession('u1', {project: 'demo', script: null, type: 'NORM'});
    const wav = Buffer.concat([
      buildWavHeader({audioFormat: 1, channels: 1, sampleRate: SAMPLE_RATE, bitsPerSample: 16}, CHUNK_BYTES),
      Buffer.alloc(CHUNK_BYTES),
    ]);

    // The v1 form: the body is the WAVE, and the key makes the retry land on the first answer
    // (rest-api.md §1.3). A client whose response was lost re-sends the same bytes under the same key.
    const send = () =>
      fetch(`${base}/session/u1/recfile/I1`, {
        method: 'POST',
        headers: {'content-type': 'audio/wav', 'idempotency-key': 'upload-attempt-1'},
        body: wav,
      });

    const first = await send();
    assert.equal(first.status, 201);
    const stored = await first.json();
    assert.equal(first.headers.get('idempotency-replayed'), null, 'the first send does the work');

    const retry = await send();
    assert.equal(retry.status, 201);
    assert.equal(retry.headers.get('idempotency-replayed'), 'true');
    assert.deepEqual(await retry.json(), stored, 'the retry answers the remembered answer');

    const files = await (await fetch(`${base}/project/demo/session/u1/recfile`)).json();
    assert.equal(files.length, 1, 'the retry stored no second recording');

    // The key is opt-in, as everywhere else: without it a second upload is a second recording.
    const unkeyed = await fetch(`${base}/session/u1/recfile/I2`, {
      method: 'POST',
      headers: {'content-type': 'audio/wav'},
      body: wav,
    });
    assert.equal(unkeyed.status, 201);
    assert.equal(unkeyed.headers.get('idempotency-replayed'), null);
    assert.equal((await (await fetch(`${base}/project/demo/session/u1/recfile`)).json()).length, 2,
      'an upload without a key is stored as it always was');
  });
});

test('the v2 multipart form is idempotent under the same key too', async () => {
  await withServer(async ({base, store}) => {
    store.createSession('u2', {project: 'demo', script: null, type: 'NORM'});
    const boundary = '----sprRecfileBoundary';
    const wav = chunkWaves()[0];

    // The v2 form carries the recording in an `audio` part and its uuid in a field (rest-api §1.3).
    const multipart = () =>
      Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="uuid"\r\n\r\nv2-upload-1\r\n`),
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="audio"; filename="a.wav"\r\nContent-Type: audio/wav\r\n\r\n`),
        wav,
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ]);

    const send = () =>
      fetch(`${base}/session/u2/recfile/v2-upload-1`, {
        method: 'POST',
        headers: {'content-type': `multipart/form-data; boundary=${boundary}`, 'idempotency-key': 'upload-v2-1'},
        body: multipart(),
      });

    const first = await send();
    assert.equal(first.status, 201);
    const stored = await first.json();
    assert.equal(stored.uuid, 'v2-upload-1', 'the multipart field names the recording');
    assert.equal(first.headers.get('idempotency-replayed'), null);

    // The v1 and v2 forms go through one wrapped handler, so the key behaves the same for both.
    const retry = await send();
    assert.equal(retry.status, 201);
    assert.equal(retry.headers.get('idempotency-replayed'), 'true');
    assert.deepEqual(await retry.json(), stored, 'the retry answers the remembered answer');

    assert.equal((await (await fetch(`${base}/project/demo/session/u2/recfile`)).json()).length, 1,
      'and stores no second recording');
  });
});

test('a chunk retried with the same key answers from the journal, not from the live store', async () => {
  await withServer(async ({base, store}) => {
    store.createSession('c3', {project: 'demo', script: null, type: 'NORM'});
    const uuid = 'chunked-keyed';
    const chunks = chunkWaves();
    await fetch(`${base}/session/c3/recfile/${uuid}/prepareChunksRequest`, jsonRequest('POST', {chunks: CHUNKS}));

    // rest-api.md §1.3: a retry with the key returns the remembered answer. The chunk write itself
    // happens before that wrapper, so this checks the answer and the store's state agree.
    const keyed = () =>
      fetch(`${base}/session/c3/recfile/${uuid}/0`, {
        method: 'POST',
        headers: {'content-type': 'application/octet-stream', 'idempotency-key': 'chunk-attempt-1'},
        body: chunks[0],
      });

    const stored = await keyed();
    assert.equal(stored.status, 200);
    assert.equal((await stored.json()).chunkCount, 1, 'the first send stores the chunk and reports one');
    assert.equal(stored.headers.get('idempotency-replayed'), null);

    // A second chunk arrives without a key, so the store's live count moves to two.
    const second = await putChunk(base, 'c3', uuid, 1, chunks[1]);
    assert.equal(second.status, 200);
    assert.equal((await second.json()).chunkCount, 2, 'the store now holds two chunks');

    // The retry of chunk 0 answers with `chunkCount: 1` — the remembered body — where a recomputed one
    // would say 2, which is what the store holds at this moment. So this distinguishes replaying an
    // answer from redoing the work, rather than merely observing that both happen to agree.
    const retry = await keyed();
    assert.equal(retry.status, 200);
    assert.equal(retry.headers.get('idempotency-replayed'), 'true');
    assert.equal((await retry.json()).chunkCount, 1, 'the answer is the one that was remembered');

    // And one chunk per index is stored: the concat publishes two, not three.
    const published = await (await concat(base, 'c3', uuid)).json();
    assert.equal(published.chunks, CHUNKS, 'the retry did not add a chunk');
    assert.equal(published.frames, CHUNKS * CHUNK_FRAMES);
  });
});

test('chunked upload: with every chunk present the concat publishes, and repeating it replays', async () => {
  await withServer(async ({base, store}) => {
    store.createSession('c2', {project: 'demo', script: null, type: 'NORM'});
    const uuid = 'chunked-whole';
    const chunks = chunkWaves();

    await fetch(`${base}/session/c2/recfile/${uuid}/prepareChunksRequest`, jsonRequest('POST', {chunks: CHUNKS}));
    for (const [idx, bytes] of chunks.entries()) {
      const put = await putChunk(base, 'c2', uuid, idx, bytes);
      assert.equal(put.status, 200, `chunk ${idx} stored`);

      // The stored chunk answers with its bytes, which is how the client verifies an upload.
      assert.equal((await fetch(`${base}/session/c2/recfile/${uuid}/${idx}`)).status, 200);
    }

    const published = await (await concat(base, 'c2', uuid)).json();
    assert.equal(published.stored, true, 'the concat stored the recording');
    assert.equal(published.pending, undefined, 'nothing was left in flight');
    assert.equal(published.chunks, CHUNKS);
    assert.equal(published.frames, CHUNKS * CHUNK_FRAMES);

    const recorded = await (await fetch(`${base}/project/demo/session/c2/recfile`)).json();
    assert.equal(recorded.length, 1, 'the recording is a file of the session');

    // Publishing consumes the chunks: they are gone, and a repeated concat replays instead of failing.
    assert.equal((await fetch(`${base}/session/c2/recfile/${uuid}/0`)).status, 404, 'the chunks are gone after the publish');
    const replayed = await (await concat(base, 'c2', uuid)).json();
    assert.equal(replayed.replayed, true, 'a repeated concat answers from the publication');
    assert.equal(replayed.recordingFileId, published.recordingFileId, 'and names the same recording');
    assert.equal((await (await fetch(`${base}/project/demo/session/c2/recfile`)).json()).length, 1, 'no duplicate recording');
  });
});
