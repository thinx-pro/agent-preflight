import test from 'node:test';import assert from 'node:assert/strict';import {select} from '../bin/release-window.js';
const row=(extra={})=>({tag_name:'v1',published_at:'2026-11-01T23:52:00Z',html_url:'https://github.com/example/tool/releases/tag/v1',prerelease:false,body:'New feature; fixes a crash',...extra});
const opts={from:'2026-11-02',to:'2026-11-02',timeZone:'Asia/Shanghai'};
test('UTC late-night release belongs to next Shanghai day',()=>{
 assert.equal(select([row()],opts).releaseCount,1);assert.equal(select([row()],{...opts,timeZone:'UTC'}).releaseCount,0);
});
test('prereleases are excluded unless requested',()=>{
 assert.equal(select([row({prerelease:true})],opts).releaseCount,0);assert.equal(select([row({prerelease:true})],{...opts,includePrerelease:true}).releaseCount,1);
});
test('deduplicates identical sources',()=>{const r=select([row(),row()],opts);assert.equal(r.releaseCount,1);assert.equal(r.duplicates,1);});
test('conflicting publication dates fail',()=>assert.throws(()=>select([row(),row({published_at:'2026-11-02T01:00:00Z'})],opts)));
test('does not silently use created_at for missing publication time',()=>assert.throws(()=>select([row({published_at:null,created_at:'2026-11-01T23:52:00Z'})],opts)));
test('rejects ambiguous and impossible dates',()=>{
 for(const value of ['2026-11-01T23:52:00','2026-02-30T00:00:00Z','2026-11-01T24:01:00Z'])assert.throws(()=>select([row({published_at:value})],opts));
 assert.throws(()=>select([],{...opts,from:'2026-02-30'}));
});
test('URL, repo and tag must agree',()=>{
 assert.throws(()=>select([row({repo:'other/repo'})],opts));assert.throws(()=>select([row({html_url:'https://evil.example/example/tool/releases/tag/v1'})],opts));assert.throws(()=>select([row({tag_name:'v2'})],opts));
});
test('handles empty windows and bad timezone',()=>{assert.equal(select([],opts).releaseCount,0);assert.throws(()=>select([],{...opts,timeZone:'bad-zone'}));});
test('drafts are not published evidence',()=>assert.equal(select([row({draft:true})],opts).releaseCount,0));
