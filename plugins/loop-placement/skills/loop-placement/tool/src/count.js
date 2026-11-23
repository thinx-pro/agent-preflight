export function countTransitions(plan) {
  const { devices, start, end, passes } = plan;
  if (!Array.isArray(devices) || !devices.length ||
      devices.some(device => typeof device !== 'string' || !device.trim() || device !== device.trim())) {
    throw new Error('devices must list one nonblank, trimmed device name per layer');
  }
  if (![start, end, passes].every(Number.isSafeInteger) ||
      start < 0 || start >= end || end > devices.length || passes < 1) {
    throw new Error('expected 0 <= start < end <= devices.length and a positive integer passes');
  }

  let outside = 0;
  let withinOnePass = 0;
  for (let layer = 1; layer < devices.length; layer++) {
    if (devices[layer] === devices[layer - 1]) continue;
    if (layer > start && layer < end) withinOnePass++;
    else outside++;
  }
  const betweenPasses = devices[end - 1] === devices[start] ? 0 : passes - 1;
  const total = outside + withinOnePass * passes + betweenPasses;
  if (!Number.isSafeInteger(total)) throw new Error('transition count exceeds safe integer range');
  return { outside, withinOnePass, passes, betweenPasses, total };
}
