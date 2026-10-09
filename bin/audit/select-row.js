/**
 * Audit fixture: selects the recorder's first progress row the way the application does, so the non-text rule has a
 * state to measure.
 *
 * It exists because that marker is the case the rule could not see until §11.260: the state class sits on the row
 * (`[class.selRow]`) and the bar on the cell below it (`td:first-child`'s inset box-shadow), so a rule that read an
 * element's own boundaries only found nothing — and nothing else in the dry-run job selects a row, which would leave
 * the marker unmeasured forever. It throws when there is no row, so a drifted selector fails the audit rather than
 * quietly measuring nothing.
 *
 * Usage (the dry-run job renders the recorder's session screen):
 *   node bin/theme_audit.mjs --url http://127.0.0.1:8391/spr/session/1 \
 *     --prepare bin/audit/select-row.js --viewports 1366x768
 */
(() => {
  const row = document.querySelector('app-sprprogress table tbody tr');
  if (!row) {
    throw new Error('no row in the progress table — the recorder screen is not up');
  }
  row.classList.add('selRow');
  const cell = row.querySelector('td:first-child');
  const bar = cell === null ? '(no first cell)' : getComputedStyle(cell).boxShadow;
  return 'selected the first row; its bar is ' + bar;
})();
