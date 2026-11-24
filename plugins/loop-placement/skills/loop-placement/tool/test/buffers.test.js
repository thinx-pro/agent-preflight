import test from 'node:test';
import assert from 'node:assert/strict';
import { readBuffers } from '../src/buffers.js';

const weights = 'load_tensors: Vulkan0 model buffer size = 15.25 MiB';
const cache = 'llama_kv_cache: Vulkan1 KV buffer size = 4 MiB';

test('preserves multiple records, explicit zero and missing device observations', () => {
  const lines = ['\x1b[34m0.01.01\x1b[0m I ' + weights, cache, cache.replace('4 MiB', '0 MiB')];
  assert.deepEqual(readBuffers(lines.join('\r\n')).devices, [
    { device: 'Vulkan0', modelMiB: [15.25], kvMiB: [] },
    { device: 'Vulkan1', modelMiB: [], kvMiB: [4, 0] }
  ]);
});

test('pairs buffers on the same backend and ignores unrelated log messages', () => {
  const result = readBuffers([weights, cache.replace('Vulkan1', 'Vulkan0'), 'prompt: ' + cache].join('\n'));
  assert.equal(result.devices.length, 1);
  assert.deepEqual(result.devices[0].kvMiB, [4]);
});

for (const log of ['', weights, cache, weights + '\n' + cache + '\n' + cache.replace('MiB','GiB'),
                   weights + '\n' + cache.replace('4 MiB', '-1 MiB'),
                   weights + '\n' + cache.replace('llama_kv_cache', 'load_tensors')]) {
  test('rejects incomplete or unsupported input ' + JSON.stringify(log), () => {
    assert.throws(() => readBuffers(log));
  });
}
