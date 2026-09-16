/**
 * Audit fixture: opens the error message dialog so
 * `bin/theme_audit.mjs --prepare bin/audit/open-error-dialog.js` measures the dialog
 * surface (title, icon chip, action button, backdrop).
 *
 * Calls the recorder's own error path, so the dialog is the real one, with the real data.
 * Runs against a development build (Angular dev-mode component API).
 */
(() => {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  return (async () => {
    const host = document.querySelector('app-sprrecordingsession');
    const component = host && window.ng && window.ng.getComponent ? window.ng.getComponent(host) : null;
    if (!component || typeof component.error !== 'function') {
      return 'error path not found';
    }
    component.error('Audit: simulated recording error.', 'This dialog is rendered for the theme audit.');
    await sleep(1200);
    return document.querySelector('msg-dialog') ? 'error dialog open' : 'dialog did not open';
  })();
})()
