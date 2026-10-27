---
name: trace-scrub
description: Find API keys, tokens and passwords that leaked into AI agent session logs (Claude Code, Codex, Gemini CLI, OpenCode, Cline/Roo, Aider), gateway logs or memory folders, and redact them in place when the user agrees. Use when the user asks "did my agent log my keys?", after a key leak or a compromised package, before sharing or backing up ~/.claude or ~/.codex, or when they want to clean secrets out of transcripts.
---

# trace-scrub

Every `cat .env`, `env` or `gh auth status -t` an agent ever ran is saved verbatim in its session logs. This skill finds those secrets with the bundled scanner and, only with the user's yes, replaces them with `[REDACTED:<type>:<fingerprint>]`.

`${CLAUDE_SKILL_DIR}` below is the folder that contains this SKILL.md. If your agent does not substitute it, use that folder's path. Needs Node 18+. Offline; it never prints secret values.

## 1. Scan (read-only)

```bash
node "${CLAUDE_SKILL_DIR}/tool/bin/trace-scrub.js" --md
```

Useful options: `--since 30` (last 30 days), `--path <file-or-dir>` (also scan a gateway log or memory repo, repeatable), `--only` (scan just the `--path` targets), `--json`.
Exit code 1 means secrets were found; that is a result, not an error.

## 2. Report

Tell the user, in this order:
1. Credentials marked **LIVE**: they match a credential currently configured on this machine. These need rotating.
2. The other HIGH findings, by type and how many files they appear in.
3. The count of generic/LOW hits (variable names that look secret).

Never print, echo or copy a secret value, even partially, and never open the matched files to "check" a value. The fingerprint is enough to tell copies apart.

## 3. Rotate first, then redact

Redaction removes the copies on disk; it does not make a leaked key safe. Recommend rotating every LIVE credential at the provider before redacting. You cannot rotate keys yourself.

Show the dry run, then ask:

```bash
node "${CLAUDE_SKILL_DIR}/tool/bin/trace-scrub.js" --redact
```

Only after the user explicitly says yes:

```bash
node "${CLAUDE_SKILL_DIR}/tool/bin/trace-scrub.js" --redact --yes
```

Files changed in the last 10 minutes (the session you are in) are skipped; do not add `--include-active` unless the user asks. SQLite files are scanned but never rewritten; tell the user if any were listed.

For a live log stream: `some-command | node "${CLAUDE_SKILL_DIR}/tool/bin/trace-scrub.js" --stdin --redact` writes redacted text to stdout.
