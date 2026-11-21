# commit-scope

Review a coding agent's committed delivery against the agreed paths, even when its worktree is clean. Record the task's starting commit before execution and keep the path policy outside the executor's control. The tool runs locally with Git and Node.js 18.3+ and prints the resolved commits and any paths outside scope.

```
/plugin install commit-scope --marketplace thinx-pro/agent-preflight
```

See the [tool README](skills/commit-scope/tool/README.md) for the linked worktree demo, policy format, and exit codes.
