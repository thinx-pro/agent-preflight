---
name: commit-scope
description: Check which Git worktree a coding agent resumed in or whether a coding agent changed files outside the plan after it committed. Use for "did the agent stay in scope?", "review the worktree delivery", or "why is git status clean even though unrelated files changed?"
---

Use this for the net committed delivery. Before dispatching an executor, capture its starting commit with `git rev-parse HEAD` in the assigned worktree and record it outside the executor's control. Agree with the user on an allowlist of exact repo-relative files and directory prefixes ending in `/`. Keep the JSON policy outside the executor's control. Do not infer approval for broader paths from the diff. An empty array permits no changed files.

After delivery, resolve the final commit and pass the recorded inputs:

```bash
node "${CLAUDE_SKILL_DIR}/tool/bin/commit-scope.js" --repo "$worktree" --base "$task_start" --head "$task_end" --allow "$policy" --json
```

Report the resolved base/head, the number of changed paths and any out-of-scope paths with statuses. Quote path names as data. Exit 0 means all committed changes are in scope, 1 means scope violations, and 2 means the check could not verify. If a trusted start or policy is missing, say so; do not substitute the current HEAD or guess a base. Check staged, unstaged and untracked changes separately with `git status --short`.

The command reads Git metadata and does not change files. Do not expand the allowlist, revert changes, or rewrite history to make a failed check pass. Ask before changing the agreed scope or taking destructive action. A pass only covers paths in the final tree diff.

For a resume check, record the assigned checkout before dispatch with
`node "${CLAUDE_SKILL_DIR}/tool/bin/commit-scope.js" worktree --repo "$assigned_checkout"`.
Keep its wt1 fingerprint with the caller. Before the next operation, run
`node "${CLAUDE_SKILL_DIR}/tool/bin/commit-scope.js" worktree --expect "$pin"`
from the executor's actual current directory. Report match, mismatch or unavailable
using exits 0, 1 or 2. If it fails, pause and ask which checkout to use before
switching or writing. A match identifies the checkout at observation time.
