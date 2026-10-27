---
name: ai-key-map
description: List every place an AI provider API key (OpenAI, Anthropic, Gemini, OpenRouter, DeepSeek, Groq and more) is stored on this machine, which copies are the same key, and give a rotation checklist. Use after a key leak or provider breach, before rotating keys, when the user asks "where are my API keys?", or to check a project tree for committed keys.
---

# ai-key-map

`${CLAUDE_SKILL_DIR}` below is the folder that contains this SKILL.md; if it was not substituted, use that path. Needs Node 18+. Read-only and offline; keys are shown masked with a SHA-256 fingerprint, never in full.

## Run

```bash
node "${CLAUDE_SKILL_DIR}/tool/bin/ai-key-map.js"
```

- `--dir <project>`: also scan a project tree for `.env`, config and `mcp.json` files (repeatable).
- `--json`: masked keys and fingerprints only, for further processing.
- `--fail-on-find`: exit 1 if any key is found (pre-commit / CI on a project tree).
- `--providers`: list supported providers.

## Report

1. Group by fingerprint: "the same OpenAI key is in 4 places: …". One key in many places means one rotation, then updating every listed file.
2. Flag risky locations first: shell history, world-readable files, files inside git repos, cloud-synced folders.
3. Give the rotation checklist from the output: rotate at the provider, update each location, then delete the leftovers (shell history entries, old `.env` copies).

Do not open the listed files to look at the keys, do not print them, and do not edit or delete anything yourself. If the user wants old session logs cleaned too, suggest the `trace-scrub` skill.
