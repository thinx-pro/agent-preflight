#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function parse(text,metric='score'){
 const map=new Map();
 text.split(/\r?\n/).forEach((line,i)=>{
  if(!line.trim())return;
  let row;try{row=JSON.parse(line);}catch{throw Error(`Line ${i+1}: invalid JSON`);}
  if(!row||typeof row.id!=='string'||!row.id.trim())throw Error(`Line ${i+1}: nonempty string id required`);
  if(map.has(row.id))throw Error(`Line ${i+1}: duplicate id ${row.id}`);
  if(typeof row[metric]!=='number'||!Number.isFinite(row[metric]))throw Error(`Line ${i+1}: ${metric} must be finite numeric data`);
  map.set(row.id,row[metric]);
 });
 if(!map.size)throw Error('Evaluation file has no cases');return map;
}
export function compare(before,after,{direction='higher',epsilon=0}={}){
 if(!['higher','lower'].includes(direction)||!Number.isFinite(epsilon)||epsilon<0)throw Error('Invalid direction or epsilon');
 const pairs=[],missingAfter=[],missingBefore=[];
 for(const [id,a] of before){
  if(!after.has(id)){missingAfter.push(id);continue;}
  const b=after.get(id),delta=b-a,gain=direction==='higher'?delta:-delta;
  if(!Number.isFinite(delta))throw Error(`Numeric overflow for ${id}`);
  pairs.push({id,before:a,after:b,delta,outcome:gain>epsilon?'improved':gain< -epsilon?'regressed':'unchanged'});
 }
 for(const id of after.keys())if(!before.has(id))missingBefore.push(id);
 pairs.sort((a,b)=>a.id.localeCompare(b.id));missingAfter.sort();missingBefore.sort();
 const count=outcome=>pairs.filter(p=>p.outcome===outcome).length;
 const mean=key=>pairs.length?pairs.reduce((sum,p)=>sum+p[key]/pairs.length,0):null;
 const summary={paired:pairs.length,improved:count('improved'),regressed:count('regressed'),unchanged:count('unchanged'),meanBefore:mean('before'),meanAfter:mean('after')};
 if(Object.values(summary).some(v=>v!==null&&!Number.isFinite(v)))throw Error('Numeric overflow in summary');
 return {direction,epsilon,summary,missingAfter,missingBefore,pairs,failed:!pairs.length||summary.regressed>0||missingAfter.length>0||missingBefore.length>0,
  caveat:'Descriptive paired comparison only; not a significance test. Means use matched cases only. Missing cases are not counted as zero.'};
}
const esc=s=>String(s).replace(/[|\r\n]/g,' ');
export function markdown(r){return `# Paired evaluation\n\n${r.summary.paired} paired; ${r.summary.improved} improved; ${r.summary.regressed} regressed; ${r.summary.unchanged} unchanged.\n\nDirection: ${r.direction}; epsilon: ${r.epsilon}. Matched means: ${r.summary.meanBefore} → ${r.summary.meanAfter}.\n\n| Case | Before | After | Delta | Outcome |\n|---|---:|---:|---:|---|\n`+r.pairs.map(p=>`| ${esc(p.id)} | ${p.before} | ${p.after} | ${p.delta} | ${p.outcome} |`).join('\n')+`\n\nMissing in candidate: ${r.missingAfter.map(esc).join(', ')||'none'}\n\nNew in candidate: ${r.missingBefore.map(esc).join(', ')||'none'}\n\n${r.caveat}\n`;}
export function main(args=process.argv.slice(2)){
 if(args.includes('--help')||!args.length){console.log('eval-pairs BEFORE.jsonl AFTER.jsonl [--metric score] [--direction higher|lower] [--epsilon 0] [--json]\nExit 0: comparable with no regression; 1: regression, missing or no paired cases; 2: invalid input.');return 0;}
 const files=[],opts={};let metric='score',json=false;
 for(let i=0;i<args.length;i++){
  const a=args[i];if(a==='--json'){json=true;continue;}
  if(['--metric','--direction','--epsilon'].includes(a)){if(i+1>=args.length)throw Error(`Missing value: ${a}`);const v=args[++i];if(a==='--metric')metric=v;else opts[a.slice(2)]=a==='--epsilon'?Number(v):v;continue;}
  if(a.startsWith('-'))throw Error(`Unknown option: ${a}`);files.push(a);
 }
 if(files.length!==2)throw Error('Exactly two JSONL input files are required');
 const [before,after]=files.map(f=>{if(fs.statSync(f).size>10_000_000)throw Error('Input exceeds 10 MB');return parse(fs.readFileSync(f,'utf8'),metric);});
 const out={metric,...compare(before,after,opts)};process.stdout.write(json?JSON.stringify(out,null,2)+'\n':markdown(out));return out.failed?1:0;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{process.exitCode=main();}catch(e){console.error('eval-pairs: '+e.message);process.exitCode=2;}
}
