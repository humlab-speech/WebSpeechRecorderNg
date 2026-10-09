// Planted for bin/dead_exports.mjs: an exported symbol that no other file names and that this file does not
// use beyond the declaration — the dead weight the check exists to find. The server job's sensitivity step
// requires this name to be reported, and the export in used.ts, which its own file names, not to be.
export const plantedUnusedExport = 1;
