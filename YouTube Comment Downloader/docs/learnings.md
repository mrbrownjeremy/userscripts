# Prior Attempts & Architecture Decisions

This document summarizes what was tried, what failed, and why the current architecture was chosen. Treat it as the source of truth before proposing changes.

---

## What Worked

- **UI injection** via Tampermonkey: replacing/augmenting the YouTube toolbar with custom buttons
- **SPA handling**: `MutationObserver` + `yt-navigate-finish` event reliably re-injects buttons after navigation
- **CSV generation**: Blob/`GM_download` export works correctly
- **Button styling**: YouTube overrides require `appearance: none`, explicit colors, `type="button"`

## What Failed: In-Page Comment Extraction

YouTube's comment data model changed:

| Old model | New model |
|---|---|
| `commentRenderer` contained full data | `commentViewModel` contains only reference keys |
| Single source | Data split: keys in `commentViewModel`, content in `frameworkUpdates.entityBatchUpdate.mutations[*].payload.commentEntityPayload` |

Three approaches were tried and failed:
1. `commentRenderer`-only parsing → partial, often empty
2. `commentViewModel` parsing → IDs only, no content
3. Entity map resolution (joining `commentEntityPayload` + `engagementToolbarStateEntityPayload` via `entityKey`) → still inconsistent

**Do not reattempt in-page parsing.** The API is undocumented, changes frequently, and requires constant re-engineering.

## Rejected Alternative: Local HTTP Server

A Python `localhost` server triggered by `fetch()` from Tampermonkey was rejected because:
- Requires a persistent always-running background process
- Overkill for infrequent use

## Chosen Architecture: Tampermonkey UI + macOS Shortcut + CLI

```
YouTube page
  └── Tampermonkey button (UI only)
        └── shortcuts:// URL scheme
              └── macOS Shortcut (on-demand, no background process)
                    └── youtube-comment-downloader CLI → CSV
```

Pros:
- No persistent process
- Stable CLI tool handles API quirks
- Clean separation: UI layer vs. data layer

## CSV Column Schema

| Column | Source |
|---|---|
| `author` | Comment author name |
| `text` | Comment body |
| `time` | Relative timestamp string |
| `votes` | Like count |
| `cid` | Comment ID |
| `isReply` | Boolean |
| `parentCid` | Parent comment ID (replies only) |
