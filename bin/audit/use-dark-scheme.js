/**
 * Audit fixture: switches to the opt-in dark scheme
 * (`bin/theme_audit.mjs --prepare bin/audit/use-dark-scheme.js`).
 *
 * The scheme is a root attribute — no media query — so the fixture is a one-liner and the
 * audit then measures the dark tokens, their contrast and the Material pins that follow them.
 */
(() => {
  document.documentElement.setAttribute('data-spr-scheme', 'dark');
  return 'dark scheme: ' + getComputedStyle(document.documentElement).getPropertyValue('--spr-chrome').trim();
})()
