# shard-budget

Estimate indexed weight download bytes from saved model metadata. [Usage, examples and limits](skills/shard-budget/tool/README.md).

Install in Claude Code:

```
/plugin install shard-budget --marketplace thinx-pro/agent-preflight
```

Ask how much space the indexed weights need and supply the two saved JSON files. The tool requires Node 18 or later and runs offline. Provide a byte budget to see the shortfall. Shared files count once, even when many tensor names point to them.
