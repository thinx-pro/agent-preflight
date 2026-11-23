import test from 'node:test';
import assert from 'node:assert/strict';
import { countTransitions } from '../src/count.js';

test('matches explicit execution for every four-layer binary placement and core interval', () => {
  for (let mask = 0; mask < 16; mask++) {
    const devices = Array.from({length: 4}, (_, i) => mask & (1 << i) ? 'B' : 'A');
    for (let start = 0; start < 4; start++) {
      for (let end = start + 1; end <= 4; end++) {
        for (const passes of [1, 2, 3]) {
          const core = devices.slice(start, end);
          const path = [...devices.slice(0, start), ...Array(passes).fill(core).flat(), ...devices.slice(end)];
          const expected = path.filter((v, i) => i > 0 && v !== path[i - 1]).length;
          assert.equal(countTransitions({ devices, start, end, passes }).total, expected);
        }
      }
    }
  }
});

const plan = { devices: ['A','B','A'], start: 0, end: 3, passes: 3 };
for (const change of [{ start: -1 }, { end: 0 }, { end: 4 }, { passes: 0 },
  { passes: 2.5 }, { passes: Number.MAX_SAFE_INTEGER }, { devices: [''] }, { devices: 'A' }]) {
  test('rejects invalid plan ' + JSON.stringify(change), () => {
    assert.throws(() => countTransitions({ ...plan, ...change }));
  });
}
