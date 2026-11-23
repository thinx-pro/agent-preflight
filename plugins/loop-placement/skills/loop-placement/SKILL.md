---
name: loop-placement
description: Compare GPU layer splits for a decoder with a repeated core. Use when someone asks how often a proposed layer placement crosses devices.
---

Read the bundled tool README for the JSON schema. Obtain the ordered device assignment, zero-based half-open core range and total pass count from the user or their saved plan. Ask for missing values. Label hypothetical layouts as examples.

Run `node "${CLAUDE_SKILL_DIR}/tool/bin/loop-placement.js" PLAN.json` for each plan. Report the total, the crossings per pass, the number of passes, the return crossings and the outside crossings. Compare totals only for the same execution schedule. Report invalid plans separately. Explain that counts alone cannot predict throughput, quality, fit or physical bus traffic. Ask before changing any engine settings.
