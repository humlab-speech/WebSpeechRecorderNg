// Planted for bin/route_check.mjs, alongside workflow.yml. Three screens: one the audits do visit, one they
// never visit (the first direction the check guards), and nothing for the URL the audit list visits and no
// route renders (the second). The paths carry `project/:p` because the check compares route patterns to audited
// URLs segment by segment.
// The audited screen also puts `component` before `path` on purpose: discovery reads the objects, so a route
// that orders its keys differently must still be found — a check that keyed on the text `{path:` would miss it and
// report the audit as pointing at a screen nothing renders, which is the false diagnosis §11.236 fixed.
export const routes = [
  {component: AuditedScreen, path: 'project/:p/planted/audited'},
  {path: 'project/:p/planted/unrouted', component: NeverAuditedScreen},
  {path: 'project/:p/planted/redirect', redirectTo: 'planted/audited'},
];
