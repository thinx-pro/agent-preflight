import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

function run(t, options = {}) {
  const tmp = mkdtempSync(join(tmpdir(), 'shard-budget-'));
  t.after(() => rmSync(tmp, {recursive:true, force:true}));
  const info = JSON.parse(readFileSync(new URL('../examples/info.json', import.meta.url)));
  options.edit?.(info);
  const index = readFileSync(new URL('../examples/index.json', import.meta.url), 'utf8');
  writeFileSync(join(tmp,'info'), JSON.stringify(info));
  writeFileSync(join(tmp,'index'), options.changed ? index.trim() : index);
  return spawnSync(process.execPath, [
    new URL('../bin/shard-budget.js', import.meta.url).pathname, join(tmp,'info'), join(tmp,'index'),
    ...(options.args ?? [])
  ], {encoding:'utf8'});
}
test('counts shared shards once and excludes unrelated files', t => {
  const r = run(t); assert.equal(r.status,0); const j = JSON.parse(r.stdout);
  assert.deepEqual([j.tensors,j.shards,j.shardBytes],[3,2,1024]);
});
for (const [limit,code,short] of [[1024,0,0],[1023,1,1],[0,1,1024]]) {
  test('budget ' + limit,t => {
    const r = run(t,{args:['--budget-bytes',String(limit)]});
    assert.equal(r.status,code); assert.equal(JSON.parse(r.stdout).shortfallBytes,short);
  });
}
for (const [label, options] of [
  ['changed index',{changed:true}],
  ['missing shard',{edit:i=>i.siblings.splice(1,1)}],
  ['missing size',{edit:i=>delete i.siblings[1].size}],
  ['duplicate filename',{edit:i=>i.siblings.push(i.siblings[1])}],
  ['missing revision',{edit:i=>delete i.sha}],
  ['invalid budget',{args:['--budget-bytes','1e4']}]
]) test(label,t=>{const r=run(t,options); assert.equal(r.status,2); assert.equal(r.stdout,'');});
