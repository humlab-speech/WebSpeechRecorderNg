/**
 * Audit fixture: plants the five transport-bar and rail faults `bin/theme_audit.mjs` documents for the
 * recorder's own chrome — a mark outside the bar, a button squeezed below its target, a mark colliding with a
 * state indicator, two marks colliding with each other, and a progress table wider than its rail.
 *
 * Until this existed nothing induced any of them: they fire only where a `div.controlpanel` and an
 * `app-sprprogress` are rendered, which the editor-scoped job never does, so five rules of the audit could
 * have stopped detecting without a single step noticing (§11.238 listed them; §11.240 planted them).
 *
 * It throws when a host is missing rather than planting what it can: a drifted selector must fail the probe,
 * not leave it measuring a page without the state it asked for — and on this page every host is present, so a
 * throw means something moved.
 *
 * Usage (the dry-run job renders the recorder's session screen):
 *   node bin/theme_audit.mjs --url http://127.0.0.1:8391/spr/session/1 \
 *     --prepare bin/audit/plant-transport-violations.js --viewports 1366x768
 */
(() => {
  const panel = document.querySelector('div.controlpanel');
  const transport = panel ? panel.querySelector('app-sprtransport') : null;
  const rail = document.querySelector('app-sprprogress');
  const table = rail ? rail.querySelector('table') : null;
  const logos = panel ? [...panel.querySelectorAll('spr-logos img')] : [];
  const indicator = panel
    ? panel.querySelector('app-uploadstatus, app-wakelockindicator, app-readystateindicator')
    : null;
  const buttons = transport ? [...transport.querySelectorAll('button')] : [];
  if (!panel || !transport) {
    throw new Error('no div.controlpanel with an app-sprtransport — the recorder screen is not up');
  }
  if (!rail || !table) {
    throw new Error('no app-sprprogress table — the rail rules have nothing to measure');
  }
  if (logos.length < 3) {
    throw new Error(`only ${logos.length} control-bar mark(s): one is needed per collision rule and one for the bar`);
  }
  if (!indicator) {
    throw new Error('no state indicator (app-uploadstatus/wakelockindicator/readystateindicator) in the panel');
  }
  if (buttons.length === 0) {
    throw new Error('no transport button to squeeze');
  }
  // Position, never `setAttribute('style', …)`: that would replace whatever sizes the mark already carries,
  // and a mark that reverts to its natural size trips the height, ratio and viewport rules instead — four
  // messages about faults this fixture did not intend to plant (measured).
  const place = (el, left, top) => {
    el.style.position = 'fixed';
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  };

  // Outside the bar: the panel is 73 px tall at the top of the page, so a box at 400 px cannot be inside it.
  // Its own font is set because a fresh `<button>` takes the user agent's (Arial here, 13.3 px), which would
  // trip the font-family and type-size rules.
  const outsider = document.createElement('button');
  outsider.className = 'planted-violation';
  outsider.textContent = 'x';
  outsider.style.cssText = 'position: fixed; left: 0; top: 400px; width: 44px; height: 20px; '
    + 'font-family: inherit; font-size: 16px';
  transport.appendChild(outsider);

  // Squeezed: the rule's threshold is 40 px.
  buttons[0].style.width = '12px';
  buttons[0].style.minWidth = '0';
  buttons[0].style.padding = '0';

  // A mark whose box is an indicator's box, so the two collide.
  const box = indicator.getBoundingClientRect();
  const indicatorName = indicator.tagName.toLowerCase();
  place(logos[0], Math.round(box.left), Math.round(box.top));

  // Two marks at the same place, which is what "control-bar logos overlap" is about. The bar is the page's
  // *bottom* strip (its marks sit near y=705), so their spot is taken from the panel's own box: a fixed top of
  // 4 px landed outside it, and the outside-the-bar rule reported them instead (measured).
  const bar = panel.getBoundingClientRect();
  place(logos[1], Math.round(bar.left) + 600, Math.round(bar.top) + 4);
  place(logos[2], Math.round(bar.left) + 600, Math.round(bar.top) + 4);

  // The rail: its own box is the width to exceed, and the table is clipped by it, so widening the table is the
  // state the rule calls clipped.
  const inner = rail.clientWidth;
  table.style.width = `${inner + 200}px`;

  return `planted 5: a button outside the bar, a 12px transport button, a mark over ${indicatorName}, `
    + `two marks at 600px, and a ${inner + 200}px table in a ${inner}px rail`;
})();
