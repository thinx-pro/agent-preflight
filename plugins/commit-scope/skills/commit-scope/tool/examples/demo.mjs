import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = new URL('./', import.meta.url);
const temp = mkdtempSync(join(tmpdir(), 'commit-scope-demo-'));
let repo = join(temp, 'main');
const control = process.argv.includes('--control');
const git = (...args) => {
  const r = spawnSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgSign=false',
    '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', ...args],
    { cwd: repo, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr || String(r.error));
  return r.stdout.trim();
};
function demo() {
  mkdirSync(repo);
  git('init', '-q');
  mkdirSync(join(repo, 'src'));
  writeFileSync(join(repo, 'src', 'page.js'), 'export const title = "Before";\n');
  git('add', '.');
  git('commit', '-qm', 'Task start');
  const base = git('rev-parse', 'HEAD');
  const delivery = join(temp, 'delivery');
  git('worktree', 'add', '-qd', delivery, base);
  if (process.argv.includes('--resume')) {
    const bin = fileURLToPath(new URL('../bin/commit-scope.js', here));
    const pin = spawnSync(process.execPath, [bin, 'worktree'], { cwd: delivery, encoding: 'utf8' });
    if (pin.status !== 0) throw new Error(pin.stderr);
    const check = spawnSync(process.execPath, [bin, 'worktree', '--expect', pin.stdout.trim()],
      { cwd: control ? join(delivery, 'src') : repo, stdio: 'inherit' });
    return check.status ?? 2;
  }
  repo = delivery;
  writeFileSync(join(repo, 'src', 'page.js'), 'export const title = "After";\n');
  if (!control) {
    mkdirSync(join(repo, 'docs'));
    writeFileSync(join(repo, 'docs', 'roadmap.md'), '# An unrelated edit\n');
  }
  git('add', '.');
  git('commit', '-qm', 'Executor delivery');
  console.error(`git status --porcelain: ${git('status', '--porcelain') || '(empty)'}`);
  const r = spawnSync(process.execPath, [fileURLToPath(new URL('../bin/commit-scope.js', here)),
    '--repo', repo, '--base', base, '--allow', fileURLToPath(new URL('scope.json', here)),
    ...(process.argv.includes('--json') ? ['--json'] : [])], { stdio: 'inherit' });
  if (r.error) throw r.error;
  return r.status ?? 2;
}
try {
  process.exitCode = demo();
} finally {
  rmSync(temp, { recursive: true, force: true });
}
