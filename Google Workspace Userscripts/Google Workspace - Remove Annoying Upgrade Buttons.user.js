// ==UserScript==
// @name         Google Workspace - Remove Annoying Upgrade Buttons
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Permanently removes the intrusive "Upgrade" upsell blocks in Google Drive/Sheets, plus optional removal of the "Gemini" and "Meet" toolbar icons and toning down the loud "Share" button. Toggle each from the Tampermonkey menu.
// @author       Your Friendly AI & User
// @license      CC-BY-SA-4.0
// @match        https://drive.google.com/*
// @match        https://docs.google.com/*
// @match        https://mail.google.com/*
// @icon         https://www.google.com/images/branding/product/ico/googleg_lodp.ico
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @downloadURL https://update.greasyfork.org/scripts/585647/Google%20Workspace%20-%20Remove%20Annoying%20Upgrade%20Buttons.user.js
// @updateURL https://update.greasyfork.org/scripts/585647/Google%20Workspace%20-%20Remove%20Annoying%20Upgrade%20Buttons.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // ---------------------------------------------------------------------
    // Toggleable groups. Each group has a label, a stored-setting key (with
    // default), and an action: `selectors` to nuke matching elements, and/or
    // `css` to inject a stylesheet while the group is enabled.
    // ---------------------------------------------------------------------
    const GROUPS = {
        upgrade: {
            label: 'Remove "Upgrade" buttons',
            key: 'removeUpgrade',
            default: true,
            selectors: [
                // Google Sheets target (the entire container wrapper)
                '#workspace-onegoogle-pep-container',
                '.docsRecommendationsPepPersistentEntryPointContainer',
                '.appsElementsWorkspacePepGlobalRecommendationPepGlobalContainer',

                // Google Drive target (the specific controller button wrappers)
                '[jscontroller="YbzfXd"][data-rp-onramp-input]',
                '.pt0Pr',
                '.CRPU9d',

                // Aria-label fallbacks (in case Google changes structural classes)
                'button[aria-label="Upgrade"]',
                'a[aria-label="Upgrade"]'
            ]
        },
        gemini: {
            label: 'Remove "Gemini" icon',
            key: 'removeGemini',
            default: true,
            selectors: [
                // Sidekick / "Try Gemini" gen-AI promo entry point
                '#docs-sidekick-gen-ai-promo-button-container',
                '.appsElementsSidekickEntryPointRoot',
                '.appsElementsSidekickEntryPointButton',
                'button[aria-label*="Gemini"]',
                'a[aria-label*="Gemini"]'
            ]
        },
        meet: {
            label: 'Remove "Meet" icon',
            key: 'removeMeet',
            default: true,
            selectors: [
                // "Join a call here / present this tab" Meet-in-editors entry point
                '.docs-meet-in-editors-entrypoint-container',
                '#docs-meet-in-editors-entrypointbutton'
            ]
        },
        share: {
            label: 'Tone down "Share" button',
            key: 'toneDownShare',
            default: true,
            // Strip the loud blue action-pill styling so Share reads as a
            // plain toolbar button. Kept, not removed — it's still clickable.
            css: `
                #docs-titlebar-share-client-button,
                #docs-titlebar-share-client-button .scb-split-button,
                #docs-titlebar-share-client-button #scb-quick-actions-menu-button {
                    background: transparent !important;
                    background-color: transparent !important;
                    box-shadow: none !important;
                    border-color: transparent !important;
                }
                #docs-titlebar-share-client-button .scb-split-button {
                    color: #5f6368 !important;
                    font-weight: 400 !important;
                }
                #docs-titlebar-share-client-button .scb-button-icon {
                    opacity: 0.75 !important;
                }
                #docs-titlebar-share-client-button:hover .scb-split-button,
                #docs-titlebar-share-client-button:hover #scb-quick-actions-menu-button {
                    background: rgba(95, 99, 104, 0.12) !important;
                }
            `
        }
    };

    // Read current on/off state for a group from Tampermonkey storage.
    function isEnabled(group) {
        return GM_getValue(group.key, group.default);
    }

    // Build the list of selectors that are currently active.
    function activeSelectors() {
        const list = [];
        Object.values(GROUPS).forEach(group => {
            if (group.selectors && isEnabled(group)) list.push(...group.selectors);
        });
        return list;
    }

    function nukeElements() {
        activeSelectors().forEach(selector => {
            document.querySelectorAll(selector).forEach(element => element.remove());
        });
    }

    // Inject the CSS for every currently-enabled style group (once).
    function applyStyles() {
        const css = Object.values(GROUPS)
            .filter(group => group.css && isEnabled(group))
            .map(group => group.css)
            .join('\n');
        if (!css) return;

        const style = document.createElement('style');
        style.id = 'gw-remove-buttons-styles';
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
    }

    // ---------------------------------------------------------------------
    // Tampermonkey menu: one toggle per group. Toggling flips the stored
    // value and reloads so the change takes effect immediately (and so a
    // re-enabled element reappears without a manual refresh being required).
    // ---------------------------------------------------------------------
    function registerMenu() {
        Object.values(GROUPS).forEach(group => {
            const on = isEnabled(group);
            const prefix = on ? '☑ ' : '☐ '; // ☑ / ☐
            GM_registerMenuCommand(prefix + group.label, () => {
                GM_setValue(group.key, !on);
                location.reload();
            });
        });
    }

    registerMenu();
    applyStyles();

    // 1. Rapid-fire execution on initial page load to prevent layout flickering
    let attempts = 0;
    const initialBurst = setInterval(() => {
        nukeElements();
        attempts++;
        if (attempts >= 40) clearInterval(initialBurst);
    }, 100);

    // 2. Active observer to watch for dynamic Single Page Application (SPA) DOM additions
    const observer = new MutationObserver(nukeElements);
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    // 3. Fallback history state hooks for seamless web app navigation transitions
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    history.pushState = function() {
        const result = originalPushState.apply(this, arguments);
        setTimeout(nukeElements, 0);
        return result;
    };
    history.replaceState = function() {
        const result = originalReplaceState.apply(this, arguments);
        setTimeout(nukeElements, 0);
        return result;
    };
})();
