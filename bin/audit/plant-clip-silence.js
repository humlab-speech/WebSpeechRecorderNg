/**
 * Audit fixture: makes every prompt clip the page asks for fail to arrive, so `bin/audit/dry_run.mjs`'s
 * clip-relative assertions can be seen to *fail* as well as to pass. Until this existed the driver was the one gate
 * with no planted fault — §11.245 recorded it — and a gate whose checks are only ever observed passing is one
 * refactor away from checking nothing.
 *
 * It blocks the transport, not the audio. The driver measures the browser's audio clock *before* a `--prepare` file
 * runs, so `clipsAudible` still says this host can play: the run must therefore **fail** rather than report the
 * clip checks unverified, which is the difference between proving the assertions and merely proving the degradation
 * path.
 *
 * The recorder fetches with `XMLHttpRequest` — the driver's own hook says so — and `fetch` is blocked as well in
 * case a path moves. The request goes to `about:blank` rather than being dropped, so it fails at once instead of
 * hanging: the recorder reports the clip as failed and carries on, which is exactly the state the driver's clip
 * assertions exist to catch.
 *
 * Usage:
 *   node bin/audit/dry_run.mjs --base http://127.0.0.1:8391 --port 9333 --session 2 \
 *     --prepare bin/audit/plant-clip-silence.js
 */
(() => {
  const mediaLike = (url) => /\/media\//.test(url) || /\.wav(\?|$)/.test(url);
  const originalFetch = window.fetch;
  window.fetch = function (...callArgs) {
    const target = callArgs[0];
    const url = typeof target === 'string' ? target : String(target && target.url ? target.url : target);
    if (mediaLike(url)) {
      return Promise.reject(new Error('planted: the prompt clip was blocked'));
    }
    return originalFetch.apply(this, callArgs);
  };
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    if (mediaLike(String(url))) {
      return originalOpen.call(this, method, 'about:blank', ...rest);
    }
    return originalOpen.call(this, method, url, ...rest);
  };
  return 'planted: every /media/ and .wav request from the page now fails at once';
})();
