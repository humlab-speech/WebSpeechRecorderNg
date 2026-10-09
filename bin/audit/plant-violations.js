/**
 * Audit fixture: plants known violations on the page so the audits' rules can be seen to fail.
 *
 * `bin/theme_audit.mjs` and `bin/a11y_audit.mjs` are the gates the editor's and recorder's screens
 * are held to, and until this fixture existed nothing checked that they bite: README §7 promised,
 * in prose, that a colour literal is named, that 9 px text is named, that a 3000 px block is named
 * and that a font outside the scale is named — all from one-off checks by hand in earlier rounds.
 *
 * Each planted element maps to one documented rule, and the messages are distinct enough to assert
 * on: a colour literal, type below the scale, a low-contrast paragraph, a document-level scrollbar,
 * a state marker whose edge is too faint for WCAG 1.4.11 (§11.54), and a font outside the scale on a
 * link the audit measures — six, which is what the step's loop asserts and what this file returns
 * (§11.238 corrected a return that said five and a list that left the marker out).
 *
 * Usage (against a running editor or recorder, with Chrome to attach to):
 *   node bin/theme_audit.mjs --url http://127.0.0.1:4300/project/Demo1/script \
 *     --prepare bin/audit/plant-violations.js --viewports 1366x768
 * It must exit non-zero, naming each rule below.
 *
 * It also plants the two console messages rule 16 turns on: Angular's own development-build hint (NG0913,
 * which no audit may report — §11.127 for the measurement) beside a warning the accessibility audit must.
 * Both live here rather than in a fixture of their own, because a console-only state would leave the theme
 * pass with nothing to measure in it, which `bin/route_check.mjs` refuses — every state an accessibility
 * pass audits must also be measured by a theme pass.
 */
(() => {
  const add = (tag, style, text) => {
    const el = document.createElement(tag);
    if (text !== undefined) {
      el.textContent = text;
    }
    el.setAttribute('style', style);
    document.body.appendChild(el);
    return el;
  };
  const marker = 'planted-violation';

  // A colour literal where a token belongs.
  add('div', `background: lightgrey; width: 40px; height: 12px`).className = marker;
  // Type below the scale (the audits name sizes under 13.5 px).
  add('div', 'font-size: 9px; color: #222222', 'nine pixel text').className = marker;
  // A paragraph whose contrast is under 4.5:1 (#969696 on #ffffff is about 2.9:1).
  add('p', 'color: #969696; background: #ffffff; font-size: 16px', 'low contrast paragraph').className = marker;
  // Something tall enough to give the document a scrollbar.
  add('div', 'height: 3000px; width: 4px').className = marker;
  // A font outside the scale, on a link the audits measure.
  const link = document.createElement('a');
  link.href = '#';
  link.className = marker;
  link.textContent = 'planted link';
  link.setAttribute('style', 'font-family: Arial; font-size: 16px; color: var(--spr-link, #2A4765)');
  document.body.appendChild(link);
  // A state marker whose boundary is too faint for WCAG 1.4.11: a pale edge on a pale surface, the
  // class of defect §11.45 fixed by hand and the audit could not see (§11.54).
  const stateMarker = add('div', 'width: 60px; height: 20px; background: #ffffff; border: 2px solid #f4f4f4');
  stateMarker.className = marker + ' is-selected';

  // A state whose mark sits on a *descendant* instead of itself (§11.260): the element announces the state and the child
  // carries the boundary, which is how the recorder's selected row is built. The boundary is too faint for 3:1 on white.
  const descendantMarked = add('div', 'width: 80px; height: 20px; background: #ffffff');
  descendantMarked.className = marker + ' is-selected';
  const descendantBar = document.createElement('span');
  descendantBar.className = marker;
  descendantBar.setAttribute('style', 'display: block; width: 8px; height: 20px; box-shadow: inset 3px 0 0 0 #f4f4f4');
  descendantMarked.appendChild(descendantBar);

  // ---- and one per accessibility rule the audit claims to be sensitive to (a11y.md).
  // Rule 1: a control whose only content is aria-hidden has no accessible name.
  const nameless = document.createElement('button');
  nameless.className = marker;
  nameless.innerHTML = '<span aria-hidden="true">*</span>';
  document.body.appendChild(nameless);
  // Rule 4: a duplicated id silently breaks aria-labelledby/describes.
  for (const _ of [1, 2]) {
    const dup = document.createElement('span');
    dup.id = 'planted-duplicate-id';
    dup.className = marker;
    dup.textContent = 'duplicate id';
    document.body.appendChild(dup);
  }
  // Rule 5: an image with no alt and no decorative marking.
  const noAlt = document.createElement('img');
  noAlt.className = marker;
  noAlt.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
  document.body.appendChild(noAlt);
  // Rule 11: no declared language.
  document.documentElement.removeAttribute('lang');
  // Rule 12: a second h1 on a route that already names itself once.
  add('h1', 'font-size: 16px', 'planted second heading').className = marker;
  // Rule 13: a second main landmark, which the shell owns.
  add('main', 'height: 2px').className = marker;
  // Rule 14: a positive tabindex, which reorders the document for every keyboard user.
  const tabs = document.createElement('button');
  tabs.className = marker;
  tabs.tabIndex = 3;
  tabs.textContent = 'positive tabindex';
  document.body.appendChild(tabs);
  // Rule 15: a control inside a control. Built through the DOM, because the HTML parser would
  // hoist an inner button out of an outer one.
  const outer = document.createElement('button');
  outer.className = marker;
  outer.textContent = 'outer';
  const inner = document.createElement('button');
  inner.className = marker;
  inner.textContent = 'inner';
  outer.appendChild(inner);
  document.body.appendChild(outer);

  // ---- the rules this fixture did not reach until §11.242: 2, 3, 7 and 8. Between them they are everything the
  // audit can judge about a form field, an ARIA relationship, a composite widget and the tab order, and none had a
  // planted case — so any of them could have stopped detecting without a step noticing.
  // Rule 2: a field with no label of any kind.
  const unlabelled = document.createElement('input');
  unlabelled.className = marker;
  unlabelled.type = 'text';
  document.body.appendChild(unlabelled);

  // Rule 3, both directions. The first carries its own aria-label, so what it reports is the dangling
  // description and not a missing name; the second is named *only* by the id that is not there, which is the
  // fault, and rule 1 sees it too.
  // Rule 3 beyond the controls (§11.257): a section that names itself with an id that is not on the page. The editor
  // labels its sections this way, so this is the shape of the fault the widened check exists for.
  const danglingSection = document.createElement('section');
  danglingSection.className = marker;
  danglingSection.setAttribute('aria-labelledby', 'planted-absent-heading');
  danglingSection.textContent = 'a planted section whose heading is elsewhere';
  document.body.appendChild(danglingSection);

  const danglingDescription = document.createElement('input');
  danglingDescription.className = marker;
  danglingDescription.type = 'text';
  danglingDescription.setAttribute('aria-label', 'described by an id that is not here');
  danglingDescription.setAttribute('aria-describedby', 'planted-absent-id');
  document.body.appendChild(danglingDescription);

  const danglingLabel = document.createElement('input');
  danglingLabel.className = marker;
  danglingLabel.type = 'text';
  danglingLabel.setAttribute('aria-labelledby', 'planted-absent-id');
  document.body.appendChild(danglingLabel);

  // Rule 7: a group that marks none of its radios, and a group with no radios to mark.
  const unmarkedGroup = document.createElement('div');
  unmarkedGroup.className = marker;
  unmarkedGroup.setAttribute('role', 'radiogroup');
  unmarkedGroup.setAttribute('aria-label', 'planted group whose radios are unmarked');
  for (const label of ['one', 'two']) {
    const radio = document.createElement('button');
    radio.className = marker;
    radio.setAttribute('role', 'radio');
    radio.textContent = label;
    unmarkedGroup.appendChild(radio);
  }
  document.body.appendChild(unmarkedGroup);

  const emptyGroup = document.createElement('div');
  emptyGroup.className = marker;
  emptyGroup.setAttribute('role', 'radiogroup');
  emptyGroup.setAttribute('aria-label', 'planted group with no radios');
  document.body.appendChild(emptyGroup);

  // Rule 7's tree half: a treeitem with no aria-level. The probe reads the *first* `role="tree"` on the page, so
  // where the application renders one (the editor's outline) the fault goes inside it; on a route without one —
  // the library list, where this runs — the fixture supplies the tree, which is then the first and the measured
  // one. Measured: on this route there is none, so the guarded version planted nothing and the rule stayed
  // unproven. The `treeitems === 0` branch of the same rule cannot be shown in the same state (one tree is read),
  // and is recorded as unproven rather than pretended.
  // And a table row whose cells carry no text. The manual script's first and ninth steps ask a person to hear each row
  // announce the script name, its id, the counts and the status chip (§11.276); with real `<table>` markup the browser
  // computes that name from the cells, so an empty row is the fault to plant. Inside the application's own table, the way
  // the tree cases attach to the real tree.
  const appTable = document.querySelector('table');
  if (appTable) {
    const row = document.createElement('tr');
    row.className = marker;
    row.appendChild(document.createElement('td'));
    (appTable.querySelector('tbody') || appTable).appendChild(row);
  }

  const appTree = document.querySelector('[role="tree"]');
  const tree = appTree || document.createElement('div');
  if (!appTree) {
    tree.className = marker;
    tree.setAttribute('role', 'tree');
    tree.setAttribute('aria-label', 'planted tree');
    document.body.appendChild(tree);
  }
  // Rule 7's other half (§11.256): a parent that never says whether it is expanded. Children are read from the levels
  // in a flattened tree, so the parent is followed by an item at a deeper level and carries no aria-expanded.
  const expandLess = document.createElement('div');
  expandLess.className = marker;
  expandLess.setAttribute('role', 'treeitem');
  expandLess.setAttribute('aria-level', '1');
  expandLess.textContent = 'planted parent that never says expanded';
  tree.appendChild(expandLess);
  const expandLessChild = document.createElement('div');
  expandLessChild.className = marker;
  expandLessChild.setAttribute('role', 'treeitem');
  expandLessChild.setAttribute('aria-level', '2');
  expandLessChild.textContent = 'planted child of that parent';
  tree.appendChild(expandLessChild);
  const levelLess = document.createElement('div');
  levelLess.className = marker;
  levelLess.setAttribute('role', 'treeitem');
  levelLess.textContent = 'planted treeitem with no aria-level';
  tree.appendChild(levelLess);

  // Rule 8: two controls whose document order is the reverse of their vertical order, so focus jumps back up the
  // same column. The rule allows 30 px between them; this pair is 200 px apart and overlaps horizontally by
  // construction. Both are fixed, so neither lengthens the document the theme pass measures.
  const first = document.createElement('button');
  first.className = marker;
  first.textContent = 'first in the document, lower on the page';
  first.style.cssText = 'position: fixed; left: 40px; top: 520px; width: 220px; height: 30px; '
    + 'font-family: inherit; font-size: 16px';
  document.body.appendChild(first);
  const second = document.createElement('button');
  second.className = marker;
  second.textContent = 'second in the document, higher on the page';
  second.style.cssText = 'position: fixed; left: 40px; top: 320px; width: 220px; height: 30px; '
    + 'font-family: inherit; font-size: 16px';
  document.body.appendChild(second);

  // Rule 9's live-region branch (§11.243): a region that announces itself with nothing inside to announce. It is
  // given a size on purpose — the accessibility tree drops an invisible element, and the branch is then never
  // reached, which is how it stayed unproven.
  const emptyAnnouncement = document.createElement('div');
  emptyAnnouncement.className = marker;
  emptyAnnouncement.setAttribute('role', 'status');
  emptyAnnouncement.style.cssText = 'display: block; width: 40px; height: 20px';
  document.body.appendChild(emptyAnnouncement);

  // The logo rules, which fire on `spr-logos img`: only the recorder's control bar renders those, so
  // the editor routes carry none and the rules had never been exercised. One image per fault.
  const logos = document.createElement('spr-logos');
  logos.className = marker;
  // Pinned top-left so only the last image is outside the viewport; appended at the end of the
  // document every loaded one would be, and the message would say nothing about which rule it came from.
  logos.setAttribute('style', 'display: block; position: fixed; top: 0; left: 0');
  const gif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const logo = (src, style, alt) => {
    const img = document.createElement('img');
    img.className = marker;
    img.src = src;
    img.setAttribute('style', style);
    if (alt !== undefined) {
      img.alt = alt;
    }
    logos.appendChild(img);
  };
  logo('/planted/missing-logo.png', 'height: 24px', 'planted missing');       // did not load
  logo(gif, 'height: 24px');                                                  // no alt text
  logo(gif, 'height: 5px; width: 5px', 'planted short');                      // height outside 16-64
  logo(gif, 'height: 16px; width: 64px', 'planted squashed');                 // aspect ratio changed
  logo(gif, 'position: fixed; left: 200vw; height: 24px', 'planted off-screen');
  document.body.appendChild(logos);

  // Accessibility rule 6: nothing focusable inside `aria-hidden="true"`. The dialog job waives this
  // rule for one modal state; here it must be live and seen.
  const hidden = document.createElement('div');
  hidden.className = marker;
  hidden.setAttribute('aria-hidden', 'true');
  const hiddenButton = document.createElement('button');
  hiddenButton.className = marker;
  hiddenButton.textContent = 'hidden but focusable';
  hidden.appendChild(hiddenButton);
  document.body.appendChild(hidden);

  // The console rule's two halves (rule 16): Angular's own development-build hint, which the audit must
  // ignore, and a warning it must report. §11.127 records the measurement behind the exclusion; this is
  // what keeps both halves true, and it rides on this state so the theme pass measures it too.
  console.warn('NG0913: An image with src http://127.0.0.1:4300/assets/img/bas.png is the Largest '
    + 'Contentful Paint (LCP) element but was given a "loading" value of lazy');
  console.warn('planted-genuine-warning: a console warning the audit must still report');

  return 'planted 6 theme-side, 18 accessibility and 5 logo violations, plus the console rule\'s two halves — '
    + 'the empty-tree branch of rule 7 is a state of its own (bin/audit/plant-empty-tree.js)';
})()
