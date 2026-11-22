---
name: shard-budget
description: How much disk space do I need to download this sharded Hugging Face model? Count unique weight files in a saved root safetensors index and compare their bytes to a disk budget.
---

Ask for the saved Hub model-info JSON with file sizes and the raw root index from its revision. Use Node 18+. If the user wants you to fetch metadata, confirm the repository and revision before accessing the network.

```sh
node "${CLAUDE_SKILL_DIR}/tool/bin/shard-budget.js" INFO.json INDEX.json --budget-bytes 1073741824
```

Omit the budget for totals alone. Report revision, unique shard count, bytes and shortfall. Exit 1 indicates insufficient budget. On exit 2 quote the input error and request the missing or matching metadata. State that runtime memory and files outside the index require separate budgeting. Do not download weights.
