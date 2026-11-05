# Research and product choice — 2026-11-05

## Goal and evidence standard

Build something a developer can try immediately and share with a specific community. A repository existing, having topics or being indexed is not evidence that users saw or adopted it. The launch should test discovery and usefulness separately. Stars/forks are welcome outcomes, not guaranteed results.

This research found recurring discussion, not a verified live ranking of X trends. Search indexing was uneven. Older sources are labeled as background; community posts are anecdotal reports, not performance benchmarks.

## Demand and constraints

- **Recent demand:** [Max 20x, still out of usage in 2 days](https://www.reddit.com/r/ClaudeCode/comments/1xghkdy/max_20x_still_out_of_usage_in_2_days/) was posted October 27, 2026. The author described substantial baseline context and asks for workflow advice. This supports investigating the problem, not promising that this app will fix quota exhaustion.
- **Background demand:** [Removing a large Claude setup](https://www.reddit.com/r/ClaudeCode/comments/1rnxm5c/i_removed_63_of_my_claude_code_setup_and_it_got/) dates to March 2026. It illustrates recurring setup-complexity questions; its speedup is an author's claim, not this project's result.
- **Native capabilities:** [Official cost/context guidance](https://code.claude.com/docs/en/costs#reduce-mcp-server-overhead), checked November 5, 2026, already offers usage analysis and recommends `/context` for space inspection. A replacement generic dashboard would need a stronger advantage.
- **Measurement limitation:** [Upstream issue 82333](https://github.com/anthropics/claude-code/issues/82333), opened July 29, 2026, describes category-attribution discrepancies on a specific release. It informs our reported-count wording and consistency checks; the app does not validate request bodies.
- **X background:** [An indexed token-limit advice post](https://x.com/AIGuideHQ/status/2054006148349546535) demonstrates public discussion of the topic. Search returned older material; it does not establish current momentum, engagement or technical correctness of that post's advice.

## Alternatives considered

| Direction | Existing alternatives | Decision |
|---|---|---|
| General context/usage dashboard | [Context Viewer](https://github.com/auditt98/context-viewer), [Tokalator](https://tokalator.ai/), native usage analysis | Broad, crowded and often requires installation; a weak first choice for this launch |
| MCP configuration converter | [AgentAtlas converter](https://agentatlas.dev/tools/mcp-config-converter), [MCP.Directory converter](https://mcp.directory/tools/mcp-config-converter) | Browser-first converters already cover many clients; avoid another undifferentiated copy |
| Focused before/after comparison | Existing visualizers overlap, but do not erase the usefulness of a small portable check | Selected: no-install comparison, visible missing-data states, aggregate-only exports and cautious share cards |

This is an execution/positioning hypothesis, not proof of an unoccupied market. No competitor code was copied or re-licensed.

## Distribution decision

Publish a working live utility, example screenshot/video, transparent native-feature limits and ready-to-edit community posts. Treat the linked discussion as a research lead, not permission to advertise there. A relevant reply should help with a matched comparison first and disclose authorship. Do not hijack a competitor's launch or an old upstream bug report with an advertisement.

Public rule endpoints for the target communities were inaccessible during research. No permission-to-post claim is made. Inspect the current rules, pinned threads, flair and account eligibility in the actual posting session. See [launch plan](../launch/README.md).
