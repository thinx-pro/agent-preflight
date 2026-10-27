---
name: agent-ps
description: List coding-agent processes on this machine (Claude Code, Codex, Cursor Agent, Gemini CLI, OpenCode sessions, daemons, updaters), find runaway process trees agents started (test loops, dev servers left running), show which secret-looking env vars background agents hold, and how much disk old agent versions use. Use when the machine is slow or hot, the user asks "what agents are running?", "is something still running from last night?", or wants to free disk from old agent installs.
---

# agent-ps

`${CLAUDE_SKILL_DIR}` below is the folder that contains this SKILL.md; if it was not substituted, use that path. `agent-ps` means `python3 "${CLAUDE_SKILL_DIR}/tool/run.py"`. Needs Python 3.8+, no packages. macOS and Linux.

## Commands

```bash
python3 "${CLAUDE_SKILL_DIR}/tool/run.py" doctor     # findings + suggested commands (start here)
python3 "${CLAUDE_SKILL_DIR}/tool/run.py" ps         # agent processes
python3 "${CLAUDE_SKILL_DIR}/tool/run.py" runaway    # long-running trees started by agents
python3 "${CLAUDE_SKILL_DIR}/tool/run.py" env        # secret-looking env var NAMES held by agent processes
python3 "${CLAUDE_SKILL_DIR}/tool/run.py" disk       # versioned installs, what is reclaimable
```

Each subcommand has `--help`. Values of env vars are never read out, only names.

## Rules

- Start with `doctor`, report its findings in plain words, worst first.
- **Never** pause, resume or kill processes, and never run `prune --yes`, without the user's explicit yes for that specific action. Show the exact command (`runaway --pause <pid>`, `runaway --kill <pid> --yes`, `prune --yes`) and let them decide.
- Don't kill the session you are running in. If a runaway tree belongs to the current session, say so.
