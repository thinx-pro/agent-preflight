---
name: egress-lock
description: Run a command with outbound network access limited to an allowlist and log every connection attempt — for running an open-weight model's agent loop, an install script, generated code, a new MCP server or anything else you haven't read, without letting it reach arbitrary hosts. Use when the user asks to "run this offline / sandboxed / without internet except X", worries a local model or package might phone home, or wants to know what hosts a command contacts.
---

# egress-lock

`${CLAUDE_SKILL_DIR}` below is the folder that contains this SKILL.md; if it was not substituted, use that path. `egress-lock` means `node "${CLAUDE_SKILL_DIR}/tool/bin/egress-lock.js"`. Needs Node 18+.

## Run something under it

1. Work out the **smallest** set of hosts the job needs. Prefer presets: `npm`, `pypi`, `github`, `huggingface`, `crates`, `go`, `anthropic`, `openai`; local model servers with `--preset ollama` / `--preset lmstudio` or `--allow-local <port>`. `egress-lock presets` lists what each contains.
2. Run:

   ```bash
   node "${CLAUDE_SKILL_DIR}/tool/bin/egress-lock.js" --preset pypi --allow api.example.com -- <command> [args...]
   ```

   The exit code is the command's. A summary of allowed and denied hosts goes to stderr; every attempt is logged as JSONL in `~/.egress-lock/` (or `--log <file>`).
3. If the command fails because a host was denied, **don't widen the allowlist on your own**. Show the user the denied hosts from the summary and ask whether each one is expected. Add only the ones they confirm.

## Find out what a command contacts

Run it with an empty allowlist (or the minimum it needs to start), then read the summary or `node "${CLAUDE_SKILL_DIR}/tool/bin/egress-lock.js" report <log>`. Report denied hosts grouped by host with counts. Flag anything that looks like object storage, paste sites, IP addresses, or a cloud metadata address (`169.254.169.254` and friends; always blocked).

## What it does and doesn't guarantee

- On **macOS** the command runs under `sandbox-exec`: any outbound connection that doesn't go through the egress-lock proxy is refused by the OS, and DNS is closed (use `--allow-dns` only if a tool truly needs to resolve names itself).
- On **Linux and Windows** it is proxy-only: programs that ignore `HTTP(S)_PROXY` are not stopped. Say so to the user when it matters.
- It sees host names and ports, not HTTPS contents: an allowed host can still receive data. Unix sockets (e.g. the Docker socket) stay reachable.
- It forwards allowed traffic through the user's existing `HTTPS_PROXY` / `HTTP_PROXY` automatically; `--no-upstream` turns that off.

Never use `--no-sandbox` or `--allow-dns` to make a blocked command work without telling the user what that gives up.
