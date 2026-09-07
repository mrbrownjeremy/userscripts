// ==UserScript==
// @name         Kagi Search Usage Counter
// @namespace    https://github.com/mrbrownjeremy/userscripts
// @version      1.0.0
// @description  Shows your monthly Kagi searches used (e.g. 196/300) right in the search page header. Pulls the number from your billing page and caches it.
// @author       Jeremy Brown
// @match        https://kagi.com/search*
// @match        https://kagi.com/images*
// @match        https://kagi.com/videos*
// @match        https://kagi.com/news*
// @match        https://kagi.com/podcasts*
// @match        https://kagi.com/maps*
// @icon         https://kagi.com/favicon-32x32.png
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @connect      kagi.com
// @run-at       document-idle
// @noframes
// ==/UserScript==

/*
 * Why this works when scraping the search page directly does not:
 * The "Searches used" number is NOT present anywhere in the search-results
 * DOM. It only lives in the server-rendered HTML of the billing settings
 * page, inside:
 *
 *   <div class="billing_box_count_box">
 *     <div class="billing_box_count_title">Searches</div>
 *     <div class="billing_box_count_num"><span>196</span>/300</div>
 *   </div>
 *
 * So this script fetches that page in the background (same-origin, using your
 * existing session), extracts the Searches count, and injects it into the
 * header. The result is cached so it isn't re-fetched on every search.
 */

(function () {
  'use strict';

  const CONFIG = {
    // Candidate billing URLs, tried in order until one parses successfully.
    BILLING_URLS: [
      'https://kagi.com/settings/billing',
      'https://kagi.com/settings?p=billing',
    ],
    // How long (ms) a cached count stays fresh before a background refresh.
    CACHE_TTL: 10 * 60 * 1000, // 10 minutes
    // Show the plan limit too (e.g. "196/300"). Set false for just "196".
    SHOW_LIMIT: true,
    CACHE_KEY: 'kagi_search_usage_cache_v1',
    PILL_ID: 'kagi-usage-pill',
  };

  // ---------------------------------------------------------------------------
  // Cache helpers
  // ---------------------------------------------------------------------------
  function readCache() {
    try {
      const raw = GM_getValue(CONFIG.CACHE_KEY, null);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeCache(data) {
    try {
      GM_setValue(CONFIG.CACHE_KEY, JSON.stringify({ ...data, ts: Date.now() }));
    } catch (e) {
      /* ignore */
    }
  }

  // ---------------------------------------------------------------------------
  // Networking + parsing
  // ---------------------------------------------------------------------------
  function httpGet(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        headers: { Accept: 'text/html' },
        onload: (res) =>
          res.status >= 200 && res.status < 300
            ? resolve(res.responseText)
            : reject(new Error('HTTP ' + res.status)),
        onerror: () => reject(new Error('network error')),
        ontimeout: () => reject(new Error('timeout')),
        timeout: 15000,
      });
    });
  }

  // Given billing-page HTML, pull out { used, limit } for the "Searches" box.
  function parseSearches(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const boxes = doc.querySelectorAll('.billing_box_count_box');
    for (const box of boxes) {
      const title = (box.querySelector('.billing_box_count_title')?.textContent || '')
        .trim()
        .toLowerCase();
      if (title !== 'searches') continue;

      const numBox = box.querySelector('.billing_box_count_num');
      if (!numBox) continue;

      // textContent is like "196/300" (with surrounding whitespace).
      const compact = numBox.textContent.replace(/\s+/g, '');
      const [used, limit] = compact.split('/');
      if (used && /^\d+$/.test(used)) {
        return { used, limit: limit && /^\d+$/.test(limit) ? limit : null };
      }
    }
    return null;
  }

  async function fetchUsage() {
    for (const url of CONFIG.BILLING_URLS) {
      try {
        const html = await httpGet(url);
        const parsed = parseSearches(html);
        if (parsed) return parsed;
      } catch (e) {
        /* try next candidate */
      }
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  function injectStyles() {
    if (document.getElementById('kagi-usage-style')) return;
    const style = document.createElement('style');
    style.id = 'kagi-usage-style';
    style.textContent = `
      #${CONFIG.PILL_ID} {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        margin-right: 8px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 600;
        line-height: 1;
        color: var(--graphite, currentColor);
        text-decoration: none;
        border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
        background: color-mix(in srgb, currentColor 6%, transparent);
        white-space: nowrap;
        transition: background 0.15s ease, border-color 0.15s ease;
      }
      #${CONFIG.PILL_ID}:hover {
        background: color-mix(in srgb, currentColor 12%, transparent);
        border-color: color-mix(in srgb, currentColor 35%, transparent);
      }
      #${CONFIG.PILL_ID} svg {
        width: 15px;
        height: 15px;
        flex: 0 0 auto;
      }
      #${CONFIG.PILL_ID}.kagi-usage-loading { opacity: 0.55; }
    `;
    document.head.appendChild(style);
  }

  function findHeaderSlot() {
    return (
      document.querySelector('.user-auth-bar') ||
      document.querySelector('#accountContainer .flex.align-center') ||
      document.querySelector('#accountContainer')
    );
  }

  function buildPill() {
    const a = document.createElement('a');
    a.id = CONFIG.PILL_ID;
    a.href = 'https://kagi.com/settings/billing';
    a.setAttribute('aria-label', 'Kagi searches used this billing cycle');
    a.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7"></circle>
        <path d="M21 21l-4.3-4.3"></path>
      </svg>
      <span class="kagi-usage-text">—</span>`;
    return a;
  }

  function render(data, { loading } = {}) {
    injectStyles();
    const slot = findHeaderSlot();
    if (!slot) return;

    let pill = document.getElementById(CONFIG.PILL_ID);
    if (!pill) {
      pill = buildPill();
      slot.insertBefore(pill, slot.firstChild);
    }

    const textEl = pill.querySelector('.kagi-usage-text');
    pill.classList.toggle('kagi-usage-loading', !!loading);

    if (data && data.used != null) {
      const showLimit = CONFIG.SHOW_LIMIT && data.limit;
      textEl.textContent = showLimit ? `${data.used}/${data.limit}` : data.used;
      const suffix = showLimit ? ` of ${data.limit}` : '';
      pill.title = `Kagi: ${data.used}${suffix} searches used this billing cycle. Click to open billing.`;
    } else if (!data) {
      textEl.textContent = '—';
      pill.title = 'Kagi usage unavailable — click to open billing.';
    }
  }

  // Keep the pill alive if Kagi re-renders its header.
  function watchHeader() {
    const observer = new MutationObserver(() => {
      if (!document.getElementById(CONFIG.PILL_ID) && findHeaderSlot()) {
        render(readCache(), { loading: false });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  async function refresh(force) {
    render(readCache(), { loading: true });
    const usage = await fetchUsage();
    if (usage) {
      writeCache(usage);
      render(usage, { loading: false });
    } else {
      // Keep whatever we had; drop the loading state.
      render(readCache(), { loading: false });
    }
  }

  function init() {
    const cached = readCache();
    render(cached, { loading: false });
    watchHeader();

    const isStale = !cached || Date.now() - (cached.ts || 0) > CONFIG.CACHE_TTL;
    if (isStale) refresh();

    if (typeof GM_registerMenuCommand === 'function') {
      GM_registerMenuCommand('Refresh Kagi usage now', () => refresh(true));
    }
  }

  init();
})();
