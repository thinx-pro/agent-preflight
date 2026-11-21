import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

function run(script, args, options = {}) {
  const path = fileURLToPath(new URL(script, import.meta.url));
  return spawnSync(process.execPath, [path, ...args], { encoding: 'utf8', ...options });
}

for (const [name, extra, status, message] of [
  ['rejects another checkout at identical HEAD', [], 1, 'Worktree mismatch'],
  ['accepts a subdirectory of the pinned checkout', ['--control'], 0, 'Worktree matches'],
]) {
  test(name, () => {
    const r = run('../examples/demo.mjs', ['--resume', ...extra]);
    assert.equal(r.status, status, r.stderr);
    assert.equal(r.stdout.trim(), message);
  });
}

for (const [name, args, options, error] of [
  ['malformed pin', ['--expect', ''], {}, /Malformed worktree/],
  ['outside repository', [], { cwd: tmpdir() }, /Git rev-parse failed/],
  ['overridden target', [], { env: { ...process.env, GIT_DIR: '.' } }, /directory overrides/],
]) {
  test(name, () => {
    const r = run('../bin/commit-scope.js', ['worktree', ...args], options);
    assert.equal(r.status, 2);
    assert.match(r.stderr, error);
  });
}
