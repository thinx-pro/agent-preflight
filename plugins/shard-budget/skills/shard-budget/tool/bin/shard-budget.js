#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const usage = 'Usage: node bin/shard-budget.js MODEL_INFO.json INDEX.json [--budget-bytes N]';

function inventory(info, bytes) {
  if (!/^[a-f0-9]{40}$/.test(info.sha) || !Array.isArray(info.siblings))
    throw new Error('Expected revision and siblings from the Hub model info API with blobs=true');
  const rows = new Map();
  for (const row of info.siblings) {
    if (typeof row?.rfilename !== 'string' || rows.has(row.rfilename))
      throw new Error('Invalid or duplicate manifest filename');
    rows.set(row.rfilename, row);
  }
  const index = rows.get('model.safetensors.index.json');
  const hash = createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
  if (index?.blobId !== hash || index.size !== bytes.length)
    throw new Error('Index bytes do not match this revision’s root model.safetensors.index.json');
  const map = JSON.parse(bytes).weight_map;
  if (!map || typeof map !== 'object' || Array.isArray(map) || !Object.keys(map).length)
    throw new Error('Expected a nonempty weight_map');
  const names = new Set(Object.values(map));
  let total = 0;
  for (const name of names) {
    if (typeof name !== 'string' || !name.endsWith('.safetensors'))
      throw new Error('Invalid shard name');
    const size = rows.get(name)?.size;
    if (!Number.isSafeInteger(size) || size <= 0) throw new Error('Missing shard or size: ' + name);
    total += size;
    if (!Number.isSafeInteger(total)) throw new Error('Total exceeds supported byte range');
  }
  return {revision: info.sha, tensors: Object.keys(map).length, shards: names.size, shardBytes: total};
}

function main(args) {
  if (args.length === 1 && ['-h', '--help'].includes(args[0])) { console.log(usage); return; }
  const [info, index, flag, value] = args;
  const budget = Number(value);
  if (![2, 4].includes(args.length) || (args.length === 4 &&
      (flag !== '--budget-bytes' || !/^\d+$/.test(value) || !Number.isSafeInteger(budget))))
    throw new Error(usage);
  const result = inventory(JSON.parse(readFileSync(info)), readFileSync(index));
  if (flag) {
    result.budgetBytes = budget;
    result.shortfallBytes = Math.max(0, result.shardBytes - budget);
    if (result.shortfallBytes) process.exitCode = 1;
  }
  console.log(JSON.stringify(result));
}
try { main(process.argv.slice(2)); }
catch (error) { console.error(error.message); process.exitCode = 2; }
