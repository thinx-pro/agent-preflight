# commit-scope

Check the worktree an agent resumed in and whether its final commit stayed inside the agreed paths.

![agent-preflight](https://img.shields.io/badge/agent--preflight-skill-3f8f5a)
![license MIT](https://img.shields.io/badge/license-MIT-blue)

```text
git status --porcelain: (empty)
Commit scope: 1 out of scope / 2 changed
Base: <start commit ID>
Head: <end commit ID>
OUT A "docs/roadmap.md"
OK  M "src/page.js"
```

## Why

A [reported executor scope check](https://github.com/shadcn/improve/issues/30) missed an unrelated file after the executor committed it in a temporary worktree. A clean status tells you there are no pending changes. It says nothing about the difference between the task's starting commit and its delivery.

## Quick start

From this tool directory, with Git and Node.js 18.3+:

1. Run `node examples/demo.mjs`. The sample commits changes in a temporary linked Git worktree. Expect the output above (with actual IDs) and exit 1.
2. Run `node examples/demo.mjs --control`. The sample changes only the allowed file. Expect zero out-of-scope paths and exit 0.

For real work, record the start commit with `git rev-parse HEAD` before dispatching and agree on a JSON policy like [examples/scope.json](examples/scope.json). After the agent commits, pass that recorded commit and the policy from a trusted location:

```sh
node bin/commit-scope.js --repo ../task-checkout --base "$task_start" --allow examples/scope.json --json
```

Use `--head <commit>` to pin a reviewed delivery; otherwise the tool resolves HEAD at invocation. The policy path is relative to where you invoke the tool. Policy entries are case-sensitive, repository-relative literal paths. A trailing slash matches descendants of that directory. For example, `src/` covers `src/app.js`, but not `src-backup/app.js` or a file literally named `src`. An empty array permits no changed paths.

## Check the worktree after resume

A [Gemini CLI release](https://github.com/google-gemini/gemini-cli/releases/tag/v0.70.0) addressed worktree selection after authentication restart. Two worktrees can have identical commits and different pending files. Capture the expected checkout on the same machine before handing off:

```sh
pin=$(node "$tool/bin/commit-scope.js" worktree --repo "$assigned_checkout")
```

Set `tool` to the absolute tool directory. Save the fingerprint outside the executor. From the resumed executor's actual working directory, before its first operation, run:

```sh
node "$tool/bin/commit-scope.js" worktree --expect "$pin"
```

Exit 0 prints `Worktree matches`; exit 1 prints `Worktree mismatch`; exit 2 means unavailable evidence. Try `node examples/demo.mjs --resume` (1) and add `--control` (0). These use two real worktrees at the same commit.

The local fingerprint hashes the canonical checkout and private Git directory paths with their filesystem device and inode numbers. Subdirectories and symlink aliases resolve to the same checkout. Moving or remounting it may require a new pin. This point-in-time check covers checkout identity only. Separate checks are needed for the branch, subdirectory, subsequent operations and their targets. Use trusted Git settings and a filesystem with stable directory identities.

## How it works

The CLI resolves full commit IDs and requires the start to be a known ancestor of the end. Git compares the two trees and emits NUL-delimited names. Moves are represented as deletion and addition so both paths are checked. Type, mode and gitlink changes are included. The CLI makes no network requests and does not modify the checkout.

- **0:** All changed paths are in scope, including an empty diff.
- **1:** At least one changed path is outside the policy.
- **2:** Verification could not run, for example if history is missing, the policy is malformed, or a changed Git pathname cannot be decoded losslessly as UTF-8.

Run `npm test` for the standalone Git fixture tests; no package installation is required.

## Limits

This checks the delivered tree. It does not cover pending edits, reverted intermediate changes, behavior within allowed paths, or the contents of submodules. Check pending changes separately. Keep the policy and baseline outside the executor's control. Use a trusted local Git installation, repository metadata, and environment. Shallow history must contain the ancestry needed for the comparison.

## License

[MIT](LICENSE)
