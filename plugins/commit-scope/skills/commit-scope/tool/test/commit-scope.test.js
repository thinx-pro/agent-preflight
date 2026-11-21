import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, renameSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../bin/commit-scope.js', import.meta.url));
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'commit-scope-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const git = (...args) => {
    const r = spawnSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgSign=false',
      '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', ...args],
      { cwd: dir, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr || String(r.error));
    return r.stdout.trim();
  };
  const put = (path, contents) => {
    const file = join(dir, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, contents);
  };
  const commit = (msg = 'Work') => {
    git('add', '-A');
    git('commit', '-qm', msg);
    return git('rev-parse', 'HEAD');
  };
  git('init', '-q', '-b', 'task');
  put('src/start.js', 'before');
  put('protected.txt', 'base');
  const base = commit('Start');
  const check = (scope, ...args) => {
    const policy = join(dir, '.git', 'scope.json');
    writeFileSync(policy, JSON.stringify(scope));
    return spawnSync(process.execPath, [cli, '--repo', dir, '--base', base, '--allow', policy,
      '--json', ...args], { encoding: 'utf8' });
  };
  return { dir, base, put, commit, git, check };
}

test('catches an unrelated file after commit even when git status is empty', t => {
  const f = fixture(t);
  f.put('src/start.js', 'after');
  f.put('src-backup/out.js', 'unrelated');
  const head = f.commit();
  assert.equal(f.git('status', '--porcelain'), '');
  const r = f.check(['src/']);
  assert.equal(r.status, 1, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout), { base: f.base, head, changed: 2, outOfScope: 1,
    changes: [
      { status: 'A', path: 'src-backup/out.js', allowed: false },
      { status: 'M', path: 'src/start.js', allowed: true },
    ] });
});

test('uses both sides of a move even when Git rename detection is enabled', t => {
  const f = fixture(t);
  f.git('config', 'diff.renames', 'true');
  renameSync(join(f.dir, 'protected.txt'), join(f.dir, 'src', 'moved.txt'));
  f.commit();
  const r = f.check(['src/']);
  assert.equal(r.status, 1, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout).changes, [
    { status: 'D', path: 'protected.txt', allowed: false },
    { status: 'A', path: 'src/moved.txt', allowed: true },
  ]);
});

test('keeps root-relative paths from a subdirectory and honors literal special characters', t => {
  const f = fixture(t);
  const weird = 'src/[draft]\nwith spaces-é.js';
  f.put(weird, 'sample');
  f.put('README.md', 'sample');
  f.commit();
  f.git('config', 'diff.relative', 'true');
  const r = f.check([weird, 'README.md'], '--repo', join(f.dir, 'src'));
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout).changes.map(row => row.path), ['README.md', weird]);
});

test('distinguishes a directory prefix from a same-name file and flags type changes', t => {
  const f = fixture(t);
  rmSync(join(f.dir, 'protected.txt'));
  symlinkSync('src/start.js', join(f.dir, 'protected.txt'));
  f.commit();
  const r = f.check(['protected.txt/']);
  assert.equal(r.status, 1, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout).changes, [{ status: 'T', path: 'protected.txt', allowed: false }]);
});

test('explicit head yields a stable receipt and ignores staged or untracked files', t => {
  const f = fixture(t);
  f.put('src/start.js', 'allowed');
  const accepted = f.commit();
  f.put('protected.txt', 'later commit');
  f.commit();
  f.put('outside.txt', 'dirty');
  f.git('add', 'outside.txt');
  f.put('untracked.txt', 'untracked');
  const r = f.check(['src/'], '--head', accepted);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).head, accepted);
  assert.deepEqual(JSON.parse(r.stdout).changes.map(row => row.path), ['src/start.js']);
});

test('checks the net delivered tree; an empty allowlist permits an empty diff', t => {
  const f = fixture(t);
  f.put('protected.txt', 'temporarily changed');
  f.commit();
  f.put('protected.txt', 'base');
  f.commit();
  const r = f.check([]);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout).changes, []);
});

test('rejects unknown, unrelated and reverse start commits', t => {
  const f = fixture(t);
  f.put('src/start.js', 'other branch');
  const other = f.commit();
  f.git('checkout', '-qb', 'separate', f.base);
  f.put('src/start.js', 'selected branch');
  f.commit();
  for (const extra of [
    ['--base', 'no-such-commit'], ['--base', other], ['--base', 'HEAD', '--head', f.base],
  ]) {
    const r = f.check(['src/'], ...extra);
    assert.equal(r.status, 2, r.stderr);
    assert.equal(r.stdout, '');
  }
});

test('rejects noncanonical, malformed and lossy policy entries', t => {
  const f = fixture(t);
  for (const policy of [
    { files: ['src/'] }, ['./src/'], ['../src/'], ['/src/'], ['src//'], ['src/../x'],
    [''], [null], ['nul\0path'], ['\ud800'],
  ]) {
    const r = f.check(policy);
    assert.equal(r.status, 2, JSON.stringify(policy));
    assert.equal(r.stdout, '');
  }
});

test('fails closed on a non-UTF-8 Git pathname', { skip: process.platform === 'win32' }, t => {
  const f = fixture(t);
  // --index-info can create this tree even on filesystems that reject non-UTF-8 filenames.
  const blob = f.git('rev-parse', 'HEAD:protected.txt');
  const input = Buffer.concat([Buffer.from(`100644 ${blob}\t`), Buffer.from([0xff, 0])]);
  const r = spawnSync('git', ['update-index', '-z', '--index-info'], { cwd: f.dir, input });
  assert.equal(r.status, 0, r.stderr.toString());
  f.git('commit', '-qm', 'Add raw filename');
  const result = f.check([]);
  assert.equal(result.status, 2, result.stderr);
  assert.equal(result.stdout, '');
});

test('counts a changed gitlink despite diff.ignoreSubmodules in local config', t => {
  const f = fixture(t);
  f.git('update-index', '--add', '--cacheinfo', `160000,${f.base},vendor`);
  f.git('commit', '-qm', 'Add gitlink');
  const old = f.git('rev-parse', 'HEAD');
  f.git('update-index', '--cacheinfo', `160000,${old},vendor`);
  f.git('commit', '-qm', 'Advance gitlink');
  f.git('config', 'diff.ignoreSubmodules', 'all');
  const r = f.check(['src/'], '--base', old);
  assert.equal(r.status, 1, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout).changes, [{ status: 'M', path: 'vendor', allowed: false }]);
});
