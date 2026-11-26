#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { compare, parseSummary } from '../src/compare.js';

const paths = process.argv.slice(2);
const usage = 'Usage: node bin/decode-compare.js BASELINE.txt CANDIDATE.txt';
if (paths.length === 1 && paths[0] === '--help') {
  console.log(usage);
} else {
  try {
    if (paths.length !== 2) throw Error(usage);
    const runs = paths.map(path => {
      try { return parseSummary(readFileSync(path, 'utf8')); }
      catch (error) { throw Error(path + ': ' + error.message); }
    });
    console.log(JSON.stringify(compare(...runs), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
