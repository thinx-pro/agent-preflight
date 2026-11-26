---
name: decode-compare
description: Compare two saved local model generation summaries when a model with higher tokens per second seems to finish later.
---

Ask for baseline and candidate summary file paths in that order. Run the read-only command with Node 18+.

```sh
node "${CLAUDE_SKILL_DIR}/tool/bin/decode-compare.js" "BASELINE.txt" "CANDIDATE.txt"
```

Report each observed generation time, rate and output token count, then explain the signed differences in that order. For errors, identify the missing or duplicate field and request one summary per file. Mention hardware or prompt differences when known. Only claim quality or elapsed task time with separate evidence. Ask before launching inference or writing any files.
