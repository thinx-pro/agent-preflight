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

test('extended mode reads old and new compute prefixes and preserves repeated reservations', () => {
  const lines = [
    weights, cache, 'llama_context: CPU output buffer size = 0.58 MiB',
    'llama_context: Vulkan1 compute buffer size = 120.25 MiB',
    '0.02.12 I sched_reserve: Vulkan1 compute buffer size = 128.50 MiB',
    'llama_context: Vulkan1 compute buffer size is 128.50 MiB, matches expectation',
    'ggml_gallocr_reserve_n_impl: failed to allocate Vulkan1 buffer of size 65432'
  ];
  assert.deepEqual(readBuffers(lines.join('\n'), { extended: true }).devices, [
    { device: 'Vulkan0', modelMiB: [15.25], kvMiB: [], computeMiB: [], outputMiB: [] },
    { device: 'Vulkan1', modelMiB: [], kvMiB: [4], computeMiB: [120.25, 128.5], outputMiB: [] },
    { device: 'CPU', modelMiB: [], kvMiB: [], computeMiB: [], outputMiB: [0.58] }
  ]);
  assert.deepEqual(readBuffers(lines.join('\n')), readBuffers([weights, cache].join('\n')));
});

test('extended mode allows partial logs while distinguishing a reported zero', () => {
  const line = 'sched_reserve: Vulkan1 compute buffer size = 0 MiB';
  assert.deepEqual(readBuffers(line, { extended: true }).devices, [
    { device: 'Vulkan1', modelMiB: [], kvMiB: [], computeMiB: [0], outputMiB: [] }
  ]);
});

test('extended mode rejects logs without reservations or with unsupported sizes', () => {
  assert.throws(() => readBuffers('llama_context: failed to allocate compute pp buffers', { extended: true }));
  assert.throws(() => readBuffers('sched_reserve: Vulkan1 compute buffer size = 1 GiB', { extended: true }), /line 1/);
});
