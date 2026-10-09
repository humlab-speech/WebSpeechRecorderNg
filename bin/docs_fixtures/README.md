# Planted for bin/docs_check.mjs

This document stands in for a README, and `server.mjs` beside it stands in for the receiver. Only the section whose
heading matches `--section` is read, which is why this paragraph is above that heading: a README talks about other
programs' flags, and this one mentions `--unrelated`, which the parser beside it does not accept. It must **not** be
reported, because it is not in the section. (`--alpha` and `--gamma` are named below, in the section.)

#### The receiver's options

`--alpha` is accepted by the parser beside this file and named here, so it must **not** be reported. `--gamma` is
named here and not accepted there, which is the worse kind of documentation — a flag that is not there — and it must
be reported. The parser also accepts one flag this section deliberately never names, because naming it is precisely
what would stop it being the state the check exists to find; it must be reported too.

So the fixture expects exactly two problems: one each way, and none for the flag above the heading.
