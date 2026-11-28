// One series uses one metric, unit and fixed configuration throughout.
export function compareSweep(series) {
  for (const field of ['configuration', 'metric', 'unit']) {
    if (typeof series?.[field] !== 'string' || !series[field].trim()) {
      throw new Error('Expected a nonempty ' + field);
    }
  }
  const { configuration, metric, unit, minimumRise, samples } = series;
  if (!Number.isFinite(minimumRise) || minimumRise <= 0) {
    throw new Error('minimumRise must be a positive finite number in the stated unit');
  }
  if (!Array.isArray(samples) || samples.length < 2) {
    throw new Error('Expected at least two samples');
  }
  for (const row of samples) {
    if (!Number.isSafeInteger(row?.ubatch) || row.ubatch <= 0 ||
        !Number.isFinite(row.value) || row.value < 0) {
      throw new Error('Each sample needs a positive integer ubatch and nonnegative finite value');
    }
  }
  const ordered = [...samples].sort((a, b) => a.ubatch - b.ubatch);
  const rises = [];
  for (let i = 1; i < ordered.length; i++) {
    const previous = ordered[i - 1];
    const current = ordered[i];
    if (previous.ubatch === current.ubatch) throw new Error('Duplicate ubatch');
    const delta = current.value - previous.value;
    if (delta >= minimumRise) {
      rises.push({ from: previous.ubatch, to: current.ubatch, before: previous.value,
        after: current.value, delta, untestedBetween: current.ubatch - previous.ubatch - 1 });
    }
  }
  return { configuration, metric, unit, minimumRise, samplesCompared: samples.length, rises };
}
