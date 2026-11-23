#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { countTransitions } from '../src/count.js';

const args = process.argv.slice(2);
const usage = 'Usage: node bin/loop-placement.js PLAN.json';
if (args.length === 1 && args[0] === '--help') {
  console.log(usage);
} else {
  try {
    if (args.length !== 1) throw new Error(usage);
    const plan = JSON.parse(readFileSync(args[0], 'utf8'));
    console.log(JSON.stringify(countTransitions(plan), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
