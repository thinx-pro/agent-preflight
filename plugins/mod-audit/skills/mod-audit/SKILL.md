---
name: mod-audit
description: Statically audit Claude Code plugins and mods before installing or upgrading them, showing which events they hook, which commands their hooks run, and which files, network hosts and processes they touch. Use when the user is about to install a plugin, after a plugin update, or asks "what can this plugin do?" or "is this plugin safe?". It can also pin a lockfile and diff later upgrades against it.
---

# mod-audit

`${CLAUDE_SKILL_DIR}` below is the folder that contains this SKILL.md; if it was not substituted, use that path. Needs Node 18+. It only reads files: nothing is executed and nothing is sent anywhere.

## Run

Audit one plugin folder (for example a cloned repo you are about to install):

```bash
node "${CLAUDE_SKILL_DIR}/tool/bin/mod-audit.js" <path-to-plugin>
```

With no path, it audits everything already installed under `~/.claude/plugins/cache` and `~/.claude/dev-mods`.

- `--all`: include low and info findings.
- `--json`: machine-readable.
- `--write-lock [file]`: pin hashes and capabilities now (default `mod-audit.lock.json`).
- `--diff [file]`: after an upgrade, show only what is new compared with the lockfile.
- `--fail-on high`: exit 1 at or above a severity (for CI).

## Report

Lead with critical and high findings: hooks that run shell commands, network hosts contacted, writes outside the project, process spawning, prompt or approval manipulation. For each, quote the file and the exact capability from the output. Then a one-line verdict: what the plugin can do that its description doesn't mention.

This is a static capability map, not a malware verdict. Say "it can do X", not "it is safe" or "it is malicious". The decision to install stays with the user.
