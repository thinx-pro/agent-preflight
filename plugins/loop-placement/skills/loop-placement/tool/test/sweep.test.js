import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareSweep } from '../src/sweep.js';
const fixture = name => JSON.parse(readFileSync(new URL('../examples/' + name + '.json', import.meta.url)));
test('public seven-row series retains metric and unit and isolates 31 to 32', () => {
  const result = compareSweep(fixture('rx6700s'));
  assert.equal(result.samplesCompared, 7);
  assert.deepEqual(result.rises, [{from:31,to:32,before:2322,after:6672,delta:4350,untestedBetween:0}]);
  assert.equal(result.unit, 'source table units (unspecified)');
});
test('flat control', () => assert.deepEqual(compareSweep(fixture('flat')).rises, []));
test('sorts sparse samples, includes equality, excludes decreases', () => {
  const series = fixture('flat');
  series.samples = [{ubatch:20,value:0},{ubatch:3,value:0},{ubatch:8,value:100}];
  assert.deepEqual(compareSweep(series).rises, [{from:3,to:8,before:0,after:100,delta:100,untestedBetween:4}]);
});
for (const patch of [{metric:''},{configuration:null},{unit:' '},{minimumRise:0},
  {samples:[]},{samples:[{ubatch:2,value:1},{ubatch:2,value:2}]},
  {samples:[null,null]}, {samples:[{ubatch:1,value:-1},{ubatch:2,value:0}]}]) {
  test('rejects ' + JSON.stringify(patch), () => assert.throws(() => compareSweep({...fixture('flat'), ...patch})));
}
