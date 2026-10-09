// Planted control for bin/dead_exports.mjs: this export IS named by its own file, so it is wired up and must
// not be reported. Without it the sensitivity step would pass on a check that reported every export.
export const plantedUsedExport = 2;

console.log(plantedUsedExport);
