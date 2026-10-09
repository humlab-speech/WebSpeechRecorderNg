/**
 * The centre's table at scale. `large-500.json` spreads its 500 items over ten sections of five groups
 * of ten, and the centre renders the *active section* (`editor-centre.html`, an eager `@for`), so the
 * table has never held more than fifty rows in any test — the shape that would expose it is a section
 * that holds them all, which these specs mount.
 *
 * The invariant is completeness: every item of the section is rendered, and the last one is in the
 * tree rather than clipped away. That is worth an assertion rather than an assumption because the
 * failure mode is silent — a truncated list looks like a shorter script, exactly as the outline's
 * virtual branch once failed to an empty tree (`editor-outline.spec.ts`).
 *
 * The measured cost is **logged, not asserted**: a wall-clock threshold is flaky in CI, and the numbers
 * belong with the reasoning that decided against virtualising them (plan §6, §11.203 — 500 rows, ~4,600
 * nodes, ~11 ms to render and ~30 ms for one full layout at the extreme shape).
 */
import {TestBed} from '@angular/core/testing';
import type {EditorScript} from '../../core/script.model';
import {EditorCentre} from './editor-centre';

const item = (sectionIdx: number, groupIdx: number, itemIdx: number) => ({
  itemcode: `S${sectionIdx}G${groupIdx}I${itemIdx}`,
  mediaitems: [{mimetype: 'text/plain', text: `Item ${sectionIdx}.${groupIdx}.${itemIdx}`}],
});

/** One section of `groups * items` items: 500 of them in every spec below. */
const sectionOf = (groups: number, items: number): EditorScript => ({
  name: 'Large script',
  sections: [{
    name: 'Section 0',
    mode: 'MANUAL',
    promptphase: 'RECORDING',
    order: 'SEQUENTIAL',
    groups: Array.from({length: groups}, (_, groupIdx) => ({
      order: 'SEQUENTIAL',
      promptItems: Array.from({length: items}, (_, itemIdx) => item(0, groupIdx, itemIdx)),
    })),
  }],
}) as unknown as EditorScript;

const mount = (script: EditorScript) => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({});
  const fixture = TestBed.createComponent(EditorCentre);
  const host = fixture.nativeElement as HTMLElement;
  host.style.display = 'block';
  host.style.width = '900px';
  fixture.componentRef.setInput('script', script);
  fixture.componentRef.setInput('selection', {kind: 'section', section: 0});
  return {fixture, host};
};

describe('EditorCentre at scale', () => {
  for (const [groups, items] of [[5, 100], [1, 500], [10, 50]] as const) {
    it(`renders every item of a 500-item section (${groups} x ${items})`, () => {
      const {fixture, host} = mount(sectionOf(groups, items));

      const renderStart = performance.now();
      fixture.detectChanges();
      const render = performance.now() - renderStart;

      const rows = Array.from(host.querySelectorAll('li'));
      expect(rows.length).withContext('one row per item of the active section').toBe(groups * items);
      // The last row is in the tree, not merely counted: a list that stopped short would still have rows.
      expect(rows[rows.length - 1].textContent)
        .withContext('the last item of the section is rendered')
        .toContain(`S0G${groups - 1}I${items - 1}`);

      // One forced layout of the whole tree, which is what showing the section costs.
      const layoutStart = performance.now();
      void host.scrollHeight;
      const layout = performance.now() - layoutStart;

      console.log(`centre ${groups}x${items}: ${rows.length} rows, ${host.querySelectorAll('*').length} nodes, `
        + `render ${render.toFixed(1)}ms, layout ${layout.toFixed(1)}ms`);
    });
  }

  it('re-renders cheaply when the selection moves', () => {
    const {fixture, host} = mount(sectionOf(5, 100));
    fixture.detectChanges();

    fixture.componentRef.setInput('selection', {kind: 'item', section: 0, group: 4, item: 99});
    const started = performance.now();
    fixture.detectChanges();
    const elapsed = performance.now() - started;

    // `aria-current` sits on the row's button, not on the `li` (editor-centre.html).
    expect(host.querySelectorAll('[aria-current="true"]').length).withContext('the selected row is marked').toBe(1);
    console.log(`centre selection re-render: ${elapsed.toFixed(1)}ms`);
  });
});
