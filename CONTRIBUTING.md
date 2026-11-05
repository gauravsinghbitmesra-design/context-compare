# Contributing

A small format fixture or clear bug report is valuable. Use synthetic category summaries without filenames, account data or secrets.

Node 22/24: npm ci, npm test. Browser: npx playwright install chromium, then npm run test:browser. For an installed local Chrome set BROWSER_EXECUTABLE to its executable path when running browser tests. Runtime needs none of these packages.

Core contracts live in docs/design.md. Add a failing regression before parser/math behavior changes. Preserve missing/null semantics, reserve exclusion, conservative units, duplicate rejection, rounded-count warnings and aggregate-only exports. A new alias must match category meaning, not just a similar word. Do not add price estimates, account integrations or telemetry as incidental improvements.

Browser tests exercise real flows and generate synthetic screenshots. Review assets before committing. Keep new instructions short and shared through AGENTS.md/CLAUDE.md. MIT contributions only; preserve notices for any explicitly introduced third-party code.
