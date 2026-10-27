---
name: cost-cliff
description: Replay the user's own Claude Code and Codex session logs against other models' price tables, including long-prompt price tiers that list prices hide, to see which model would really have been cheapest for their work. Use when the user asks "would Haiku / Sonnet / GPT have been cheaper?", "what did my sessions cost?", is choosing a model for agent work, or wonders why a cheap model's bill came out high.
---

# cost-cliff

`${CLAUDE_SKILL_DIR}` below is the folder that contains this SKILL.md; if it was not substituted, use that path. Needs Node 18+. Reads local logs only; nothing is sent anywhere.

## Run

```bash
node "${CLAUDE_SKILL_DIR}/tool/bin/cost-cliff.js" --no-color
```

By default it reads `~/.claude/projects` and `~/.codex/sessions` for the last 30 days.

- `--since 7d|all|YYYY-MM-DD`, `--project <text>`, `--source claude|codex`.
- `--models <id,id>` to choose models (`--list-models` shows them).
- `--html report.html` writes a self-contained report the user can open.
- `--json` for further analysis.

## Report

1. The replay table: estimated cost per model for the same trajectory.
2. The prompt-size histogram and the share of requests over each model's tier line, e.g. "55% of your requests are over Haiku's 100K line; that's 72% of its bill."
3. One recommendation, with the caveat that the replay assumes the other model would have taken the same steps, which it would not exactly.

Prices come from the bundled `prices.json` with its date. Say the date, and if the user has newer prices, they can pass `--prices <file>`. Cross-vendor token counts use `--openai-ratio` (default 1), which is an assumption; say so when comparing Claude and GPT.
