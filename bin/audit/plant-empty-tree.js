/**
 * Audit fixture: a `role="tree"` that holds a row and no treeitem — the state `bin/a11y_audit.mjs` names twice, once
 * for the markup (`role="tree" contains N row(s) with no role="treeitem"`) and once for the accessibility tree
 * (`the accessibility tree has a tree with no treeitem`).
 *
 * It cannot live in `bin/audit/plant-violations.js`: the probe reads a single `role="tree"` — one `querySelector` — so
 * a tree with an item and a tree without one are exclusive states, and that file proves the item-without-a-level
 * branch instead. §11.242 recorded this branch as unproven for that reason; §11.243 gives it a state of its own.
 *
 * It throws when the page already renders a tree, because the probe would then read that one and the plant would
 * quietly prove nothing.
 *
 * Usage:
 *   node bin/a11y_audit.mjs --url http://127.0.0.1:4300/project/Demo1/script \
 *     --prepare bin/audit/plant-empty-tree.js --viewports 1366x768
 */
(() => {
  if (document.querySelector('[role="tree"]')) {
    throw new Error('the page already renders a role="tree": the probe reads the first, so this plant would prove nothing');
  }
  const tree = document.createElement('div');
  tree.className = 'planted-violation';
  tree.setAttribute('role', 'tree');
  tree.setAttribute('aria-label', 'planted tree with a row and no treeitem');
  // Fixed, so the plant adds no height to the document: appended in flow it made the page 43 px taller and tripped
  // `bin/theme_audit.mjs`'s own "document scrolls" rule — a theme fault from the fixture rather than from the page
  // (measured).
  tree.style.cssText = 'position: fixed; left: 8px; top: 8px';
  const row = document.createElement('button');
  row.className = 'planted-violation';
  row.textContent = 'a planted row that is not a treeitem';
  // Sized and set in the page's own type on purpose: this fixture is also run by `bin/theme_audit.mjs`, which
  // `bin/route_check.mjs` requires of every state an accessibility pass audits — and a user-agent font would give
  // that pass faults to report that have nothing to do with this plant.
  row.style.cssText = 'width: 220px; height: 28px; font-family: inherit; font-size: 16px';
  tree.appendChild(row);
  document.body.appendChild(tree);
  return 'planted a role="tree" holding one button row and no treeitem';
})();
