function normalize(line) {
  return line.trim().replace(/[ \t]+/g, ' ');
}

export function check(plan, text) {
  if (!Number.isSafeInteger(plan?.pages) || plan.pages < 1 ||
      !Array.isArray(plan.rows) || !plan.rows.length) {
    throw new Error('Provide a positive pages count and at least one reference row.');
  }
  // Layout exports commonly finish each page, including the last, with FF.
  const pages = text.split('\f');
  if (pages.at(-1) === '') pages.pop();
  const indexed = new Map();
  const expected = new Map();
  const findings = [];
  for (const row of plan.rows) {
    if (!Number.isSafeInteger(row?.page) || row.page < 1 || row.page > plan.pages ||
        typeof row.line !== 'string' || /[\r\n\f]/.test(row.line) || !row.line.trim()) {
      throw new Error('Each reference needs a valid page and one nonempty line.');
    }
    const line = normalize(row.line);
    const key = JSON.stringify([row.page, line]);
    if (expected.has(key)) throw new Error('Repeated reference on the same page.');
    expected.set(key, true);
    if (!indexed.has(row.page)) {
      const counts = new Map();
      for (const raw of (pages[row.page - 1] ?? '').split(/\r\n|\r|\n/)) {
        const normalized = normalize(raw);
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
      }
      indexed.set(row.page, counts);
    }
    const matches = indexed.get(row.page).get(line) ?? 0;
    if (matches !== 1) findings.push({reference: expected.size, page: row.page, matches});
  }
  return {
    expectedPages: plan.pages, observedPages: pages.length,
    checkedRows: expected.size, findings,
    reviewPages: [...new Set(findings.map(f => f.page))].sort((a,b) => a-b)
  };
}
