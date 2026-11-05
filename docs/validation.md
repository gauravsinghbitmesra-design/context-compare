# Validation

Local checks on 2026-11-05 cover supported summary/table/JSON parsing, reserved categories, duplicates, unknown text, unsafe numerics, shared-category comparisons, zero baselines, rounded uncertainty and aggregate-only exports.

Browser checks exercise the three synthetic scenarios, custom/malformed input, XSS-shaped unknown text, invalidation of stale exports, clipboard Markdown, JSON and PNG downloads, no new network requests after load, no browser storage, desktop/mobile widths and direct index.html use. Screenshots and the demo recording use synthetic data only.

CI runs the core suite on Node 22/24 across Linux/macOS/Windows and browser tests with Chromium on Linux. Consult the README badge for current results. Browser checks are not a proof that all browser extensions/hosts are safe. No real model session, quota, invoice or performance gain is validated by these tests.

Release validation: [all seven CI jobs passed](https://github.com/gauravsinghbitmesra-design/context-compare/actions/runs/42052364793) at commit `65bab308ca584ae2f05e5899d5cdd28b8010e88e`. This includes27 Node tests across Node22/24 on Linux/macOS/Windows plus the Chromium workflow suite. Public app, launch page and MP4 download returned HTTP200. No X/Reddit/HN post was sent.
