# Reddit Sidebar Toggle

A userscript (Tampermonkey, Violentmonkey, etc.) that adds a floating toggle button to Reddit. Hide or show the sidebars, center the main content, and adjust text zoom — all persistent across sessions.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) in your browser
2. Open the [raw script URL](https://raw.githubusercontent.com/mrbrownjeremy/reddit-sidebar-toggle/main/Reddit%20Sidebar%20Toggle.user.js) — your userscript manager will intercept and prompt you to install

## Features

- Toggle left and right sidebars on/off with a single button
- Centers and constrains main content width (`min(75ch, 80vw)`) when sidebars are hidden
- Adjustable text zoom with +/− buttons (saved across sessions via GM_setValue)
- Works with Reddit's SPA navigation (MutationObserver re-injection)
- Only activates on `reddit.com`
