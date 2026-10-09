/**
 * Audit fixture: makes the document overflow horizontally, so the fourth failure mode
 * `bin/layout_probe.mjs` documents — the root wider than its viewport — is induced rather than merely
 * implemented. No other fixture asks this question: `bin/audit/plant-violations.js` gives a page a
 * *vertical* scrollbar, which is `bin/theme_audit.mjs`'s rule, and the probe's third mode is the status
 * line's content overflowing its own box, not the page's.
 *
 * It reports the root's widths, or throws when the block did not make the root overflow: a stylesheet that caps
 * width (`div { max-width: 100% }`) leaves the block laid out inside the viewport, and a probe measuring a page
 * without the condition it asked for would pass for the wrong reason. Note what does *not* stop it: `overflow-x:
 * hidden` on the root hides the scrollbar but `scrollWidth` still reports the content width, measured.
 *
 * Usage (the dry-run job renders the recorder's session screen):
 *   node bin/layout_probe.mjs --url http://127.0.0.1:8391/spr/session/1 \
 *     --prepare bin/audit/plant-horizontal-overflow.js --viewports 1568x986
 */
(() => {
  const WIDTH = 3000;
  const wide = document.createElement('div');
  wide.className = 'planted-violation';
  // In normal flow, and with a height, because `scrollWidth` counts laid-out boxes: a `position: fixed`
  // block is not part of the scrolling box and would plant nothing at all.
  wide.setAttribute('style', `width: ${WIDTH}px; height: 4px`);
  document.body.appendChild(wide);
  const root = document.scrollingElement;
  if (root.scrollWidth <= root.clientWidth) {
    throw new Error(`the planted ${WIDTH}px block did not make the root overflow `
      + `(${root.scrollWidth}px in ${root.clientWidth}px) — a stylesheet is capping its width`);
  }
  return `root content ${Math.round(root.scrollWidth)}px in a ${Math.round(root.clientWidth)}px viewport`;
})();
