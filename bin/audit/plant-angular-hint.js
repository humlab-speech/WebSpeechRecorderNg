/**
 * Audit fixture: Angular's own development-build hint, planted beside a warning that must be caught.
 *
 * Rule 16 of `bin/a11y_audit.mjs` judges the console. Angular's development build emits NG-coded
 * performance advice asynchronously — NG0913 is "this image is the LCP element but was not given
 * priority" — so whether a run caught one was a matter of timing: measured on the recorder's
 * error-dialog state, one run in four failed on it with nothing changed. That is a flaky gate rather
 * than a diagnostic one, so the rule now names the hint in `IGNORED_CONSOLE` (a11y_audit.mjs).
 *
 * Both messages are planted in one run, so a single invocation proves both directions: the audit must
 * exit non-zero, must report the genuine warning, and must not report the hint.
 *
 * Usage (against a running editor or recorder, with Chrome to attach to):
 *   node bin/a11y_audit.mjs --url http://127.0.0.1:4300/project/Demo1/script \
 *     --prepare bin/audit/plant-angular-hint.js --viewports 1366x768
 */
(() => {
  console.warn('NG0913: An image with src http://127.0.0.1:4300/assets/img/bas.png is the Largest '
    + 'Contentful Paint (LCP) element but was given a "loading" value of lazy');
  console.warn('planted-genuine-warning: a console warning the audit must still report');
})();
