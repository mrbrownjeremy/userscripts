# App Setup (Custom URL Scheme)

`YTCommentDownloader.app` is a minimal AppleScript application that registers the `ytcomments://` URL scheme. When the Tampermonkey button fires `ytcomments://download?url=<video_url>`, macOS routes it to this app, which runs the shell script.

No persistent background process — the app launches on demand, downloads, shows a notification, and exits.

## Install

### 1. Install `youtube-comment-downloader`

```bash
pip install youtube-comment-downloader
```

### 2. Build and register the app (also installs the shell wrapper)

```bash
bash "/Users/jeremybrown/Scripts/Web Scripts/Userscripts/YouTube Comment Downloader/scripts/install-app.sh"
```

It compiles `app/YTCommentDownloader.applescript` → `~/Applications/YTCommentDownloader.app`, injects the URL scheme into its `Info.plist`, registers it with Launch Services, and copies the shell script to `~/bin/download-yt-comments`.

Make sure `~/bin` is on your PATH. Add to `~/.zshrc` if needed:

```bash
export PATH="$HOME/bin:$PATH"
```

### 4. Install the Tampermonkey script

Paste `tampermonkey/youtube-comment-ui.user.js` into a new Tampermonkey script.

### 5. Test end-to-end

In Terminal:
```bash
open "ytcomments://download?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ"
```

You should see a macOS notification when done and a CSV in `~/Downloads`.

## First-time browser prompt

The first time the browser opens a `ytcomments://` link, macOS will show:

> "Allow this page to open YTCommentDownloader?"

Click **Allow** (or **Always Allow** if available). Chrome remembers per-scheme; you shouldn't be prompted again.

## Re-installing after script changes

Just re-run `bash scripts/install-app.sh` — it recompiles and re-registers.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "App not found" error | Run `install-app.sh` again; check `~/Applications/YTCommentDownloader.app` exists |
| `download-yt-comments: command not found` | Check `~/bin` is on PATH in `~/.zshrc`, then re-run `install-app.sh` (it uses a login shell) |
| `youtube-comment-downloader` not found | `pip install youtube-comment-downloader` |
| Browser opens URL scheme but nothing happens | Open `~/Applications/YTCommentDownloader.app` manually once to clear Gatekeeper quarantine |
| Gatekeeper blocks the app | `xattr -d com.apple.quarantine ~/Applications/YTCommentDownloader.app` |
