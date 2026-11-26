const decimal = '(?:[0-9]+(?:\\.[0-9]+)?)';
const fields = [
  ['Generation', 'seconds', new RegExp('^Generation\\s+(' + decimal + ')\\s*s$')],
  ['Speed', 'tokensPerSecond', new RegExp('^Speed\\s+(' + decimal + ')\\s*tok/s$')],
  ['Tokens', 'tokens', /^Tokens\s+([0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)$/],
];

export function parseSummary(text) {
  const result = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const label = line.split(/\s+/, 1)[0];
    const field = fields.find(([name]) => name === label);
    if (!field) continue;
    const [, key, pattern] = field;
    const match = line.match(pattern);
    if (!match || Object.hasOwn(result, key)) throw Error('Invalid or repeated ' + label);
    const value = Number(match[1].replaceAll(',', ''));
    if (!Number.isFinite(value) || value <= 0 || (key === 'tokens' && !Number.isSafeInteger(value))) {
      throw Error('Expected a positive ' + label + ' value');
    }
    result[key] = value;
  }
  for (const [name, key] of fields) {
    if (!Object.hasOwn(result, key)) throw Error('Missing ' + name);
  }
  return result;
}

export function compare(baseline, candidate) {
  const time = candidate.seconds - baseline.seconds;
  const rate = candidate.tokensPerSecond - baseline.tokensPerSecond;
  return { baseline, candidate, generationSecondsDelta: Number(time.toPrecision(15)),
    outputTokensDelta: candidate.tokens - baseline.tokens,
    rateTimeReversal: time > 0 && rate > 0 || time < 0 && rate < 0 };
}
