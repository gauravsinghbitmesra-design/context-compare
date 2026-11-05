# Supported summary formats

## Category lines

```text
Total: 125k / 200k tokens (62.5%)
System prompt: 12k tokens
System tools: 28k tokens
MCP tools: 23k tokens
Custom agents: 2k tokens
Memory files: 10k tokens
Skills: 10k tokens
Messages: 40k tokens
Free space: 70k tokens
Autocompact buffer: 5k tokens
```

These are synthetic example values. Recognized category names are case-insensitive. Known aliases include `CLAUDE.md`, `Memory`, `Agents`, `Built-in tools`, `Conversation` and `Auto-compact buffer`. Unknown names are excluded with a warning, never relabeled as free space or zero.

Counts accept nonnegative integers, comma groups, and displayed `k`/`m` units such as `12,000`, `12k` and `12.3k`. A trailing `tokens` and percentage annotation may be present. Negative, nonfinite, scientific-notation, fractional plain-token and counts over one billion are rejected. Duplicate category aliases are rejected rather than summed. Unquantified `~` / `≈` counts are rejected; the tool cannot bound that unspecified uncertainty.

The `Total: used / capacity tokens` line is optional. Missing totals remain unavailable. The app does not infer a complete context inventory by summing a partial list.

## Summary tables

```markdown
| Category | Tokens | Share |
|---|---:|---:|
| System prompt | 12k | 6% |
| System tools | 28k | 14% |
| MCP tools | 23k | 11.5% |
```

The equivalent Unicode box table is also supported. Headings must identify the category summary; per-tool and per-file tables are not a second copy of the top-level count. If your terminal rendering is unsupported, use the line format or normalized JSON rather than editing counts until the parser accepts them.

## Snapshot JSON

```json
{
  "schemaVersion": 1,
  "categories": {
    "system_prompt": 12000,
    "system_tools": 28000,
    "mcp_tools": 23000,
    "custom_agents": 2000,
    "memory": 10000,
    "skills": 10000,
    "messages": 40000,
    "free_space": 70000,
    "autocompact_buffer": 5000
  },
  "usedTokens": 125000,
  "capacityTokens": 200000
}
```

Numeric JSON counts are treated as integers you supplied. If the source count was rounded, use a string such as `"12k"` to preserve that uncertainty. JSON is a manually prepared snapshot, not a dump of an arbitrary provider's API response. An exported **comparison** JSON is a different schema from this snapshot input.

## What gets exported

Known category labels, numerical before/after counts, included/shared state, mode, reported delta/percentage, display-rounding range, operator-condition confirmation and fixed cautions. No pasted text, unknown labels, filenames, account names or raw parser error context is exported. The PNG shows the shared subtotals, reported delta and cautions rather than the full per-category table.
