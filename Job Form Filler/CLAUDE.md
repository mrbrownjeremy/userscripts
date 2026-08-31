# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

(need to fill this out)

## Deployment

There is no build step. Files are installed directly into Tampermonkey via the browser extension. To update the script, edit the `.js` file and paste it into Tampermonkey (or use the file:// URL method if your browser supports it). Version is tracked only in the `@version` header — the filename does not change.

After every change: bump `@version`, commit to `main`, and push to GitHub. Changes must land on `main` so the user can access the updated file directly.

**IMPORTANT — no worktrees:** Never use worktree isolation (`isolation: "worktree"` in Agent calls). Always read and write files using their real absolute paths under `/Users/jeremybrown/Scripts/Web Scripts/Userscripts/Job Description Grabber/`, regardless of what directory the session started in.

## Architecture

The entire script is a single IIFE in one `.js` file following the userscript pattern. There are no modules, imports, or dependencies beyond the GM_* APIs provided by the userscript manager.

**Key sections (in order):**

- **Userscript header** — `@match`/`@include` directives control which sites activate the script; `@grant` declares GM API permissions; `@connect coda.io` allows cross-origin XHR
- **Constants** — `CODA_TOKEN`, `CODA_DOC_ID`, `CODA_TABLE_ID`, `CODA_API`, `COL` (column IDs), `CHANNEL_MAP`, dropdown option arrays

## Coda formula language

Do not write Coda formulas from assumption. Coda has its own formula language that differs from Excel, Google Sheets, and RE2 in non-obvious ways. Specific confirmed mistakes:

- **Concatenation is `+`, not `&`** (`&` is the Excel convention; Coda uses `+`)
- **Regex dialect is unverified** — do not assume RE2, PCRE, or any specific flavor. Inline flags like `(?is)` may not be supported. Before writing any non-trivial Coda regex, flag the uncertainty and direct the user to `coda.io/formulas` to confirm supported syntax.

When asked to write Coda formulas involving regex: write the logic, call out any operators or regex features that depend on dialect assumptions, and tell the user to verify those specific parts against Coda's docs before using.
