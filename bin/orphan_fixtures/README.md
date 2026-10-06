# Planted for bin/orphan_check.mjs

Two files, two shapes:

- `used-fixture.ts` is named right here, the way a fixture a document tells a person to run is named. It must
  **not** be reported.
- The other file in this directory is named nowhere at all — not here, not in the workflow, not in any document,
  because naming it is precisely what would stop it being the state this check looks for. It must be reported.

That is the whole fixture: the check must report exactly one of these two, and the job's step fails if it reports
either none of them (the check stopped detecting) or both (it reports by directory alone). It also means the
fixture guards itself — a document that names the unreferenced file turns this into a single-orphan-free directory,
which the step's count assertion fails on loudly rather than silently.
