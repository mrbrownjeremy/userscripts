# ChatGPT – Strip Project Name from Title

A userscript that removes the ChatGPT project name prefix from the page title on project pages.

**Before:** `My Project - Chat Title`
**After:** `Chat Title`

## Installation

1. Install a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Click **[Install](https://raw.githubusercontent.com/mrbrownjeremy/chatgpt-strip-project-name-from-title/main/ChatGPT%20%E2%80%93%20Strip%20Project%20Name%20from%20Title.user.js)** to install the script directly from GitHub.

## How it works

On ChatGPT project pages (`/g/g-p-…`), the tab title is formatted as `{Project Name} - {Chat Title}`. This script strips the project name prefix so only the chat title is shown. It handles ChatGPT's single-page app navigation by hooking `pushState`, `replaceState`, `popstate`, and `hashchange`, and uses a MutationObserver on `document.head` to catch async title updates.

## License

MIT
