/**
 * Audit fixture: switches the application to Swedish
 * (`bin/theme_audit.mjs --prepare bin/audit/use-locale-sv.js`).
 *
 * Drives the shell's own language switch, so the catalogue is loaded through the real code path
 * (Transloco over HTTP) instead of by writing localStorage and reloading the page.
 * Number and date formats follow `LOCALE_ID`, which is resolved at bootstrap — switch those by
 * reloading with `spr.lang` in localStorage.
 */
(() => {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  return (async () => {
    const host = document.querySelector('app-root');
    const component = host && window.ng && window.ng.getComponent ? window.ng.getComponent(host) : null;
    if (!component || typeof component.setLanguage !== 'function') {
      return 'language switch not found (needs a development build)';
    }
    component.setLanguage('sv');
    await sleep(1500); // catalogue fetch + re-render
    const translated = document.querySelector('.spr-start-title, app-sprprogress th, .spr-brand-text');
    return 'locale sv, sample: "' + (translated ? translated.textContent.trim().slice(0, 40) : 'n/a') + '"';
  })();
})()
