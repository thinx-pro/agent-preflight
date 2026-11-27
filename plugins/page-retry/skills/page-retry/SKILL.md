---
name: page-retry
description: Find which pages to recheck when a table export drops a row, changes a unit, or repeats text. Use with a paginated text export and independently annotated reference lines.
---

Ask for the reference JSON and the corresponding paginated text export. Use the runtime README for the schema. Choose references from the original document. Run:

```sh
node "${CLAUDE_SKILL_DIR}/tool/bin/page-retry.js" PLAN.json PAGINATED.txt
```

Report page counts, affected physical pages, reference indices and match counts. If pagination differs, ask the user to inspect page boundaries. An exit of 1 requests review, and 2 indicates an input error. Report only the scope of the annotated rows. Obtain permission before sending documents to another service or starting a paid reparse.
