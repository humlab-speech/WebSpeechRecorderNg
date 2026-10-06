// Planted for bin/route_check.mjs, alongside workflow.yml. Three screens: one the audits do visit, one they
// never visit (the first direction the check guards), and nothing for the URL the audit list visits and no
// route renders (the second). The paths carry `project/:p` because the check compares route patterns to audited
// URLs segment by segment.
export const routes = [
  {path: 'project/:p/planted/audited', component: AuditedScreen},
  {path: 'project/:p/planted/unrouted', component: NeverAuditedScreen},
  {path: 'project/:p/planted/redirect', redirectTo: 'planted/audited'},
];
