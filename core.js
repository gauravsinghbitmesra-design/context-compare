(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ContextCompare = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  const DEFINITIONS = [
    ['system_prompt', 'System prompt', ['system prompt']],
    ['system_tools', 'System tools', ['system tools', 'built-in tools', 'builtin tools']],
    ['mcp_tools', 'MCP tools', ['mcp tools', 'mcp servers']],
    ['custom_agents', 'Custom agents', ['custom agents', 'agents']],
    ['memory', 'Memory files', ['memory files', 'memory', 'claude.md', 'claude.md and memory files']],
    ['skills', 'Skills', ['skills']],
    ['messages', 'Messages', ['messages', 'conversation']],
    ['free_space', 'Free space', ['free space']],
    ['autocompact_buffer', 'Autocompact buffer', ['autocompact buffer', 'auto-compact buffer', 'autocompaction buffer']]
  ];
  const ALIASES = new Map();
  for (const [id, , aliases] of DEFINITIONS) {
    ALIASES.set(id, id);
    for (const alias of aliases) ALIASES.set(alias, id);
  }
  const LABELS = new Map(DEFINITIONS.map(([id, label]) => [id, label]));
  const SETUP = new Set(DEFINITIONS.slice(0, 6).map(([id]) => id));
  const CONSUMED = new Set([...SETUP, 'messages']);
  const W = Object.freeze({
    rounded: 'Some displayed counts are rounded or approximate; small differences may be rounding rather than a real change.',
    unknown: 'Some lines or keys were not recognized and were excluded; raw unrecognized content is not included in the report.',
    exceedsTotal: 'The sum of reported used categories exceeds the reported total beyond display rounding. Check the source accounting.',
    exceedsCapacity: 'Reported used tokens exceed reported capacity. Check the source accounting.',
    reserves: 'Reported used tokens plus remaining reserves do not reconcile with reported capacity beyond display rounding.',
    categoriesCapacity: 'The sum of reported used categories exceeds reported capacity beyond display rounding.',
    matched: 'Comparison conditions are unconfirmed. Keep model, version, workload and fresh-session conditions the same.',
    capacity: 'Reported capacities differ; this is not a matched comparison of context-window proportions.',
    missing: 'Some selected categories are missing from one or both snapshots. Subtotals compare only shared reported categories; missing is not zero.',
    range: 'Rounded before/after counts create an uncertainty range for the reported delta; this does not prove an actual reduction.',
    totalsMissing: 'A reported total or capacity is missing; a complete context-window comparison cannot be established.'
  });
  const KNOWN_WARNINGS = new Set(Object.values(W));
  const LIMITATIONS = Object.freeze([
    'Reported counts are source observations, not independently measured wire tokens, billing, quota or proven savings.',
    'Only selected categories present in both snapshots contribute to the compared subtotals.',
    'A same-conditions confirmation is supplied by the operator, not verified by this tool.'
  ]);
  const MAX_COUNT = 1000000000;

  function fail(message) { throw new Error(message); }
  function unique(items) { return [...new Set(items)]; }
  function normalizeLabel(label) {
    return String(label).trim().replace(/\*\*/g, '').replace(/\s*\([^)]*\)\s*$/, '')
      .replace(/\s+/g, ' ').toLowerCase();
  }
  function categoryId(label) { return ALIASES.get(normalizeLabel(label)) || null; }
  function parseCount(value) {
    if (typeof value === 'number') {
      if (!Number.isSafeInteger(value) || value < 0 || value > MAX_COUNT) fail('Invalid token count value.');
      return { tokens: value, approximate: false, roundingHalf: 0 };
    }
    if (typeof value !== 'string') fail('Invalid token count value.');
    if (/^[~≈]/.test(value.trim())) fail('Unquantified approximate counts are unsupported. Use displayed k/m counts or explicit integers.');
    const match = value.trim().match(/^(~|≈)?\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)([km])?\s*(?:tokens?)?\s*(?:(?:\(\s*\d+(?:\.\d+)?%\s*\))|(?:\d+(?:\.\d+)?%))?$/i);
    if (!match) fail('Invalid token count value. Use nonnegative integers or displayed k/m counts.');
    const raw = match[2].replace(/,/g, '');
    const scale = !match[3] ? 1 : match[3].toLowerCase() === 'k' ? 1000 : 1000000;
    const valueNumber = Number(raw) * scale;
    // Avoid accepting fractional integer counts because of display-unit mistakes.
    const rounded = Math.round(valueNumber);
    if (!Number.isFinite(valueNumber) || Math.abs(valueNumber - rounded) > 1e-7 || rounded < 0 || rounded > MAX_COUNT || (!match[3] && raw.includes('.'))) {
      fail('Invalid token count value.');
    }
    const decimals = (raw.split('.')[1] || '').length;
    const roundingHalf = match[3] ? scale / (10 ** decimals) / 2 : 0;
    return { tokens: rounded, approximate: Boolean(match[1] || match[3]), roundingHalf };
  }
  function makeState() {
    return { categories: new Map(), used: null, capacity: null, ignored: 0 };
  }
  function addCategory(state, label, value) {
    const id = categoryId(label);
    if (!id) { state.ignored++; return; }
    if (state.categories.has(id)) fail('Duplicate category or alias in a snapshot.');
    state.categories.set(id, { id, label: LABELS.get(id), ...parseCount(value) });
  }
  function addTotal(state, used, capacity) {
    if (state.used !== null || state.capacity !== null) fail('Duplicate reported total in a snapshot.');
    state.used = parseCount(used);
    state.capacity = parseCount(capacity);
  }
  function checkJSONKeys(text) {
    // JSON.parse cannot report repeated exact keys. Inspect already-valid JSON
    // tokens so those duplicates cannot silently become last-value-wins.
    const stack = [];
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '{' || char === '[') {
        stack.push({ object: char === '{', keys: new Set(), expectingKey: char === '{' });
        if (stack.length > 64) fail('JSON nesting exceeds the supported limit.');
      } else if (char === '}' || char === ']') stack.pop();
      else if (char === ',' && stack.length && stack[stack.length - 1].object) stack[stack.length - 1].expectingKey = true;
      else if (char === ':' && stack.length && stack[stack.length - 1].object) stack[stack.length - 1].expectingKey = false;
      else if (char === '"') {
        const start = i;
        i++;
        while (i < text.length) {
          if (text[i] === '\\') i += 2;
          else if (text[i] === '"') break;
          else i++;
        }
        const frame = stack[stack.length - 1];
        if (frame?.object && frame.expectingKey) {
          const key = JSON.parse(text.slice(start, i + 1));
          if (frame.keys.has(key)) fail('Duplicate JSON key in a snapshot.');
          frame.keys.add(key);
        }
      }
    }
  }
  function parseJSON(text, state) {
    let input;
    try { input = JSON.parse(text); } catch { fail('Invalid JSON snapshot.'); }
    checkJSONKeys(text);
    if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Invalid JSON snapshot shape.');
    if (Object.hasOwn(input, 'schemaVersion') && input.schemaVersion !== 1) fail('Unsupported snapshot schema version.');
    if (!input.categories || typeof input.categories !== 'object' || Array.isArray(input.categories)) fail('JSON categories must be an object of known category counts.');
    for (const [key, value] of Object.entries(input.categories)) addCategory(state, key, value);
    if (Object.hasOwn(input, 'usedTokens') && input.usedTokens !== null) state.used = parseCount(input.usedTokens);
    if (Object.hasOwn(input, 'capacityTokens') && input.capacityTokens !== null) state.capacity = parseCount(input.capacityTokens);
    for (const key of Object.keys(input)) {
      if (!['schemaVersion', 'categories', 'usedTokens', 'capacityTokens'].includes(key)) state.ignored++;
    }
  }
  function parseText(text, state) {
    let summaryTable = false;
    let nonSummaryTable = false;
    for (let line of text.split(/\r?\n/)) {
      line = line.trim().replace(/\*\*/g, '').replace(/^[*•-]\s+/, '');
      if (!line) { summaryTable = false; continue; }
      if (/^```/.test(line)) continue;
      const explicitTotal = /^total\s*:/i.test(line);
      const numericTotal = /^[~≈]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?[km]?\s*\//i.test(line);
      const total = (explicitTotal || numericTotal) && line.match(/^(?:total\s*:\s*)?(.+?)\s*\/\s*(.+?)\s+tokens?(?:\s*\(\s*\d+(?:\.\d+)?%\s*\))?$/i);
      if (total) { addTotal(state, total[1], total[2]); continue; }
      if (explicitTotal) fail('Invalid reported total token count value.');
      if (/^[┌┐└┘├┤┬┴┼─┏┓┗┛┣┫━╭╮╰╯\s]+$/.test(line)) continue;
      if (line.includes('|') || line.includes('│') || line.includes('┃')) {
        const cells = line.replace(/[│┃]/g, '|').split('|').map(s => s.trim());
        if (cells[0] === '') cells.shift();
        if (cells[cells.length - 1] === '') cells.pop();
        if (cells.length < 2) { state.ignored++; continue; }
        if (/^category$/i.test(cells[0]) && /^tokens?$/i.test(cells[1])) {
          summaryTable = true; nonSummaryTable = false; continue;
        }
        if (cells.every(cell => /^:?-+:?$/.test(cell))) continue;
        if (!summaryTable) { nonSummaryTable = true; state.ignored++; continue; }
        // Any new nonnumeric header ends this summary, regardless of its
        // choice of column title (Token count, Context tokens, Size, etc.).
        if (!categoryId(cells[0])) {
          try { parseCount(cells[1]); }
          catch { summaryTable = false; nonSummaryTable = true; }
          state.ignored++;
          continue;
        }
        addCategory(state, cells[0], cells[1]);
        continue;
      }
      if (nonSummaryTable) { state.ignored++; continue; }
      summaryTable = false;
      const colon = line.indexOf(':');
      if (colon >= 0) {
        const label = line.slice(0, colon);
        if (categoryId(label)) addCategory(state, label, line.slice(colon + 1));
        else state.ignored++;
        continue;
      }
      // A category heading without a count starts a details section, not a row.
      if (categoryId(line)) { state.ignored++; continue; }
      // Read only a known label followed by whitespace and an entire count.
      let found = false;
      for (const [label] of [...ALIASES.entries()].sort((a, b) => b[0].length - a[0].length)) {
        if (line.toLowerCase().startsWith(label) && /^\s+/.test(line.slice(label.length))) {
          addCategory(state, label, line.slice(label.length)); found = true; break;
        }
      }
      if (!found) state.ignored++;
    }
  }
  function finishSnapshot(state) {
    const categories = DEFINITIONS.filter(([id]) => state.categories.has(id)).map(([id]) => state.categories.get(id));
    if (!categories.length) fail('No recognized category counts found. Paste a supported summary or JSON snapshot.');
    const warnings = [];
    const used = state.used ? state.used.tokens : null;
    const capacity = state.capacity ? state.capacity.tokens : null;
    const approximate = categories.some(r => r.approximate) || Boolean(state.used?.approximate || state.capacity?.approximate);
    if (approximate) warnings.push(W.rounded);
    if (state.ignored) warnings.push(W.unknown);
    const consumed = categories.filter(r => CONSUMED.has(r.id));
    const sum = consumed.reduce((n, r) => n + r.tokens, 0);
    const sumHalf = consumed.reduce((n, r) => n + r.roundingHalf, 0);
    if (used !== null && sum - used > sumHalf + state.used.roundingHalf + 1e-7) warnings.push(W.exceedsTotal);
    if (used !== null && capacity !== null && used > capacity) warnings.push(W.exceedsCapacity);
    if (capacity !== null && sum - capacity > sumHalf + state.capacity.roundingHalf + 1e-7) warnings.push(W.categoriesCapacity);
    if (used !== null && capacity !== null) {
      const free = state.categories.get('free_space');
      const buffer = state.categories.get('autocompact_buffer');
      if (free) {
        // Without a buffer row, only over-capacity is provably inconsistent.
        const aggregate = used + free.tokens + (buffer?.tokens || 0);
        const uncertainty = state.used.roundingHalf + state.capacity.roundingHalf + free.roundingHalf + (buffer?.roundingHalf || 0);
        if (aggregate - capacity > uncertainty + 1e-7 || (buffer && Math.abs(aggregate - capacity) > uncertainty + 1e-7)) warnings.push(W.reserves);
      }
    }
    return { schemaVersion: 1, categories, usedTokens: used, capacityTokens: capacity,
      warnings: unique(warnings), ignoredLines: state.ignored, approximate };
  }
  function parseSnapshot(text) {
    if (typeof text !== 'string') fail('Snapshot must be text.');
    if (text.length > 65536) fail('Snapshot exceeds the 64 KiB input limit.');
    // UTF-8 bound without relying on TextEncoder in every embedding environment.
    let bytes = 0;
    for (const char of text) { const point = char.codePointAt(0); bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4; }
    if (bytes > 65536) fail('Snapshot exceeds the 64 KiB input limit.');
    if (text.split('\n').length > 1000) fail('Snapshot exceeds the 1000-line limit.');
    const input = text.trim();
    if (!input) fail('Paste a snapshot before comparing.');
    const state = makeState();
    if (input.startsWith('{') || input.startsWith('[')) parseJSON(input, state);
    else parseText(input, state);
    return finishSnapshot(state);
  }
  function compareSnapshots(before, after, options = {}) {
    const mode = options.mode || 'setup';
    if (!['setup', 'all'].includes(mode)) fail('Unknown comparison mode.');
    if (!before || !after || !Array.isArray(before.categories) || !Array.isArray(after.categories)) fail('Use parsed snapshots for comparison.');
    const selected = mode === 'setup' ? SETUP : CONSUMED;
    const left = new Map(before.categories.map(r => [r.id, r]));
    const right = new Map(after.categories.map(r => [r.id, r]));
    const rows = [];
    let beforeSubtotal = 0, afterSubtotal = 0, uncertainty = 0, commonCount = 0;
    for (const [id, label] of DEFINITIONS) {
      if (!left.has(id) && !right.has(id)) continue;
      const a = left.get(id), b = right.get(id);
      const included = selected.has(id) && Boolean(a && b);
      rows.push({ id, label, before: a ? a.tokens : null, after: b ? b.tokens : null,
        delta: a && b ? b.tokens - a.tokens : null, included });
      if (included) {
        beforeSubtotal += a.tokens; afterSubtotal += b.tokens; commonCount++;
        uncertainty += a.roundingHalf + b.roundingHalf;
      }
    }
    if (!commonCount) fail('No shared reported categories in the selected mode.');
    const delta = afterSubtotal - beforeSubtotal;
    const warnings = [...before.warnings, ...after.warnings].filter(w => KNOWN_WARNINGS.has(w));
    const conditionsMatched = options.conditionsMatched === true;
    if (!conditionsMatched) warnings.push(W.matched);
    if (before.capacityTokens !== null && after.capacityTokens !== null && before.capacityTokens !== after.capacityTokens) warnings.push(W.capacity);
    if (commonCount < selected.size) warnings.push(W.missing);
    if (before.usedTokens === null || before.capacityTokens === null || after.usedTokens === null || after.capacityTokens === null) warnings.push(W.totalsMissing);
    if (uncertainty > 0 || before.approximate || after.approximate) warnings.push(W.range);
    return { mode, rows, beforeSubtotal, afterSubtotal, delta,
      deltaRange: { min: delta - uncertainty, max: delta + uncertainty },
      percentChange: beforeSubtotal === 0 ? null : delta / beforeSubtotal * 100,
      commonCount, warnings: unique(warnings), conditionsMatched };
  }
  function formatTokens(value) { return value === null ? 'Not reported' : value.toLocaleString('en-US'); }
  function makeExport(result, options = {}) {
    if (!result || !Array.isArray(result.rows)) fail('A valid comparison is required for export.');
    const rows = result.rows.filter(r => LABELS.has(r.id)).map(r => ({
      id: r.id, label: LABELS.get(r.id), before: r.before, after: r.after,
      delta: r.delta, included: r.included === true
    }));
    return { schemaVersion: 1, demo: options.demo === true, mode: result.mode === 'all' ? 'all' : 'setup', rows,
      beforeSubtotal: result.beforeSubtotal, afterSubtotal: result.afterSubtotal, delta: result.delta,
      deltaRange: { min: result.deltaRange.min, max: result.deltaRange.max },
      percentChange: result.percentChange, commonCount: result.commonCount,
      conditionsMatched: result.conditionsMatched === true,
      warnings: unique(result.warnings.filter(w => KNOWN_WARNINGS.has(w))), limitations: [...LIMITATIONS] };
  }
  function makeMarkdown(result, options = {}) {
    const output = makeExport(result, options);
    const delta = value => value === null ? 'Not reported' : (value > 0 ? '+' : '') + formatTokens(value);
    const lines = ['# Context Compare', '', output.demo ? '**Synthetic sample — not a real measurement.**' : '**User-supplied reported counts.**', '',
      `Mode: ${output.mode === 'setup' ? 'Setup categories' : 'All used categories'}. Only ${output.commonCount} shared reported categories contribute.`, '',
      `Before subtotal: ${formatTokens(output.beforeSubtotal)} reported tokens`,
      `After subtotal: ${formatTokens(output.afterSubtotal)} reported tokens`,
      `Reported change (after − before): ${delta(output.delta)} tokens`,
      `Display-rounding delta range: ${delta(output.deltaRange.min)} to ${delta(output.deltaRange.max)} tokens`, '',
      '| Category | Before | After | Reported delta | Included |', '|---|---:|---:|---:|---|'];
    for (const row of output.rows) lines.push(`| ${row.label} | ${formatTokens(row.before)} | ${formatTokens(row.after)} | ${delta(row.delta)} | ${row.included ? 'Yes' : 'No'} |`);
    lines.push('', '## Read before interpreting', '');
    for (const warning of [...output.warnings, ...output.limitations]) lines.push('- ' + warning);
    return lines.join('\n') + '\n';
  }
  return Object.freeze({ parseSnapshot, compareSnapshots, makeExport, makeMarkdown, formatTokens });
});
