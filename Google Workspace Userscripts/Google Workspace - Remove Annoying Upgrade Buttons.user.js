// ==UserScript==
// @name         Google Workspace - Remove Annoying Upgrade Buttons
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Permanently removes the intrusive "Upgrade" upsell blocks in Google Drive/Sheets, plus optional removal of the "Gemini" and "Meet" toolbar icons. Toggle each from the Tampermonkey menu.
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
    // Toggleable removal groups. Each group has a label, a stored-setting
    // key (with default), and the laser-targeted selectors it nukes.
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
            if (isEnabled(group)) list.push(...group.selectors);
        });
        return list;
    }

    function nukeElements() {
        activeSelectors().forEach(selector => {
            document.querySelectorAll(selector).forEach(element => element.remove());
        });
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
