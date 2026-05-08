# Notes — Jobs: PGH Arts List-to-Table Formatter

## Tab title and favicon in Tampermonkey-generated pages

### Problem

When a Tampermonkey script generates a standalone HTML page and opens it in a new tab, the tab may show **"Blank Page"** instead of the page's `<title>`, and the favicon may not appear. This was observed in Vivaldi.

### What doesn't work

**`about:blank` + `document.write`** — even with `<title>` and `<link rel="icon">` correctly present in the generated HTML, Vivaldi does not reliably update tab metadata for a document written into an `about:blank` tab:

```js
const win = window.open('about:blank', '_blank');
win.document.write(html);
win.document.close();
```

Setting `win.document.title` and appending a `<link>` to `win.document.head` after `document.close()` also does not fix it.

**Blob URL without revocation** — opening a Blob URL works for rendering, but holding an unreleased object URL leaks memory for the tab's lifetime.

### What works

Generate a Blob URL from the HTML, open it, then schedule revocation:

```js
const blob = new Blob([html], { type: 'text/html' });
const url = URL.createObjectURL(blob);
const win = window.open(url, '_blank');

if (!win) {
  URL.revokeObjectURL(url);
  alert('Popup blocked. Allow popups for this site and try again.');
  return;
}

setTimeout(() => URL.revokeObjectURL(url), 60_000);
```

The `<title>` and `<link rel="icon">` must also be present in the generated HTML itself (not set programmatically after the fact).

### Why it works

The Blob URL gives the tab a real navigable URL (`blob:https://...`) rather than `about:blank`. The browser treats it as a normal page load and processes `<head>` metadata — title and favicon — correctly.

### Rule of thumb

For any Tampermonkey script that generates a standalone HTML page, use the Blob URL pattern above. Avoid `about:blank` + `document.write` whenever tab title or favicon matter.

---

*Diagnosed with Claude and ChatGPT; resolved with the Blob URL approach in v1.5.2.*
