# Draft for a permitted Claude Code showcase/feedback post

Check the current rules, pinned threads, flair and account eligibility first. Do not publish this unchanged to multiple communities.

**Title:** I built a small browser tool to compare two Claude Code /context summaries—without treating the chart as savings

I'm the author of Context Compare, a free MIT browser utility.

There are already good usage dashboards, and Claude Code has native usage guidance. I wanted a smaller workflow: capture a category summary, change one setup choice, capture it again under the same conditions, and get a comparison I can keep or share.

It compares shared reported categories, keeps missing values missing, flags inconsistent totals and shows rounding cautions. It doesn't claim a lower displayed count means a lower bill, more plan quota or equal task quality. Upstream category-reporting issues are one reason I kept that distinction explicit.

You can try it without installing anything or providing an API key. Pasted summaries stay in the browser; there are no uploads, storage or model calls. Markdown/JSON/PNG exports contain aggregate counts and cautions, not the pasted text.

The on-page examples are synthetic. I'm looking for feedback on real summary formats that don't parse or results that are confusing—not asking for private session logs.

Live: https://gauravsinghbitmesra-design.github.io/context-compare/

Source/tests: https://github.com/gauravsinghbitmesra-design/context-compare

Does a quick before/after comparison fit your workflow, or is something essential missing?
