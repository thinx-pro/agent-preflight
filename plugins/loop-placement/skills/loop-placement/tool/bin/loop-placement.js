#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { countTransitions } from '../src/count.js';
import { readBuffers } from '../src/buffers.js';

const args = process.argv.slice(2);
const usage = 'Usage: node bin/loop-placement.js PLAN.json | --buffers STARTUP.log | --memory STARTUP.log';
if (args.length === 1 && args[0] === '--help') {
  console.log(usage);
} else {
  try {
    let result;
    if (args.length === 2 && ['--buffers', '--memory'].includes(args[0])) {
      result = readBuffers(readFileSync(args[1], 'utf8'), { extended: args[0] === '--memory' });
    } else if (args.length === 1 && !args[0].startsWith('--')) {
      result = countTransitions(JSON.parse(readFileSync(args[0], 'utf8')));
    } else {
      throw new Error(usage);
    }
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
