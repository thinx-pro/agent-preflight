---
name: model-census
description: Inventory which AI models a codebase references (model ids, API endpoints, SDK packages, local GGUF files) and map each to the vendor whose weights it is built on, including distilled and fine-tuned derivatives; can fail CI on denied origins and emit CycloneDX. Also reads git history for commits credited to AI tools. Use for security questionnaires, AI-BOM requests, "do we use DeepSeek anywhere?", or before a compliance review.
---

# model-census

`${CLAUDE_SKILL_DIR}` below is the folder that contains this SKILL.md; if it was not substituted, use that path. Needs Node 18+. Read-only; nothing leaves the machine unless `--online` is passed.

## Run

```bash
node "${CLAUDE_SKILL_DIR}/tool/bin/model-census.js" . --md
```

- `--deny deepseek` (comma-separated origins): exit 1 if anything traces back to them.
- `--local`: also list models on this machine (Ollama, Hugging Face cache, LM Studio) and read GGUF headers.
- `--commits [--since <date>]`: which commits credit an AI tool or model, grouped by weight origin.
- `--cyclonedx` for a CycloneDX 1.6 BOM, `--json`, `--exclude test,fixtures`, `--docs` (include .md/.txt).
- `--online` sends model ids (only) to huggingface.co to walk `base_model` chains. Ask before using it.

## Report

Group by origin, then list the files and lines for each. Distinguish:
- direct use (an API endpoint or SDK call),
- a derivative (a fine-tune or distill whose base traces to the origin),
- a mention only (a string in config or a comment).

Say clearly that the mapping is by model id and declared lineage; it cannot prove what weights a hosted API actually serves.
