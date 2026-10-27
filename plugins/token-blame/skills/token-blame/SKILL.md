---
name: token-blame
description: Break down where Claude Code tokens went — main conversation vs each subagent type, which subagents inherited the expensive model, cache rebuilds and their causes — and estimate what subagents would cost on a cheaper model. Use when the user asks "where did my tokens go?", "why did I hit my limit so fast?", "are subagents expensive?", or wants to configure subagent models.
---

# token-blame

`${CLAUDE_SKILL_DIR}` below is the folder that contains this SKILL.md; if it was not substituted, use that path. Needs Node 18+. Reads local session logs only.

## Run

```bash
node "${CLAUDE_SKILL_DIR}/tool/bin/token-blame.js" --since 7d --no-color
```

Logs default to `$CLAUDE_CONFIG_DIR/projects` or `~/.claude/projects`.

- `--project <text>`: one project only.
- `--to <model>`: model to replay subagents on (default `haiku-5.5`).
- `--md` (no task descriptions, safe to paste) or `--json`.
- `--no-desc`: hide subagent task descriptions.

## Report

1. Main thread vs subagents share of cost, and the top subagent types.
2. Subagents that ran on the inherited (main) model, and what they would have cost on the cheaper one.
3. Cache rebuilds: how many, how big, and the listed cause (expired cache after idle, model switch, compaction, …).
4. The concrete settings change the output suggests (for example a `model:` line in a subagent definition), shown as text for the user to apply.

Don't edit agent definitions or settings yourself unless the user asks. Prices are list prices from the bundled table; subscription users pay differently, so present costs as relative sizes.
