// Planted for bin/docs_check.mjs: a small argument parser with two flags. The document beside it names one of them
// and one the parser does not accept, so one run proves both directions — a flag nobody can discover, and
// documentation for a flag that is not there.
const opts = {alpha: false};
for (let i = 2; i < process.argv.length; i++) {
  switch (process.argv[i]) {
    case '--alpha': opts.alpha = true; break;
    case '--beta': opts.beta = process.argv[++i]; break;
    case '--help': process.stdout.write('Usage: node server.mjs [--alpha] [--beta <v>]\n'); process.exit(0);
  }
}
process.stdout.write(JSON.stringify(opts));
