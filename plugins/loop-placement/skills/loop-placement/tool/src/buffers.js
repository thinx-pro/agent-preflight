// The logger may prefix a line with an elapsed time and a coloured severity.
const logger = /^(?:[\d:.]+\s+[A-Z]\s+)?(load_tensors|llama_kv_cache):\s*(.*)$/;
const memoryLogger = /^(?:[\d:.]+\s+[A-Z]\s+)?(llama_context|sched_reserve):\s*(.*)$/;
const memoryAllocation = /^(\S+)\s+(compute|output) buffer size\s*=\s*(\d+(?:\.\d+)?)\s+MiB$/;
const fields = { model: 'modelMiB', KV: 'kvMiB', compute: 'computeMiB', output: 'outputMiB' };

const allocation = /^(\S+)\s+(model|KV) buffer size\s*=\s*(\d+(?:\.\d+)?)\s+MiB$/;

export function readBuffers(log, { extended = false } = {}) {
  const devices = new Map();
  const seen = new Set();
  for (const [index, raw] of log.split(/\r?\n/).entries()) {
    const line = raw.replace(/\x1b\[[0-9;]*m/g, '').trim();
    const legacyRecord = line.match(logger);
    const record = legacyRecord ?? (extended ? line.match(memoryLogger) : null);
    if (!record) continue;
    // Teardown comparisons use "size is/of" instead of a reservation's "size =".
    const recognized = legacyRecord ? /\b(model|KV) buffer size\b/ : /\b(compute|output) buffer size\s*=/;
    if (!recognized.test(record[2])) continue;
    const parsed = record[2].match(legacyRecord ? allocation : memoryAllocation);
    const expected = record[1] === 'load_tensors' ? 'model' : 'KV';
    if (!parsed || (legacyRecord && parsed[2] !== expected)) {
      throw new Error('unsupported buffer record at line ' + (index + 1));
    }
    const [, device, kind, size] = parsed;
    const value = Number(size);
    if (!Number.isFinite(value)) throw new Error('invalid size at line ' + (index + 1));
    if (!devices.has(device)) devices.set(device, { device, modelMiB: [], kvMiB: [] });
    const row = devices.get(device);
    if (extended && !('computeMiB' in row)) {
      row.computeMiB = [];
      row.outputMiB = [];
    }
    row[fields[kind]].push(value);
    seen.add(kind);
  }
  if (extended && seen.size === 0) throw new Error('no reported startup buffers');
  if (!extended && seen.size !== 2) throw new Error('need both model and KV buffer records from one startup');
  return { devices: [...devices.values()] };
}
