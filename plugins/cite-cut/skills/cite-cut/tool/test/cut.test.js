import test from 'node:test';
import assert from 'node:assert/strict';
import {cut} from '../bin/cite-cut.js';
test('keeps adjacent qualifications and exact source line numbers',()=>{
 const r=cut('Intro\nCUDA support changed\nOnly on Linux\nend',{query:['cuda'],context:1});
 assert.deepEqual(r.ranges,[{start:1,end:3}]);assert.match(r.markdown,/3: Only on Linux/);
});
test('merges overlapping windows rather than duplicating evidence',()=>{
 const r=cut('one\nmatch\nmatch\nfour',{query:['match'],context:1});
 assert.equal(r.ranges.length,1);assert.equal(r.includedMatches,2);
});
test('does not invent output on no match',()=>{
 const r=cut('ordinary content',{query:['missing']});assert.equal(r.noMatches,true);assert.equal(r.ranges.length,0);
});
test('budget includes all Markdown overhead',()=>{
 const r=cut(Array.from({length:100},(_,i)=>`match ${i}`).join('\n'),{query:['match'],maxChars:350,maxMatches:3,context:0});
 assert.ok(r.outputChars<=350);assert.equal(r.markdown.length,r.outputChars);assert.ok(r.omittedMatches>0);
});
test('too-long windows are omitted without silently clipping source lines',()=>{
 const r=cut('match '+ 'x'.repeat(3000),{query:['match'],maxChars:350});assert.equal(r.includedMatches,0);assert.equal(r.omittedMatches,1);
});
test('literal metacharacters and Unicode work',()=>{
 assert.equal(cut('成本 [a.*] 条件',{query:['[a.*]']}).matchCount,1);
 assert.equal(cut('成本条件',{query:['成本']}).matchCount,1);
});
test('invalid limits and empty queries fail',()=>{
 assert.throws(()=>cut('x',{query:['']}));assert.throws(()=>cut('x',{query:['x'],context:-1}));assert.throws(()=>cut('x',{query:['x'],maxMatches:1.5}));
});
test('hash identifies exact input including CRLF',()=>{
 assert.notEqual(cut('a\r\n',{query:['a']}).sha256,cut('a\n',{query:['a']}).sha256);
});
