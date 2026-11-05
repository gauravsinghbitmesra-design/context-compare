# Interpreting a comparison

Delta means **after minus before**. A negative value means fewer reported tokens in shared selected categories. The percentage denominator is the before subtotal of those same categories. With a zero baseline, the percentage is unavailable rather than infinity.

Setup mode selects system prompt, system tools, MCP tools, custom agents, memory and skills. All-used mode also selects messages. Only categories present in both snapshots contribute; missing is never zero. Free space and compaction reserves can be shown but do not count as consumed context. A green negative delta is not a recommendation to remove a capability.

The display precision of `k`/`m` counts contributes uncertainty. `1.0k` has half-step 50, while `0.9k` also has half-step 50: their reported delta is -100 with a display-rounding interval reaching 0. That is not proof of an actual decrease. JSON/Markdown preserve the interval. The tool cannot bound source-accounting errors, independently tokenize a request or reconcile a plan invoice. Unquantified `~` / `≈` counts are rejected rather than assigned a falsely exact interval.

Warnings cover missing categories/totals, rounded counts, inconsistent sum/total/reserve relationships, changed capacities and unconfirmed conditions. An operator checking same conditions is a statement, not a verification performed by the app. Even matched samples can differ because of agent versions, caching, compaction, session history or other unobserved changes. Re-run the workflow after a setup change; lower context figures do not prove equal output quality.

The native tool is the source of the observation. [Anthropic's documentation](https://code.claude.com/docs/en/costs#reduce-mcp-server-overhead) describes `/context` and native usage guidance. [An upstream category-accounting report](https://github.com/anthropics/claude-code/issues/82333) illustrates why those displayed categories must not be treated as independent wire measurements. That report is user evidence about a specific version, not proof that every current version is affected.
