// ==UserScript==
// @name         Pexels - Hide Sponsored Photos
// @namespace    https://github.com/mrbrownjeremy
// @version      1.1.0
// @description  Hides "Sponsored Photos" ad blocks (iStock/Getty affiliate tiles) and the Canva ad that pops up after downloading a photo
// @author       Jeremy Brown
// @match        https://www.pexels.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pexels.com
// @license      MIT
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // Pexels obfuscates the "Sponsored Photos" label with zero-width characters
    // sprinkled between the letters, so the heading text has to be normalized
    // before it can be matched.
    const INVISIBLE_CHARS = /[\u00AD\u200B-\u200F\u2060\uFEFF]/g;
    const SPONSORED_TEXT = /sponsored/i;

    // Ad links all go through the Pexels redirector, whose base64 payload
    // always starts with "eyJ" ('{"'). This is the most reliable signal.
    const AD_LINK_SELECTOR = 'a[href*="/r/eyJ"]';

    // Grid cell wrapper; the ad occupies a whole cell in the photo grid.
    const ITEM_SELECTOR = '[data-testid="item"]';

    // The ad component itself (CSS-module prefix is stable across builds even
    // though the hash suffix is not).
    const AD_CONTAINER_SELECTOR = '[class*="Inline_container__"]';

    // The Canva promo that takes over the screen once a download finishes.
    const AFTER_DOWNLOAD_SELECTOR = '[class*="AfterDownloadAdContent_"]';

    // Its surrounding popup, and the button that closes that popup.
    const MODAL_SELECTOR = '[role="dialog"], [class*="Modal_"], [class*="modal_"]';
    const CLOSE_SELECTOR = '[aria-label*="close" i], button[class*="close" i]';

    // Fast path: kill the common case before first paint so nothing flashes.
    GM_addStyle(`
        ${ITEM_SELECTOR}:has(${AD_LINK_SELECTOR}),
        ${AD_CONTAINER_SELECTOR}:has(${AD_LINK_SELECTOR}),
        ${AFTER_DOWNLOAD_SELECTOR},
        a:has(${AFTER_DOWNLOAD_SELECTOR}),
        .pexels-sponsored-hidden {
            display: none !important;
        }
    `);

    let hiddenCount = 0;

    function isSponsoredHeading(el) {
        const heading = el.getAttribute('data-heading') || '';
        return SPONSORED_TEXT.test(heading.replace(INVISIBLE_CHARS, ''));
    }

    // Walk up to the outermost wrapper worth hiding: the grid cell if there is
    // one, otherwise the ad component's own container.
    function adRoot(el) {
        return el.closest(ITEM_SELECTOR) || el.closest(AD_CONTAINER_SELECTOR);
    }

    function hide(el) {
        const root = adRoot(el);
        if (!root || root.classList.contains('pexels-sponsored-hidden')) return;
        root.classList.add('pexels-sponsored-hidden');
        hiddenCount++;
    }

    // Hiding the ad's own markup is not enough here: it sits inside a modal
    // whose backdrop would keep the page locked. Prefer the site's own close
    // button so its state and scroll lock unwind normally, and only tear the
    // modal out by hand if no close button can be found.
    function dismissAfterDownloadAd(el) {
        const modal = el.closest(MODAL_SELECTOR);
        if (!modal || modal.dataset.pexelsAdDismissed) return;
        modal.dataset.pexelsAdDismissed = '1';
        hiddenCount++;

        // The promo video keeps playing behind display:none.
        modal.querySelectorAll('video').forEach((video) => video.pause());

        const close = modal.querySelector(CLOSE_SELECTOR);
        if (close) {
            close.click();
            return;
        }

        modal.classList.add('pexels-sponsored-hidden');
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
    }

    function sweep(scope) {
        if (!(scope instanceof Element) && scope !== document) return;

        // 1. Anything containing an affiliate redirect link.
        scope.querySelectorAll(AD_LINK_SELECTOR).forEach(hide);

        // 2. Blocks labelled "Sponsored ..." via the obfuscated data-heading.
        scope.querySelectorAll('[data-heading]').forEach((el) => {
            if (isSponsoredHeading(el)) hide(el);
        });

        // 3. Stock-agency imagery served straight into the grid.
        scope
            .querySelectorAll('img[src*="istockphoto.com"], img[src*="gettyimages.com"]')
            .forEach(hide);

        // 4. The post-download Canva popup.
        scope.querySelectorAll(AFTER_DOWNLOAD_SELECTOR).forEach(dismissAfterDownloadAd);
    }

    function run() {
        sweep(document);

        // Pexels loads results lazily as you scroll, so keep watching. Ads can
        // also be filled into cells that already exist, so re-sweep the whole
        // document rather than just the added nodes — throttled to one pass per
        // frame so infinite scroll stays smooth.
        let queued = false;
        new MutationObserver(() => {
            if (queued) return;
            queued = true;
            requestAnimationFrame(() => {
                queued = false;
                sweep(document);
            });
        }).observe(document.documentElement, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run, { once: true });
    } else {
        run();
    }

    // Handy for spot-checking that the script is doing its job.
    window.pexelsSponsoredHidden = () => hiddenCount;
})();
