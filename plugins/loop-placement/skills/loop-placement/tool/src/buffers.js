// The logger may prefix a line with an elapsed time and a coloured severity.
const logger = /^(?:[\d:.]+\s+[A-Z]\s+)?(load_tensors|llama_kv_cache):\s*(.*)$/;
const allocation = /^(\S+)\s+(model|KV) buffer size\s*=\s*(\d+(?:\.\d+)?)\s+MiB$/;

export function readBuffers(log) {
  const devices = new Map();
  const seen = new Set();
  for (const [index, raw] of log.split(/\r?\n/).entries()) {
    const line = raw.replace(/\x1b\[[0-9;]*m/g, '').trim();
    const record = line.match(logger);
    if (!record || !/\b(model|KV) buffer size\b/.test(record[2])) continue;
    const parsed = record[2].match(allocation);
    const expected = record[1] === 'load_tensors' ? 'model' : 'KV';
    if (!parsed || parsed[2] !== expected) {
      throw new Error('unsupported buffer record at line ' + (index + 1));
    }
    const [, device, kind, size] = parsed;
    const value = Number(size);
    if (!Number.isFinite(value)) throw new Error('invalid size at line ' + (index + 1));
    if (!devices.has(device)) devices.set(device, { device, modelMiB: [], kvMiB: [] });
    const row = devices.get(device);
    (kind === 'model' ? row.modelMiB : row.kvMiB).push(value);
    seen.add(kind);
  }
  if (seen.size !== 2) throw new Error('need both model and KV buffer records from one startup');
  return { devices: [...devices.values()] };
}
