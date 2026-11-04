#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function dayValid(s){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
 const d=new Date(s+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===s;
}
export function select(records,{from,to,timeZone='UTC',includePrerelease=false}={}){
 if(!dayValid(from)||!dayValid(to)||from>to)throw Error('Provide valid inclusive --from and --to YYYY-MM-DD dates');
 const fmt=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'});
 const seen=new Map();let duplicates=0;
 for(const [i,r] of records.entries()){
  if(!r||typeof r!=='object'||Array.isArray(r))throw Error(`Record ${i+1}: expected an object`);
  if(r.draft===true)continue;
  if(typeof r.published_at!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(r.published_at)||!dayValid(r.published_at.slice(0,10)))throw Error(`Record ${i+1}: published_at must be an explicit timezone timestamp`);
  const instant=new Date(r.published_at);if(!Number.isFinite(+instant))throw Error(`Record ${i+1}: invalid timestamp`);
  if(!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d/.test(r.published_at))throw Error(`Record ${i+1}: invalid clock time`);
  const u=new URL(r.html_url);
  const m=u.pathname.match(/^\/([^/]+\/[^/]+)\/releases\/tag\/(.+)$/);
  if(u.protocol!=='https:'||u.hostname!=='github.com'||u.port||u.username||u.password||u.search||u.hash||!m)throw Error(`Record ${i+1}: expected a canonical GitHub release URL`);
  if(typeof r.tag_name!=='string'||!r.tag_name.trim()||typeof r.prerelease!=='boolean')throw Error(`Record ${i+1}: tag_name and boolean prerelease are required`);
  const repo=m[1];if(r.repo&&r.repo.toLowerCase()!==repo.toLowerCase())throw Error(`Record ${i+1}: repo and URL disagree`);
  if(decodeURIComponent(m[2])!==r.tag_name)throw Error(`Record ${i+1}: tag and URL disagree`);
  const dateParts=Object.fromEntries(fmt.formatToParts(instant).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
  const localDate=`${dateParts.year}-${dateParts.month}-${dateParts.day}`;
  const body=typeof r.body==='string'?r.body:'';
  const row={repo,tag:r.tag_name,publishedAt:instant.toISOString(),localDate,prerelease:r.prerelease,url:u.href,
    signals:[/breaking|deprecated|dropped|removed/i.test(body)&&'compatibility',/fix(?:es|ed)?\b/i.test(body)&&'fixes',/new|feature|added/i.test(body)&&'features'].filter(Boolean)};
  const key=repo.toLowerCase()+'@'+r.tag_name;
  if(seen.has(key)){
   if(JSON.stringify(seen.get(key))!==JSON.stringify(row))throw Error(`Conflicting duplicate: ${key}`);
   duplicates++;continue;
  }
  seen.set(key,row);
 }
 const releases=[...seen.values()].filter(r=>r.localDate>=from&&r.localDate<=to&&(includePrerelease||!r.prerelease)).sort((a,b)=>a.publishedAt.localeCompare(b.publishedAt)||a.repo.localeCompare(b.repo)||a.tag.localeCompare(b.tag));
 const dates={};for(const r of releases)dates[r.localDate]=(dates[r.localDate]||0)+1;
 return {from,to,timeZone,includePrerelease,duplicates,releaseCount:releases.length,dates,releases,
   caveat:'Archived publication dates, not historical popularity. Signals are keyword hints, not upgrade advice. Completeness depends on supplied records.'};
}
function esc(s){return String(s).replace(/[|\r\n]/g,' ');}
export function markdown(r){return `# Release window: ${r.from} to ${r.to}\n\nTimezone: ${r.timeZone}. ${r.releaseCount} releases; ${r.duplicates} duplicates removed.\n\n| Local date | Repository | Tag | Kind | Signals | Source |\n|---|---|---|---|---|---|\n`+r.releases.map(x=>`| ${x.localDate} | ${esc(x.repo)} | ${esc(x.tag)} | ${x.prerelease?'prerelease':'stable'} | ${x.signals.join(', ')} | [release](${x.url.replace(/\)/g,'%29')}) |`).join('\n')+`\n\n${r.caveat}\n`;}
export function main(args=process.argv.slice(2)){
 if(args.includes('--help')||!args.length){console.log('release-window FILE.json [FILE.json ...] --from YYYY-MM-DD --to YYYY-MM-DD [--timezone Asia/Shanghai] [--include-prerelease] [--json]\nReads GitHub release objects or arrays. Offline; no credentials, fetching, or star estimates.');return 0;}
 const opts={},files=[];let json=false;
 for(let i=0;i<args.length;i++){
  const a=args[i];if(a==='--json'){json=true;continue;}if(a==='--include-prerelease'){opts.includePrerelease=true;continue;}
  if(['--from','--to','--timezone'].includes(a)){if(i+1>=args.length)throw Error(`Missing value: ${a}`);opts[a==='--timezone'?'timeZone':a.slice(2)]=args[++i];continue;}
  if(a.startsWith('-'))throw Error(`Unknown option: ${a}`);files.push(a);
 }
 if(!files.length)throw Error('At least one input file is required');
 const records=files.flatMap(f=>{if(fs.statSync(f).size>10_000_000)throw Error('Input exceeds 10 MB');const v=JSON.parse(fs.readFileSync(f,'utf8'));return Array.isArray(v)?v:[v];});
 const out=select(records,opts);process.stdout.write(json?JSON.stringify(out,null,2)+'\n':markdown(out));return 0;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{process.exitCode=main();}catch(e){console.error('release-window: '+e.message);process.exitCode=2;}
}
