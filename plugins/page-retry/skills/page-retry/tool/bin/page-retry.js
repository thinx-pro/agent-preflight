#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {check} from '../src/check.js';

const args = process.argv.slice(2);
const usage = 'Usage: node bin/page-retry.js PLAN.json PAGINATED.txt';
if (args.length === 1 && args[0] === '--help') {
  console.log(usage);
} else {
  try {
    if (args.length !== 2) throw new Error(usage);
    const report = check(JSON.parse(readFileSync(args[0], 'utf8')), readFileSync(args[1], 'utf8'));
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = Number(report.findings.length > 0 || report.expectedPages !== report.observedPages);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
