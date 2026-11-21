#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { realpathSync, statSync, readFileSync } from 'node:fs';
import { parseArgs, TextDecoder } from 'node:util';

const help = `Usage: commit-scope --base <start-commit> --allow <policy.json>
                    [--head <end-commit>] [--repo <dir>] [--json]

       commit-scope worktree [--repo <dir>] [--expect <wt1 fingerprint>]

Capture the assigned worktree before dispatch. Run again from the resumed
process with --expect to compare its actual worktree (0 match, 1 mismatch).
Compare the net committed changes between a task's start and end.
HEAD and the current directory are the defaults. The start must be
an ancestor of the end. The policy is a JSON array of exact paths
and directory prefixes ending in /. Paths are relative to the repo root.
Exit codes: 0 in scope, 1 out of scope, 2 could not verify.`;

function decode(bytes) {
  return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
}

function git(repo, args, accepts = [0]) {
  const r = spawnSync('git', ['--no-replace-objects', ...args], {
    cwd: repo,
    env: { ...process.env, GIT_NO_LAZY_FETCH: '1', GIT_ALLOW_PROTOCOL: '', LC_ALL: 'C' },
    maxBuffer: 16 * 1024 * 1024,
    timeout: 30_000,
  });
  if (r.error) throw new Error(`Git ${args[0]}: ${r.error.message}`);
  if (!accepts.includes(r.status)) {
    const detail = r.stderr.toString('utf8').trim().slice(0, 500);
    throw new Error(`Git ${args[0]} failed (${r.status ?? r.signal}): ${detail}`);
  }
  return r;
}

function resolveCommit(repo, ref) {
  const oid = git(repo, ['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`])
    .stdout.toString('ascii').trim();
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(oid)) throw new Error('Git returned an invalid commit ID');
  return oid;
}

function readPolicy(file) {
  const policy = JSON.parse(decode(readFileSync(file)));
  if (!Array.isArray(policy)) throw new Error('The allowlist must be a JSON array');
  const files = new Set();
  const directories = new Set();
  for (const [i, rule] of policy.entries()) {
    if (typeof rule !== 'string' || rule.includes('\0') || decode(Buffer.from(rule)) !== rule) {
      throw new Error(`Allowlist entry ${i + 1} must be a UTF-8 path without NUL`);
    }
    const dir = rule.endsWith('/');
    const name = dir ? rule.slice(0, -1) : rule;
    if (name.split('/').some(part => !part || part === '.' || part === '..')) {
      throw new Error(`Allowlist entry ${i + 1} must be a canonical repo-relative path`);
    }
    (dir ? directories : files).add(name);
  }
  return { files, directories };
}

function inScope(path, { files, directories }) {
  if (files.has(path)) return true;
  for (let i = path.indexOf('/'); i !== -1; i = path.indexOf('/', i + 1)) {
    if (directories.has(path.slice(0, i))) return true;
  }
  return false;
}

function changedPaths(repo, base, head, policy) {
  const bytes = git(repo, ['diff-tree', '--no-commit-id', '-r', '--name-status', '-z',
    '--no-renames', '--no-ext-diff', '--no-textconv', '--ignore-submodules=none', '--no-relative',
    base, head, '--']).stdout;
  if (!bytes.length) return [];
  // Do not accept a truncated list or lossy decoding of a name.
  const fields = decode(bytes).split('\0');
  if (fields.pop() !== '' || fields.length % 2) throw new Error('Malformed Git change list');
  const changes = [];
  for (let i = 0; i < fields.length; i += 2) {
    const [status, path] = [fields[i], fields[i + 1]];
    if (!/^[ADMT]$/.test(status) || !path) throw new Error('Unexpected Git change record');
    changes.push({ status, path, allowed: inScope(path, policy) });
  }
  return changes;
}

function worktree(args) {
  const { values } = parseArgs({ args, options: {
    repo: { type: 'string', default: '.' }, expect: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  } });
  if (values.help) {
    console.log(help);
    return 0;
  }
  if (values.expect !== undefined && !/^wt1-[a-f0-9]{64}$/.test(values.expect)) {
    throw new Error('Malformed worktree fingerprint');
  }
  if (['GIT_DIR', 'GIT_WORK_TREE', 'GIT_COMMON_DIR'].some(key => key in process.env)) {
    throw new Error('Unset Git directory overrides to verify the actual working directory');
  }
  const identity = ['commit-scope/worktree/v1'];
  for (const flag of ['--show-toplevel', '--absolute-git-dir']) {
    const output = decode(git(values.repo, ['rev-parse', flag]).stdout);
    if (!output.endsWith('\n')) throw new Error('Incomplete Git path');
    const path = realpathSync(output.slice(0, -1));
    const stat = statSync(path, { bigint: true });
    if (!stat.isDirectory() || stat.ino === 0n) throw new Error('Missing directory identity');
    identity.push(path, String(stat.dev), String(stat.ino));
  }
  const pin = 'wt1-' + createHash('sha256').update(JSON.stringify(identity)).digest('hex');
  if (values.expect === undefined) {
    console.log(pin);
    return 0;
  }
  const matches = pin === values.expect;
  console.log(matches ? 'Worktree matches' : 'Worktree mismatch');
  return matches ? 0 : 1;
}

function main() {
  const { values } = parseArgs({ options: {
    base: { type: 'string' }, head: { type: 'string', default: 'HEAD' },
    repo: { type: 'string', default: '.' }, allow: { type: 'string' },
    json: { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
  } });
  if (values.help) {
    console.log(help);
    return 0;
  }
  if (!values.base || !values.head || !values.repo || !values.allow) {
    throw new Error('Supply nonempty --base and --allow values; see --help');
  }
  const policy = readPolicy(values.allow);
  const base = resolveCommit(values.repo, values.base);
  const head = resolveCommit(values.repo, values.head);
  if (git(values.repo, ['merge-base', '--is-ancestor', base, head], [0, 1]).status === 1) {
    throw new Error('Start commit is not a known ancestor of the end (wrong base or incomplete history)');
  }
  const changes = changedPaths(values.repo, base, head, policy);
  const outOfScope = changes.filter(row => !row.allowed).length;
  if (values.json) {
    console.log(JSON.stringify({ base, head, changed: changes.length, outOfScope, changes }));
  } else {
    console.log(`Commit scope: ${outOfScope} out of scope / ${changes.length} changed`);
    console.log(`Base: ${base}\nHead: ${head}`);
    for (const row of changes) {
      console.log(`${row.allowed ? 'OK ' : 'OUT'} ${row.status} ${JSON.stringify(row.path)}`);
    }
  }
  return outOfScope ? 1 : 0;
}

try {
  process.exitCode = process.argv[2] === 'worktree' ? worktree(process.argv.slice(3)) : main();
} catch (error) {
  console.error(`commit-scope: ${error.message}`);
  process.exitCode = 2;
}
