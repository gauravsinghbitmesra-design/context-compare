# Privacy

Pasted text stays in page memory. The app has no upload endpoint, model API, network-request code, telemetry, browser storage, cookies or service worker. A restrictive Content Security Policy includes `connect-src 'none'`. Normal hosting still serves page/assets and may receive standard request metadata. External links navigate only when you choose them.

The app reads only the text you paste. It does not locate or inspect your Claude/Codex installation, credentials, session files, account or browser clipboard automatically. Copy report writes to the clipboard after you press the button. Exports create local downloads.

The normalized engine recognizes a fixed set of category labels. Unknown text is counted as excluded rather than echoed into results or errors. DOM output uses textContent. Aggregate exports are allowlisted; they contain no raw pasted text. This is not a general secret scrubber: do not use it to sanitize arbitrary transcripts or assume all private information can be detected. Review exported counts before sharing. Browser extensions, your device and the hosting source remain trust considerations.

Use Clear inputs to drop the current inputs/result; reload also clears state. No recovery/history is retained by the app. Your browser or OS may have its own memory/clipboard behavior outside this tool's control. For local use, clone and open index.html or serve on localhost.
