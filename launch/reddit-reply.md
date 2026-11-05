# Draft answer to a baseline-context question

Research lead: https://www.reddit.com/r/ClaudeCode/comments/1xghkdy/max_20x_still_out_of_usage_in_2_days/

Read the latest thread/edits and current community rules before deciding whether a reply is still useful. The author already made workflow changes, so do not repeat outdated advice or lead with a tool pitch.

---

One distinction that helped me reason about this: `/context` is a snapshot of reported categories, while plan usage and billing are separate measurements. A smaller category count doesn't by itself tell you how much quota a change saves.

For the setup part, a fresh-session before/after check with the same model/version and one change at a time can at least show whether the reported baseline moved. Keep missing rows missing, and watch for rounded counts or source-accounting differences. Then test the task still works with the changed setup.

Disclosure: I built a small MIT browser page for that comparison, Context Compare. It doesn't upload summaries or estimate a bill. The example is synthetic: https://gauravsinghbitmesra-design.github.io/context-compare/

If tool links aren't welcome here, the matched-snapshot method works in a spreadsheet too.
