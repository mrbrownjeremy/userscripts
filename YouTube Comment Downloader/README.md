# YouTube Comment Downloader

Downloads YouTube comments to CSV using a Tampermonkey UI button + macOS Shortcut + `youtube-comment-downloader` CLI.

## Architecture

```
YouTube page
  └── Tampermonkey button click
        └── ytcomments://download?url=<video_url>
              └── YTCommentDownloader.app (AppleScript, registered URL scheme)
                    └── ~/bin/download-yt-comments (shell wrapper)
                          └── youtube-comment-downloader CLI → ~/Downloads/yt_comments_*.csv
```

No persistent background process — the app fires on demand and exits.

**Why this approach:** In-page comment scraping via YouTube's internal API is not stable — the payload format (`commentViewModel` / entity map resolution) changes frequently and is undocumented. See `docs/learnings.md` for full history.

## Components

| Path | Role |
|---|---|
| `tampermonkey/youtube-comment-ui.user.js` | Injects Download Comments button (UI only) |
| `app/YTCommentDownloader.applescript` | AppleScript source — handles `ytcomments://` URL scheme |
| `scripts/install-app.sh` | Compiles and registers the app (run once) |
| `scripts/download-comments.sh` | Shell wrapper around `youtube-comment-downloader` |
| `docs/app-setup.md` | Full setup guide |
| `docs/learnings.md` | Prior attempt history and architecture decisions |

## Setup

```bash
# 1. Install the CLI
pip install youtube-comment-downloader

# 2. Build and register the URL scheme app, and install the shell wrapper (run once)
bash "/Users/jeremybrown/Scripts/Web Scripts/Userscripts/YouTube Comment Downloader/scripts/install-app.sh"
```

Then install `tampermonkey/youtube-comment-ui.user.js` as a Tampermonkey script.

See [`docs/app-setup.md`](docs/app-setup.md) for full details and troubleshooting.

## Output

CSV saved to `~/Downloads/` with columns:

| Column | Description |
|---|---|
| `author` | Comment author name |
| `text` | Comment text |
| `time` | Relative timestamp |
| `votes` | Like count |
| `cid` | Comment ID |
| `isReply` | `true` if reply |
| `parentCid` | Parent comment ID (if reply) |
