// ==UserScript==
// @name         Reddit Sidebar Toggle
// @namespace    http://tampermonkey.net/
// @version      3.6.0
// @description  Hide Reddit sidebars, center content, adjustable text size, download posts+comments as self-contained HTML, save to DEVONthink, sidebar peek overlay
// @author       You
// @match        https://www.reddit.com/*
// @icon         https://www.redditstatic.com/shreddit/assets/favicon/64x64.png
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    // Get saved default zoom or use 1.05 (105%)
    const defaultZoom = GM_getValue('defaultZoom', 1.05);

    // Get current zoom level (or use default)
    let zoomLevel = GM_getValue('textZoom', defaultZoom);

    // Comment image capture setting (toggled via script manager menu)
    let captureCommentImages = GM_getValue('captureCommentImages', false);
    GM_registerMenuCommand(
        (captureCommentImages ? '✓' : '✗') + ' Capture comment images',
        function() {
            captureCommentImages = !captureCommentImages;
            GM_setValue('captureCommentImages', captureCommentImages);
            alert('Comment image capture ' + (captureCommentImages ? 'ENABLED' : 'DISABLED') +
                  '.\nReload the page to apply.');
        }
    );

    // Function to apply zoom
    function applyZoom(zoom) {
        zoomLevel = zoom;
        GM_setValue('textZoom', zoom);
        document.documentElement.style.setProperty('--reddit-text-zoom', zoom);
    }

    // Add CSS to hide sidebar, style toggle button, and adjust layout
    GM_addStyle(`
        /* Set custom property for zoom */
        :root {
            --reddit-text-zoom: ${zoomLevel};
        }

        /* Hide sidebars by collapsing them while preserving layout */
        #right-sidebar-container {
            width: 0 !important;
            min-width: 0 !important;
            overflow: hidden !important;
            visibility: hidden !important;
        }

        #left-sidebar-container {
            width: 0 !important;
            min-width: 0 !important;
            overflow: hidden !important;
            visibility: hidden !important;
        }

        #flex-nav-buttons {
            display: none !important;
        }

        /* Convert grid to flex and center when sidebars are hidden */
        body:not(.sidebar-visible) .main-container {
            display: flex !important;
            justify-content: center !important;
        }

        /* Ensure main content sizes properly when centered */
        body:not(.sidebar-visible) .main-container main {
            max-width: min(75ch, 80vw) !important;
            width: 100% !important;
        }

        /* Center content when sidebars are hidden - feed pages */
        body:not(.sidebar-visible) shreddit-feed {
            max-width: 100% !important;
            margin-left: auto !important;
            margin-right: auto !important;
        }

        /* Center content when sidebars are hidden - post detail pages */
        body:not(.sidebar-visible) shreddit-post {
            max-width: 100% !important;
            margin-left: auto !important;
            margin-right: auto !important;
        }

        /* Show sidebars when toggled */
        body.sidebar-visible #right-sidebar-container {
            width: auto !important;
            visibility: visible !important;
        }

        body.sidebar-visible #left-sidebar-container {
            width: auto !important;
            visibility: visible !important;
        }

        body.sidebar-visible #flex-nav-buttons {
            display: flex !important;
        }

        /* Apply text zoom more aggressively to all content elements */
        .main-container > main *,
        .main-container > main {
            font-size: calc(1em * var(--reddit-text-zoom)) !important;
            line-height: calc(1.5 * var(--reddit-text-zoom)) !important;
        }

        /* Specifically target post title - VERY aggressive selectors */
        h1[slot="title"],
        h1[id^="post-title-"],
        shreddit-post h1,
        [slot="title"],
        .post-title,
        .main-container > main h1 {
            font-size: calc(1.75em * var(--reddit-text-zoom)) !important;
            font-weight: 600 !important;
        }

        /* Other headings */
        h2, h3 {
            font-size: calc(1.35em * var(--reddit-text-zoom)) !important;
        }

        /* Target comment text */
        shreddit-comment p,
        .md p,
        [slot="comment"] {
            font-size: calc(1em * var(--reddit-text-zoom)) !important;
        }

        /* Control panel container */
        #reddit-controls {
            position: fixed;
            top: 100px;
            right: 10px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        /* Toggle button styling */
        #sidebar-toggle {
            background: #FF4500;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 10px 15px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            transition: background 0.2s;
        }

        #sidebar-toggle:hover {
            background: #ff5722;
        }

        /* Copy button styling */
        #copy-markdown {
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 10px 15px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            transition: background 0.2s;
        }

        #copy-markdown:hover {
            background: #5a6268;
        }

        #copy-markdown:active {
            background: #545b62;
        }

        /* Save to DEVONthink button styling */
        #save-devonthink {
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 10px 15px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            transition: background 0.2s;
        }

        #save-devonthink:hover {
            background: #5a6268;
        }

        #save-devonthink:active {
            background: #545b62;
        }

        /* Zoom controls styling */
        #zoom-controls {
            background: #0079D3;
            color: white;
            border-radius: 4px;
            padding: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
        }

        .zoom-btn {
            background: rgba(255,255,255,0.2);
            color: white;
            border: none;
            border-radius: 3px;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }

        .zoom-btn:hover {
            background: rgba(255,255,255,0.3);
        }

        #zoom-display {
            min-width: 45px;
            text-align: center;
            font-weight: bold;
        }

        /* Make sure controls don't get zoomed */
        #reddit-controls,
        #reddit-controls * {
            font-size: initial !important;
            line-height: initial !important;
        }

        /* ── Sidebar peek overlay ───────────────────────────────────────────── */
        #sidebar-backdrop {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 99997;
        }
        body.sidebar-peek #sidebar-backdrop {
            display: block;
        }
        body.sidebar-peek #right-sidebar-container {
            position: fixed !important;
            right: 0 !important;
            top: 0 !important;
            height: 100vh !important;
            width: min(380px, 90vw) !important;
            min-width: 0 !important;
            visibility: visible !important;
            overflow-y: auto !important;
            z-index: 99998 !important;
            background: var(--color-neutral-background, #fff) !important;
            box-shadow: -4px 0 20px rgba(0,0,0,0.3) !important;
            padding: 1em !important;
        }
        body.sidebar-peek #right-sidebar-container aside {
            display: block !important;
        }

        /* Sidebar peek button */
        #sidebar-peek {
            background: #1c6fa3;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 10px 15px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            transition: background 0.2s;
        }
        #sidebar-peek:hover { background: #1a5f8e; }
        #sidebar-peek:active { background: #155077; }
    `);

    // Create control panel container
    const controlPanel = document.createElement('div');
    controlPanel.id = 'reddit-controls';

    // Create sidebar toggle button
    const toggleButton = document.createElement('button');
    toggleButton.id = 'sidebar-toggle';
    toggleButton.textContent = '◀ Sidebar';
    toggleButton.title = 'Toggle Sidebar';

    // Create download webarchive button
    const copyButton = document.createElement('button');
    copyButton.id = 'copy-markdown';
    copyButton.textContent = '💾 Download';
    copyButton.title = 'Download post and comments as self-contained HTML';

    // Create save to DEVONthink button
    const saveDTButton = document.createElement('button');
    saveDTButton.id = 'save-devonthink';
    saveDTButton.textContent = '📥 Save to DT';
    saveDTButton.title = 'Save to DEVONthink via Keyboard Maestro';

    // Create sidebar peek button
    const peekButton = document.createElement('button');
    peekButton.id = 'sidebar-peek';
    peekButton.textContent = 'ℹ️ Info';
    peekButton.title = 'Show community sidebar';

    // Backdrop for sidebar peek overlay
    const backdrop = document.createElement('div');
    backdrop.id = 'sidebar-backdrop';
    document.body.appendChild(backdrop);

    // Function to format zoom display as relative value
    function formatZoomDisplay(zoom) {
        const percent = Math.round(zoom * 100);
        const diff = percent - 100;

        if (diff === 0) {
            return '±0';
        } else if (diff > 0) {
            return '+' + diff;
        } else {
            return diff.toString();
        }
    }

    // Create zoom controls
    const zoomControls = document.createElement('div');
    zoomControls.id = 'zoom-controls';
    zoomControls.innerHTML = `
        <button class="zoom-btn" id="zoom-decrease" title="Decrease text size">−</button>
        <span id="zoom-display">${formatZoomDisplay(zoomLevel)}</span>
        <button class="zoom-btn" id="zoom-increase" title="Increase text size">+</button>
    `;

    // Add buttons to control panel
    controlPanel.appendChild(toggleButton);
    controlPanel.appendChild(zoomControls);
    controlPanel.appendChild(copyButton);
    controlPanel.appendChild(saveDTButton);
    controlPanel.appendChild(peekButton);

    // Toggle sidebar functionality
    toggleButton.addEventListener('click', function() {
        document.body.classList.toggle('sidebar-visible');
        if (document.body.classList.contains('sidebar-visible')) {
            toggleButton.textContent = '▶ Hide';
        } else {
            toggleButton.textContent = '◀ Sidebar';
        }
    });

    // Sidebar peek overlay
    function closeSidebarPeek() { document.body.classList.remove('sidebar-peek'); }
    peekButton.addEventListener('click', function() {
        document.body.classList.toggle('sidebar-peek');
    });
    backdrop.addEventListener('click', closeSidebarPeek);
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeSidebarPeek();
    });

    // Download as .webarchive functionality
    copyButton.addEventListener('click', async function() {
        const originalText = copyButton.textContent;
        try {
            copyButton.textContent = '⏳ Fetching…';
            let html = extractPageAsHTML();
            const images = await fetchPostImages();
            html = inlineImages(html, images);
            if (captureCommentImages) {
                const extra = (await Promise.allSettled(
                    collectExternalImageUrls(html).map(fetchImageData)
                )).filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
                html = inlineImages(html, extra);
            }
            const filename = makeFilename() + '.html';
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);

            copyButton.textContent = '✓ Saved!';
            setTimeout(() => { copyButton.textContent = originalText; }, 2000);
        } catch (err) {
            console.error('Failed to download:', err);
            copyButton.textContent = '✗ Failed';
            setTimeout(() => { copyButton.textContent = originalText; }, 2000);
        }
    });

    // Save to DEVONthink functionality
    saveDTButton.addEventListener('click', async function() {
        const originalText = saveDTButton.textContent;
        try {
            saveDTButton.textContent = '⏳ Fetching…';
            let html = extractPageAsHTML();
            const images = await fetchPostImages();
            html = inlineImages(html, images);
            if (captureCommentImages) {
                const extra = (await Promise.allSettled(
                    collectExternalImageUrls(html).map(fetchImageData)
                )).filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
                html = inlineImages(html, extra);
            }
            await navigator.clipboard.writeText(html);

            saveDTButton.textContent = '✓ Saving...';

            // Trigger Keyboard Maestro macro
            window.location.href = 'kmtrigger://macro=Save%20Reddit%20to%20DEVONthink';

            setTimeout(() => {
                saveDTButton.textContent = originalText;
            }, 2000);
        } catch (err) {
            console.error('Failed to save:', err);
            saveDTButton.textContent = '✗ Failed';
            setTimeout(() => {
                saveDTButton.textContent = originalText;
            }, 2000);
        }
    });

    // ── Download helpers ─────────────────────────────────────────────────────

    function makeDocTitle() {
        const subMatch = window.location.pathname.match(/^\/r\/(\w+)/i);
        const subreddit = subMatch ? subMatch[1] : '';

        const titleEl = document.querySelector('h1[slot="title"], h1[id^="post-title-"], shreddit-post h1');
        let postTitle = (titleEl ? titleEl.textContent : document.title
            .replace(/\s*[-|:]\s*Reddit\s*$/i, '')
            .replace(/\s*[-|:]\s*r\/\w+\s*$/i, ''))
            .trim();

        // Strip chars invalid in macOS filenames, then trailing punctuation
        postTitle = postTitle
            .replace(/[/\\:*?"<>|]/g, '')
            .replace(/[.!?,;:]+$/, '')
            .trim();

        // Middle-clip to 75 chars, breaking at word boundaries
        const MAX = 75;
        if (postTitle.length > MAX) {
            const budget = MAX - 1; // one char reserved for ellipsis
            const frontMax = Math.ceil(budget * 0.6);
            const backMax = budget - frontMax;
            let frontEnd = frontMax;
            while (frontEnd > 0 && postTitle[frontEnd] !== ' ') frontEnd--;
            if (frontEnd === 0) frontEnd = frontMax;
            let backStart = postTitle.length - backMax;
            while (backStart < postTitle.length && postTitle[backStart] !== ' ') backStart++;
            if (backStart >= postTitle.length) backStart = postTitle.length - backMax;
            postTitle = postTitle.slice(0, frontEnd).trimEnd()
                + '…'
                + postTitle.slice(backStart).trimStart();
        }

        return subreddit ? `${subreddit} - ${postTitle}` : (postTitle || 'Reddit Post');
    }

    function makeFilename() {
        return makeDocTitle();
    }

    // Collect any remaining external http image URLs from a generated HTML string
    // (used to pick up comment images after post images have already been inlined)
    function collectExternalImageUrls(html) {
        const urls = [];
        const seen = new Set();
        const regex = /src="(https?:[^"]+)"/g;
        let m;
        while ((m = regex.exec(html)) !== null) {
            const url = m[1].replace(/&amp;/g, '&');
            if (!seen.has(url)) { seen.add(url); urls.push(url); }
        }
        return urls;
    }

    function inlineImages(html, images) {
        for (const { url, data, type } of images) {
            const dataUri = `data:${type};base64,${data}`;
            // The browser HTML-escapes & in attribute values when serializing the DOM,
            // so try both the escaped and raw forms of the URL.
            html = html.split(`src="${url.replace(/&/g, '&amp;')}"`).join(`src="${dataUri}"`);
            html = html.split(`src="${url}"`).join(`src="${dataUri}"`);
        }
        return html;
    }

    async function fetchImageData(url) {
        try {
            const resp = await fetch(url, { credentials: 'omit' });
            if (!resp.ok) return null;
            const blob = await resp.blob();
            const b64 = await new Promise((res, rej) => {
                const reader = new FileReader();
                reader.onload = () => res(reader.result.split(',')[1]);
                reader.onerror = rej;
                reader.readAsDataURL(blob);
            });
            return { url, data: b64, type: blob.type || 'image/jpeg' };
        } catch {
            return null;
        }
    }

    // Returns [{src, alt}] for images attached to the OP post (not comments).
    // Handles post-type="image" (single) and post-type="gallery" (carousel).
    function getPostImages() {
        const postEl = document.querySelector('shreddit-post');
        if (!postEl) return [];
        const postType = postEl.getAttribute('post-type');
        const postAlt  = postEl.getAttribute('post-title') || '';
        const imgs = [];

        if (postType === 'image') {
            // content-href is the full-resolution source URL for image posts
            const href = postEl.getAttribute('content-href');
            if (href && /\.(jpe?g|png|gif|webp)(\?|$)/i.test(href)) {
                imgs.push({ src: href, alt: postAlt });
            } else {
                const img = postEl.querySelector('img#post-image');
                if (img && img.src) imgs.push({ src: img.src, alt: img.alt || postAlt });
            }
        } else if (postType === 'gallery') {
            // Each carousel slide has a blurry role="presentation" background and
            // a <figure> containing the real image — we only want the figure ones.
            postEl.querySelectorAll('gallery-carousel figure img').forEach(img => {
                if (img.src) imgs.push({ src: img.src, alt: img.alt || postAlt });
            });
        }

        return imgs;
    }

    async function fetchPostImages() {
        const results = await Promise.allSettled(
            getPostImages().map(({ src }) => fetchImageData(src))
        );
        return results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
    }

    // ── HTML capture ────────────────────────────────────────────────────────

    function escHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Return simplified HTML for a comment body element.
    // Keeps only semantic tags; strips all attributes except href on <a>.
    function extractBodyHTML(element) {
        if (!element) return '';
        const clone = element.cloneNode(true);
        clone.querySelectorAll('script, style, shreddit-comment').forEach(el => el.remove());

        const keep = new Set(['P','BR','STRONG','B','EM','I','A',
            'BLOCKQUOTE','CODE','PRE','UL','OL','LI','HR',
            'H1','H2','H3','H4','H5','H6','IMG','FIGURE','FIGCAPTION']);

        // Wrap bare images in anchor links so clicking opens the full image
        clone.querySelectorAll('img[src]').forEach(img => {
            if (img.closest('a')) return;
            const a = document.createElement('a');
            a.href = img.src;
            a.target = '_blank';
            a.rel = 'noopener';
            img.parentNode.insertBefore(a, img);
            a.appendChild(img);
        });

        // Process bottom-up so unwrapping a parent doesn't skip its children
        [...clone.querySelectorAll('*')].reverse().forEach(el => {
            if (!keep.has(el.tagName)) {
                while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
                el.parentNode?.removeChild(el);
            } else {
                const allowedAttrs = el.tagName === 'A'   ? ['href']
                                   : el.tagName === 'IMG' ? ['src', 'alt']
                                   : [];
                [...el.attributes].forEach(attr => {
                    if (!allowedAttrs.includes(attr.name)) el.removeAttribute(attr.name);
                });
            }
        });

        const inner = clone.innerHTML.trim();
        if (!inner) return '';
        // Bare text with no block wrappers — wrap in <p>
        if (!/<(p|blockquote|ul|ol|pre|h[1-6])\b/i.test(inner))
            return `<p>${inner}</p>`;
        return inner;
    }

    function getCommentAuthor(el) {
        let author = 'Unknown';
        if (el.hasAttribute('author')) author = el.getAttribute('author');
        if (author === 'Unknown' && el.shadowRoot) {
            const sa = el.shadowRoot.querySelector('[slot="authorName"], a[href^="/user/"]');
            if (sa) author = sa.textContent?.trim() || 'Unknown';
        }
        if (author === 'Unknown') {
            for (const sel of [
                'faceplate-tracker[source="comment"] + a',
                'a[slot="authorName"]', '[slot="authorName"]',
                'a[href^="/user/"]', '[author]',
                'shreddit-user-hover-card a', '.author', '[data-author]'
            ]) {
                const found = el.querySelector(sel);
                if (found) {
                    author = found.textContent?.trim()
                        || found.getAttribute('author')
                        || found.getAttribute('data-author')
                        || 'Unknown';
                    if (author !== 'Unknown') break;
                }
            }
        }
        return author !== 'Unknown' ? author.replace(/^u\//, '').trim() : '[deleted]';
    }

    function getCommentScore(el) {
        const a = el.getAttribute('score');
        if (a && a.trim() && a !== '•') {
            const n = parseInt(a.replace(/[,\s]/g, ''));
            if (!isNaN(n)) return String(n);
        }
        return '';
    }

    function getCommentDate(el) {
        function fmt(ts) {
            if (!ts) return '';
            const d = /^\d+$/.test(ts) ? new Date(parseInt(ts) * 1000) : new Date(ts);
            if (isNaN(d.getTime())) return '';
            return String(d.getFullYear()).slice(-2) + '_'
                + String(d.getMonth() + 1).padStart(2, '0')
                + String(d.getDate()).padStart(2, '0');
        }
        let date = fmt(el.getAttribute('created-timestamp'));
        if (!date) {
            const ta = el.querySelector('faceplate-timeago');
            if (ta) date = fmt(ta.getAttribute('ts') || ta.getAttribute('datetime'));
        }
        if (!date) {
            const timeEl = el.querySelector('time[datetime]');
            if (timeEl) date = fmt(timeEl.getAttribute('datetime'));
        }
        return date;
    }

    // Direct shreddit-comment children only (not grandchildren)
    function directCommentChildren(commentEl) {
        return [...commentEl.querySelectorAll('shreddit-comment')].filter(child => {
            let p = child.parentElement;
            while (p && p !== commentEl) {
                if (p.tagName === 'SHREDDIT-COMMENT') return false;
                p = p.parentElement;
            }
            return true;
        });
    }

    // Recursively build HTML for one comment and its replies
    function buildCommentHTML(commentEl) {
        const author = getCommentAuthor(commentEl);
        const score  = getCommentScore(commentEl);
        const date   = getCommentDate(commentEl);

        const bodyEl = commentEl.querySelector('[slot="comment"]')
            || commentEl.querySelector('div[slot="comment"]')
            || commentEl.querySelector('.md');
        const bodyHTML = extractBodyHTML(bodyEl);
        if (!bodyHTML) return '';

        let meta = `<strong>${escHtml(author)}</strong>`;
        if (score) meta += ` <code>${escHtml(score)}</code>`;
        if (date)  meta += ` <em>${escHtml(date)}</em>`;

        let html = `<p class="comment-meta">${meta}</p>\n<div class="comment-body">${bodyHTML}</div>\n`;

        const children = directCommentChildren(commentEl);
        if (children.length) {
            html += '<blockquote>\n';
            for (const child of children) html += buildCommentHTML(child);
            html += '</blockquote>\n';
        }
        return html;
    }

    // Build a complete standalone HTML document for the current Reddit post
    function extractPageAsHTML() {
        const titleEl = document.querySelector('h1[slot="title"], h1[id^="post-title-"], shreddit-post h1');
        const title = titleEl ? titleEl.textContent.trim() : 'Reddit Post';
        const docTitle = makeDocTitle();

        const css = [
            'body{font-family:system-ui,sans-serif;max-width:720px;margin:2em auto;',
                'line-height:1.6;color:#1a1a1a;padding:0 1em}',
            'h1{font-size:1.35em;margin-bottom:.2em}',
            '.post-meta{font-size:.85em;color:#666;margin-bottom:1.25em}',
            'blockquote{border-left:3px solid #ccc;margin:.6em 0;padding:.1em 1em}',
            '.comment-meta{margin:.75em 0 .15em}',
            '.comment-meta strong{font-size:1em}',
            '.comment-meta code{background:#f0f0f0;padding:0 4px;border-radius:3px;font-size:.82em}',
            '.comment-meta em{color:#999;font-style:normal;font-size:.9em}',
            'p{margin:.4em 0}',
            'hr{border:none;border-top:1px solid #e0e0e0;margin:1.25em 0}',
            '.post-images{margin:.75em 0}',
            '.post-images img{max-width:100%;height:auto;display:block;margin:.5em auto}',
            '.comment-body img{max-height:400px;width:auto;display:block;margin:.25em 0}',
        ].join('');

        let html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n`
            + `<meta charset="UTF-8">\n<title>${escHtml(docTitle)}</title>\n`
            + `<style>${css}</style>\n</head>\n<body>\n`
            + `<h1>${escHtml(title)}</h1>\n`;

        // Post metadata line
        const authorEl = document.querySelector('shreddit-post [slot="authorName"], shreddit-post a[href^="/user/"]');
        const subEl    = document.querySelector('shreddit-post [slot="subredditName"], shreddit-post a[href^="/r/"]');
        const postUrl  = window.location.href.split('?')[0];
        let metaParts  = [];
        if (authorEl) {
            let a = authorEl.textContent.trim().replace(/^u\//, '');
            metaParts.push(escHtml('u/' + a));
        }
        if (subEl) {
            let s = subEl.textContent.trim().replace(/^Go to\s+/i, '');
            if (!s.startsWith('r/')) s = 'r/' + s;
            metaParts.push(escHtml('in ' + s));
        }
        metaParts.push(`<a href="${postUrl}">View Post</a>`);
        html += `<p class="post-meta">${metaParts.join(' ')}</p>\n`;

        // Post images (image and gallery posts)
        const postImgs = getPostImages();
        if (postImgs.length) {
            html += '<div class="post-images">\n';
            for (const { src, alt } of postImgs) {
                html += `<p><a href="${escHtml(src)}" target="_blank" rel="noopener"><img src="${escHtml(src)}" alt="${escHtml(alt)}"></a></p>\n`;
            }
            html += '</div>\n';
        }

        // Post body
        const postBodyEl = document.querySelector('shreddit-post [slot="text-body"], div[slot="text-body"], .md');
        if (postBodyEl) {
            const b = extractBodyHTML(postBodyEl);
            if (b) html += b + '\n';
        }
        const linkEl = document.querySelector('shreddit-post a[slot="outbound-link"]');
        if (linkEl) html += `<p><a href="${linkEl.href}">Link</a></p>\n`;

        html += '<hr>\n<h2>Comments</h2>\n';

        // Top-level comments (no shreddit-comment ancestor)
        const topLevel = [...document.querySelectorAll('shreddit-comment')]
            .filter(el => !el.parentElement.closest('shreddit-comment'));
        for (const commentEl of topLevel) html += buildCommentHTML(commentEl);

        html += '</body>\n</html>';
        return html;
    }

    // Zoom functionality
    function updateZoomDisplay() {
        document.getElementById('zoom-display').textContent = formatZoomDisplay(zoomLevel);
    }

    // Add zoom button listeners
    zoomControls.addEventListener('click', function(e) {
        if (e.target.id === 'zoom-increase') {
            zoomLevel = Math.min(zoomLevel + 0.01, 2.0);
            applyZoom(zoomLevel);
            updateZoomDisplay();
        } else if (e.target.id === 'zoom-decrease') {
            zoomLevel = Math.max(zoomLevel - 0.01, 0.5);
            applyZoom(zoomLevel);
            updateZoomDisplay();
        }
    });

    // Add control panel to page when DOM is ready
    function addControls() {
        if (!document.getElementById('reddit-controls')) {
            document.body.appendChild(controlPanel);
            applyZoom(zoomLevel);
        }
    }

    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addControls);
    } else {
        addControls();
    }

    // Re-add controls after dynamic content loads
    const observer = new MutationObserver(addControls);
    observer.observe(document.body, { childList: true, subtree: true });

    // Register menu command for setting default zoom
    GM_registerMenuCommand('Set Default Zoom', function() {
        const currentDefault = GM_getValue('defaultZoom', 1.05);
        const currentPercent = Math.round(currentDefault * 100);

        const input = prompt(
            `Enter default zoom percentage (50-200):\n\nCurrent default: ${currentPercent}%\nCurrent zoom: ${Math.round(zoomLevel * 100)}%`,
            currentPercent
        );

        if (input !== null) {
            const percent = parseInt(input);

            if (isNaN(percent) || percent < 50 || percent > 200) {
                alert('Please enter a number between 50 and 200');
                return;
            }

            const newDefault = percent / 100;
            GM_setValue('defaultZoom', newDefault);
            alert(`Default zoom set to ${percent}%\n\nReload the page to apply the new default.`);
        }
    });
})();