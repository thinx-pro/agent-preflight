import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compare, parseSummary } from '../src/compare.js';
const load = name => readFileSync(new URL('../examples/' + name + '.txt', import.meta.url), 'utf8');
const text = load('baseline');
const a = parseSummary(text), b = parseSummary(load('candidate'));
test('same prompt observations reverse speed and time rankings in either order', () => {
  assert.equal(compare(a,b).outputTokensDelta, 1133);
  assert.ok(Math.abs(compare(a,b).generationSecondsDelta - 24.8) < 1e-12);
  assert.ok(compare(a,b).rateTimeReversal && compare(b,a).rateTimeReversal);
});
test('tie and faster completion controls', () => {
  for (const candidate of [a, {...a, seconds:80, tokensPerSecond:24}]) {
    assert.equal(compare(a,candidate).rateTimeReversal,false);
  }
});
test('skips prompt speed and first-token metadata, accepts CRLF', () => {
  assert.deepEqual(parseSummary('Prompt speed 222.9 tok/s\r\nFirst token 2.12s\r\n'+text.replaceAll('\n','\r\n')), a);
});
for (const [label,bad] of Object.entries({
  repeated:text+text, missing:'Speed 22 tok/s', commas:text.replace('1,860','18,60'),
  units:text.replace('83.49s','83490ms'), zero:text.replace('22.3','0'),
  fraction:text.replace('1,860','1.5'), unsafe:text.replace('1,860','9007199254740992'),
  negative:text.replace('22.3','-1')
})) test('rejects '+label, () => assert.throws(() => parseSummary(bad)));
