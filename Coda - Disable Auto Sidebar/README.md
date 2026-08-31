# Coda – Disable Sidebar Auto-Expand

A Tampermonkey userscript for [coda.io](https://coda.io) that stops the left sidebar from auto-expanding when your cursor drifts near the left edge of the window. Use `Ctrl+\` to manually show or hide it instead.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) in Chrome/Vivaldi
2. Open the raw script file and Tampermonkey will intercept and prompt you to install

## Features

- Blocks the hover-expand trigger at the event level — sidebar stays hidden even when cursor is near the left edge
- MutationObserver backup catches any expand triggered outside of mouse movement
- `Ctrl+\` manually toggles the sidebar on/off
- Handles Coda's SPA navigation (re-initializes after page transitions)

## Notes

Coda's sidebar classes (`pgrvB5w8`, `gMhqkzn0`, `bPFIdxxX`) are minified and may change after a Coda deployment. If the script stops working, the class constants near the top of the file will need to be updated using the diagnostic snippet in the conversation that produced this script.
