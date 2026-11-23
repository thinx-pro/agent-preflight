# loop-placement

Compare device transitions for layer splits across a repeated decoder core. [Usage, examples and limits](skills/loop-placement/tool/README.md).

Install with `/plugin install loop-placement --marketplace thinx-pro/agent-preflight`. Supply a saved JSON plan with one device per layer, the bounds of the repeated block and its pass count. The bundled Node command reports transitions within, between and outside passes. Run the two included examples to compare an even split with a colocated core.
