import test from 'node:test';
import assert from 'node:assert/strict';
import {check} from '../src/check.js';
const plan = {pages:2, rows:[{page:2,line:'Q2  120 USD'}]};
for (const [name,text,matches] of [
  ['whitespace','title\r\n\f Q2\t120   USD \r\n\f',1],
  ['wrong page','Q2 120 USD\fother',0],
  ['wrong unit','\fQ2 120 EUR',0],
  ['longer number','\fQ2 1200 USD',0],
  ['split row','\fQ2 120\nUSD',0],
  ['duplicate','\fQ2 120 USD\nQ2 120 USD',2],
  ['empty page','title\f\f',0]
]) test(name, () => {
  const report = check(plan,text);
  assert.equal(report.observedPages,2);
  assert.deepEqual(report.reviewPages,matches === 1 ? [] : [2]);
  assert.deepEqual(report.findings,matches === 1 ? [] : [{reference:1,page:2,matches}]);
});
test('truncated export', () => {
  const report = check(plan,'title\f');
  assert.equal(report.observedPages,1);
  assert.deepEqual(report.reviewPages,[2]);
});
for (const rows of [[],[null],[{page:3,line:'x'}],[{page:1,line:'a\nb'}],
  [{page:1,line:'x'},{page:1,line:' x '}]]) {
  test('reject invalid references '+JSON.stringify(rows), () => assert.throws(() => check({pages:2,rows},'')));
}
