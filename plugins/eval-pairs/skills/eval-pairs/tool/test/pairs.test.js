import test from 'node:test';import assert from 'node:assert/strict';import {parse,compare} from '../bin/eval-pairs.js';
const rows=xs=>parse(xs.map(([id,score])=>JSON.stringify({id,score})).join('\n'));
test('detects a regression hidden by unchanged mean',()=>{
 const r=compare(rows([['a',1],['b',0]]),rows([['b',1],['a',0]]));
 assert.equal(r.summary.meanBefore,r.summary.meanAfter);assert.equal(r.summary.regressed,1);assert.equal(r.summary.improved,1);assert.equal(r.failed,true);
});
test('same IDs, reordered, remain unchanged',()=>{
 const r=compare(rows([['a',1],['b',2]]),rows([['b',2],['a',1]]));assert.equal(r.failed,false);
});
test('reports missing cases without turning them into zero',()=>{
 const r=compare(rows([['a',10],['b',20]]),rows([['a',10],['c',30]]));
 assert.deepEqual(r.missingAfter,['b']);assert.deepEqual(r.missingBefore,['c']);assert.equal(r.summary.meanBefore,10);assert.equal(r.failed,true);
});
test('lower is better and epsilon applies in metric units',()=>{
 assert.equal(compare(rows([['a',100]]),rows([['a',90]]),{direction:'lower'}).summary.improved,1);
 assert.equal(compare(rows([['a',100]]),rows([['a',99]]),{epsilon:1}).summary.unchanged,1);
});
test('duplicates and malformed values fail',()=>{
 for(const s of ['{"id":"a","score":1}\n{"id":"a","score":2}','{"id":"a","score":true}','{"id":"a","score":null}','{"id":"a","score":1e999}','no json',''])assert.throws(()=>parse(s));
});
test('empty overlap is not a passing eval',()=>assert.equal(compare(rows([['a',1]]),rows([['b',1]])).failed,true));
test('alternate metric and Unicode IDs work',()=>assert.equal(parse('{"id":"中文","latency":12}','latency').get('中文'),12));
test('invalid direction, negative epsilon and numeric overflow fail',()=>{
 assert.throws(()=>compare(rows([['a',1]]),rows([['a',1]]),{epsilon:-1}));assert.throws(()=>compare(rows([['a',1]]),rows([['a',1]]),{direction:'sideways'}));assert.throws(()=>compare(rows([['a',-1e308]]),rows([['a',1e308]])));
});
