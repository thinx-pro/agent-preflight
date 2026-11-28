# loop-placement

Compare device transitions for layer splits across a repeated decoder core. [Usage, examples and limits](skills/loop-placement/tool/README.md).

Install with `/plugin marketplace add thinx-pro/agent-preflight` followed by `/plugin install loop-placement@agent-preflight`. Supply a saved JSON plan with one device per layer, the bounds of the repeated block and its pass count. The bundled Node command reports transitions within, between and outside passes. Run the two included examples to compare an even split with a colocated core.

With a saved llama.cpp startup log, use `--buffers` to inspect reported model and KV allocations by backend.

Run `--sweep examples/rx6700s.json` from the bundled tool using `node bin/loop-placement.js` as the command. Compare memory across microbatch settings and see the measured interval and size of each rise.
