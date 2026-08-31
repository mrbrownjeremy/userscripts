// ==UserScript==
// @name         Amazon - UI Tweaks
// @namespace    https://github.com/mrbrownjeremy
// @version      1.1.0
// @description  General Amazon cleanups: fully disables the Rufus / "Alexa for Shopping" AI sidebar, and hides the Prime membership-ending / auto-renew nag banner. Toggle each from the Tampermonkey menu.
// @author       Jeremy Brown
// @match        https://www.amazon.com/*
// @match        https://smile.amazon.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.com
// @license      MIT
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
    'use strict';

    /* ------------------------------------------------------------------ *
     * Persisted settings
     * ------------------------------------------------------------------ */
    let rufusDisabled = GM_getValue('rufusDisabled', true);   // kill the AI sidebar?
    let hidePrimeNag  = GM_getValue('hidePrimeNag', true);    // hide Prime renewal nag?

    /* ------------------------------------------------------------------ *
     * Styles
     * ------------------------------------------------------------------ *
     * Everything is gated behind a <html> class so the menu toggle can
     * flip the state live (no reload needed to *hide* Rufus again).
     * The panel itself is also physically removed in JS below — Amazon
     * injects it late and re-injects on SPA navigation, so CSS alone
     * isn't enough to stop it from popping open.
     * ------------------------------------------------------------------ */
    GM_addStyle(`
        html.amz-rufus-off #nav-flyout-rufus,
        html.amz-rufus-off #nav-rufus-flyout,
        html.amz-rufus-off #rufus-container,
        html.amz-rufus-off #rufus-container-overlay,
        html.amz-rufus-off .rufus-panel-container,
        html.amz-rufus-off [data-csa-c-slot-id*="rufus" i],
        html.amz-rufus-off [data-csa-c-content-id*="rufus" i],
        html.amz-rufus-off [aria-label*="Rufus" i],
        html.amz-rufus-off [aria-label*="Alexa" i] {
            display: none !important;
        }

        /* When Rufus docks left it pushes the page over by giving the body /
           top-level page wrappers a big left margin (or padding). Removing the
           panel doesn't undo that, so the reclaimed space shows as a grey hole.
           Force those offsets back to zero. */
        html.amz-rufus-off,
        html.amz-rufus-off body,
        html.amz-rufus-off #a-page,
        html.amz-rufus-off #a-page-wrapper {
            margin-left: 0 !important;
            padding-left: 0 !important;
        }

        /* Prime "your membership ends on … / Continue Prime" auto-renew nag
           banner on product pages. Keyed off the stable widget/painter data
           attributes (the CardInstance* id is random per render). It's inline
           flow content, so hiding just collapses it — no space to reclaim. */
        html.amz-primenag-off [data-csa-c-widget-id="prime-pcr-autorenew-risk-widget"],
        html.amz-primenag-off [data-csa-c-painter="prime-risk-message-cx-cards"] {
            display: none !important;
        }
    `);

    /* ------------------------------------------------------------------ *
     * Rufus removal
     * ------------------------------------------------------------------ */
    // Selectors for the docked panel / overlay. Removing the node (rather
    // than only hiding it) also reclaims any layout space Amazon reserves
    // for the docked-left panel and prevents it auto-opening.
    const PANEL_SELECTORS = [
        '#nav-flyout-rufus',
        '#nav-rufus-flyout',
        '#rufus-container-overlay',
    ];

    function stripRufus() {
        if (!rufusDisabled) return;
        for (const sel of PANEL_SELECTORS) {
            document.querySelectorAll(sel).forEach((el) => el.remove());
        }
        reclaimDockSpace();
    }

    // Amazon shifts the page right for the docked panel by applying a left
    // margin/padding to <html>/<body>/a page wrapper (often via a "docked"
    // class or an inline style using a CSS var). The CSS block above zeroes
    // the known wrappers; this clears anything applied inline or via a class
    // that CSS can't reach by name.
    function reclaimDockSpace() {
        const els = [document.documentElement, document.body];
        for (const el of els) {
            if (!el) continue;
            // Drop any dock/rufus-related class that could carry the offset.
            el.classList.forEach((c) => {
                if (/rufus|dock/i.test(c)) el.classList.remove(c);
            });
            // Clear inline left offsets Amazon may have set directly.
            if (el.style.marginLeft) el.style.marginLeft = '';
            if (el.style.paddingLeft) el.style.paddingLeft = '';
        }
    }

    function applyState() {
        const root = document.documentElement;
        root.classList.toggle('amz-rufus-off', rufusDisabled);
        root.classList.toggle('amz-primenag-off', hidePrimeNag);
        stripRufus();
    }

    /* ------------------------------------------------------------------ *
     * Tampermonkey menu toggle
     * ------------------------------------------------------------------ */
    function registerMenu() {
        GM_registerMenuCommand(
            (rufusDisabled ? '☑' : '☐') + ' Disable Rufus / Alexa sidebar',
            () => {
                rufusDisabled = !rufusDisabled;
                GM_setValue('rufusDisabled', rufusDisabled);
                applyState();
                // Re-enabling can't un-remove an already-stripped panel, so a
                // reload is needed to bring Rufus back.
                if (!rufusDisabled) location.reload();
            }
        );
        GM_registerMenuCommand(
            (hidePrimeNag ? '☑' : '☐') + ' Hide Prime renewal nag banner',
            () => {
                hidePrimeNag = !hidePrimeNag;
                GM_setValue('hidePrimeNag', hidePrimeNag);
                applyState();
            }
        );
    }

    /* ------------------------------------------------------------------ *
     * Boot + keep it applied through Amazon's late/SPA rendering
     * ------------------------------------------------------------------ */
    registerMenu();

    if (document.documentElement) applyState();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyState);
    } else {
        applyState();
    }

    let debounce;
    const observer = new MutationObserver(() => {
        clearTimeout(debounce);
        debounce = setTimeout(stripRufus, 200);
    });
    // documentElement is available immediately; body may not be yet.
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();
