/**
 * Audit fixture: drops the audio events `bin/audit/dry_run.mjs` records, so the driver observes no clip at all while
 * the recorder itself behaves normally — the state its *clip-relative* assertions exist to catch
 * (`item N (code, when) never played its clip`).
 *
 * It is the complement of `bin/audit/plant-clip-silence.js`, which blocks the clips: that one stalls the walk, so it
 * proves the walk and take assertions (`item N never finished`, `the walk stopped at item N`), while the take never
 * runs and the clip comparisons are never reached. Here every take runs and only the evidence is missing, which is
 * the assertion whose absence would make this driver's M1 gate meaningless.
 *
 * It throws when the driver's hook is not installed, so it cannot silently prove nothing.
 *
 * Usage:
 *   node bin/audit/dry_run.mjs --base http://127.0.0.1:8391 --port 9333 --session 3 \
 *     --prepare bin/audit/plant-silent-events.js
 */
(() => {
  if (!window.__dryRun || !Array.isArray(window.__dryRun.events)) {
    throw new Error("the driver's hook is not installed, so there are no events to drop");
  }
  // The array stays an array — the driver serialises it — but nothing it records ever lands in it.
  window.__dryRun.events.push = function () { return 0; };
  window.__dryRun.lastAudioUrl = null;
  return 'planted: the audio events the driver records are now dropped, so no clip can be observed';
})();
