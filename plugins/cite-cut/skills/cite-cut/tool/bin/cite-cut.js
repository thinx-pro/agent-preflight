#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export function cut(text, { query, context = 2, maxChars = 6000, maxMatches = 20, source = 'input' } = {}) {
  if (!Array.isArray(query) || !query.length || query.some(q => typeof q !== 'string' || !q.trim())) throw Error('Provide at least one nonempty literal query');
  for (const [key, n, min] of [['context',context,0],['maxChars',maxChars,256],['maxMatches',maxMatches,1]]) {
    if (!Number.isSafeInteger(n) || n < min) throw Error(`Invalid ${key}`);
  }
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  if (lines.at(-1) === '') lines.pop();
  const terms = query.map(q => q.toLowerCase());
  const hits = lines.flatMap((line,i) => terms.some(q => line.toLowerCase().includes(q)) ? [i] : []);
  const windows = [];
  for (const i of hits.slice(0,maxMatches)) {
    const start=Math.max(0,i-context), end=Math.min(lines.length-1,i+context);
    if (windows.length && start <= windows.at(-1).end+1) windows.at(-1).end=Math.max(windows.at(-1).end,end);
    else windows.push({start,end});
  }
  const sha256=createHash('sha256').update(text).digest('hex');
  const name=String(source).replace(/[\r\n\t\x00-\x1f]/g,' ').slice(0,100);
  const header=`Source: ${name}\nSHA256: ${sha256}\nLiteral matches: ${hits.length}; this is an excerpt, not the complete source.\n\n`;
  const footer='\n[End of excerpts; omitted text may contain important qualifications.]\n';
  let markdown=header, used=[];
  for (const w of windows) {
    // Keep complete source lines; never silently cut a statement in half.
    const block=`--- lines ${w.start+1}-${w.end+1} ---\n`+lines.slice(w.start,w.end+1).map((s,j)=>`${w.start+j+1}: ${s}`).join('\n')+'\n\n';
    if ((markdown+block+footer).length <= maxChars) { markdown+=block; used.push(w); }
  }
  const includedHits=hits.filter(i=>used.some(w=>w.start<=i&&i<=w.end)).length;
  markdown+=footer;
  if(markdown.length>maxChars) throw Error('Budget too small for source metadata; increase --max-chars');
  return {source:name,sha256,matchCount:hits.length,includedMatches:includedHits,omittedMatches:hits.length-includedHits,
    noMatches:hits.length===0,budgetUnit:'UTF-16 code units',maxChars,outputChars:markdown.length,
    ranges:used.map(w=>({start:w.start+1,end:w.end+1})),markdown};
}

export function main(args=process.argv.slice(2)) {
  if(args.includes('--help')||!args.length){ console.log('cite-cut FILE --query TEXT [--query TEXT] [--context 2] [--max-chars 6000] [--max-matches 20] [--json]\nLiteral, case-insensitive OR search. No network. Complete lines only. Budget includes Markdown metadata, not the JSON wrapper.');return 0; }
  const opts={query:[]};let file,json=false;
  for(let i=0;i<args.length;i++){
    const a=args[i];
    if(a==='--json'){json=true;continue;}
    if(['--query','--context','--max-chars','--max-matches'].includes(a)){
      if(i+1>=args.length)throw Error(`Missing value for ${a}`);
      const v=args[++i];if(a==='--query')opts.query.push(v);else opts[{'--context':'context','--max-chars':'maxChars','--max-matches':'maxMatches'}[a]]=Number(v);continue;
    }
    if(a.startsWith('-')||file)throw Error(`Unexpected argument: ${a}`);file=a;
  }
  if(!file)throw Error('FILE is required');
  if(fs.statSync(file).size>5_000_000)throw Error('Input exceeds 5 MB; select a smaller source');
  const text=fs.readFileSync(file,'utf8');if(text.includes('\0'))throw Error('Binary input is not supported');
  const out=cut(text,{...opts,source:path.basename(file)});
  process.stdout.write(json?JSON.stringify(out,null,2)+'\n':out.markdown);
  return out.includedMatches ? 0 : 1;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{process.exitCode=main();}catch(e){console.error('cite-cut: '+e.message);process.exitCode=2;}
}
