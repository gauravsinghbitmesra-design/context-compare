# Context Compare agent instructions

Read README.md and docs/design.md before changing the app. The user authorized development, GitHub publication and launch preparation; publishing to a person's X/Reddit account additionally needs the correct account, platform access and an actual posting request.

- No runtime dependencies, model calls, upload endpoints, telemetry, storage or automatic clipboard reads. External links are user navigation only.
- Inputs are explicit text summaries, not agent session files. Do not scan the laptop or authenticate to model providers.
- Keep known labels allowlisted. Missing is not 0; free/buffer are not consumed tokens. Delta=after-before. Zero baseline percentage=null.
- Report only source counts and display-rounding uncertainty, never confirmed savings, billing or performance claims.
- No raw unknown text in exports/errors. Use textContent for DOM data. Exports retain relevant cautions and an explicit demo marker.
- Input changes invalidate results and exports. Keep malformed/partial/empty/mobile paths usable.
- Before behavior changes add meaningful regression tests. Run npm test; for browser changes also npm run test:browser after installing the test browser.
- Real private inputs/reports and credentials never belong in commits. Public screenshots/video use synthetic scenarios only.
- Recheck current community rules before outreach. No mass messages, fake testimonials, vote/star trading, invented metrics or claims that a post was published when it is only a draft.
