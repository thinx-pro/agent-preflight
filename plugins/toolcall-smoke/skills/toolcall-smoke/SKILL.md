---
name: toolcall-smoke
description: Run a 20-case smoke test of structured tool calling against a local model behind any OpenAI-compatible server (Ollama, llama.cpp, LM Studio, vLLM, MLX), and diagnose failures such as tool calls leaking into the text, bad JSON arguments or ignored tool_choice. Use before wiring a local model into an agent, after changing a model, chat template or server version, or when an agent on a local model "doesn't call tools".
---

# toolcall-smoke

`${CLAUDE_SKILL_DIR}` below is the folder that contains this SKILL.md; if it was not substituted, use that path. Needs Node 18+. It only talks to the endpoint you point it at.

## Run

```bash
node "${CLAUDE_SKILL_DIR}/tool/bin/toolcall-smoke.js" --base-url http://localhost:11434/v1 --model <model-id>
```

- Without `--base-url` it uses `$OPENAI_BASE_URL`, else Ollama's default `http://localhost:11434/v1`. A bare `host:port` gets `/v1` appended.
- Without `--model` it uses the first model the server lists.
- `--repeat 3` for flaky models, `--extra '{"chat_template_kwargs":{"enable_thinking":false}}'` to pass server-specific fields, `--md report.md`, `--json`, `--list` (cases).

Point it only at a local server or one the user names. Don't send it to a paid hosted API unless the user asks; it makes 20+ requests.

## Report

1. Pass rate and the status counts.
2. Failures grouped by status. The important ones:
   - `LEAK`: the call came back as text in `message.content` — usually a chat template or server tool-parser problem, not the model.
   - `NO_TOOLS`: the server ignored `tools` entirely (for llama.cpp, often a missing `--jinja`).
   - `BAD_JSON` / `BAD_ARGS`: the model's arguments don't parse or break the schema.
3. The server-specific fix hints the tool prints, quoted as given.
