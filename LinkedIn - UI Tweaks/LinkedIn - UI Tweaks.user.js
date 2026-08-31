// ==UserScript==
// @name         LinkedIn - UI Tweaks
// @namespace    https://github.com/mrbrownjeremy
// @version      1.1.0
// @description  General LinkedIn cleanups: floating button to show/hide the right "Aside" sidebar, and removal of notification count/dot badges (nav + tab title). Toggle each from the Tampermonkey menu.
// @author       Jeremy Brown
// @match        https://www.linkedin.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linkedin.com
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
    let asideHidden = GM_getValue('asideHidden', true);    // right sidebar hidden?
    let hideBadges  = GM_getValue('hideBadges', true);     // strip notification badges?

    /* ------------------------------------------------------------------ *
     * Styles
     * ------------------------------------------------------------------ */
    GM_addStyle(`
        /* Hide the right "Aside" sidebar when toggled off.
           LinkedIn's class names are hashed, so we key off the stable
           aria-label instead. */
        body.li-hide-aside aside[aria-label="Aside"] {
            display: none !important;
        }

        /* Floating toggle button, docked at the top of the right sidebar
           column so it stays near the Aside it controls. */
        #li-aside-toggle {
            position: fixed;
            top: 70px;
            right: 20px;
            z-index: 99999;
            padding: 6px 12px;
            font: 600 13px/1.2 -apple-system, system-ui, sans-serif;
            color: #fff;
            background: #0a66c2;            /* LinkedIn blue */
            border: none;
            border-radius: 16px;
            cursor: pointer;
            box-shadow: 0 1px 4px rgba(0,0,0,.3);
            opacity: .85;
            transition: opacity .15s ease;
        }
        #li-aside-toggle:hover { opacity: 1; }
    `);

    /* ------------------------------------------------------------------ *
     * Aside (right sidebar) show / hide
     * ------------------------------------------------------------------ */
    function applyAsideState() {
        document.body.classList.toggle('li-hide-aside', asideHidden);
        const btn = document.getElementById('li-aside-toggle');
        if (btn) btn.textContent = asideHidden ? 'Show sidebar ▸' : '◂ Hide sidebar';
    }

    function addToggleButton() {
        if (document.getElementById('li-aside-toggle')) return;
        const btn = document.createElement('button');
        btn.id = 'li-aside-toggle';
        btn.title = 'Show / hide the right sidebar';
        btn.addEventListener('click', function () {
            asideHidden = !asideHidden;
            GM_setValue('asideHidden', asideHidden);
            applyAsideState();
        });
        document.body.appendChild(btn);
        applyAsideState();
    }

    /* ------------------------------------------------------------------ *
     * Notification badge removal
     *
     * The nav markup is:
     *   <a aria-label="Messaging, 3 new notifications">
     *     <span> <svg .../> <span>3</span> </span>   <- badge sits next to the icon
     *     <span><span>Messaging</span></span>        <- text label
     *   </a>
     * So a badge is reliably "the <span> immediately following an <svg>"
     * inside the top nav. This also catches the empty red dot on Home.
     * Text labels are never svg siblings, so they are left alone.
     * ------------------------------------------------------------------ */
    function getHeaderNav() {
        // The nav that contains the Notifications link is the global top nav.
        const link = document.querySelector('a[href*="/notifications"]');
        return (link && link.closest('nav')) || null;
    }

    function stripNavBadges() {
        const nav = getHeaderNav();
        if (!nav) return;
        nav.querySelectorAll('svg').forEach(function (svg) {
            const sib = svg.nextElementSibling;
            if (sib && sib.tagName === 'SPAN') {
                sib.style.setProperty('display', 'none', 'important');
            }
        });
    }

    function stripTitleBadge() {
        // e.g. "(3) LinkedIn | Feed" -> "LinkedIn | Feed"
        const cleaned = document.title.replace(/^\(\d+\+?\)\s*/, '');
        if (cleaned !== document.title) document.title = cleaned;
    }

    function runBadgeCleanup() {
        if (!hideBadges) return;
        stripNavBadges();
        stripTitleBadge();
    }

    /* ------------------------------------------------------------------ *
     * Re-apply on SPA navigation / re-renders (throttled)
     * ------------------------------------------------------------------ */
    let scheduled = false;
    function schedule() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(function () {
            scheduled = false;
            if (!document.getElementById('li-aside-toggle')) addToggleButton();
            runBadgeCleanup();
        });
    }

    const observer = new MutationObserver(schedule);

    function start() {
        addToggleButton();
        runBadgeCleanup();
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.body) {
        start();
    } else {
        document.addEventListener('DOMContentLoaded', start);
    }

    /* ------------------------------------------------------------------ *
     * Tampermonkey menu commands
     * ------------------------------------------------------------------ */
    GM_registerMenuCommand(
        (hideBadges ? '✓' : '✗') + ' Hide notification badges',
        function () {
            hideBadges = !hideBadges;
            GM_setValue('hideBadges', hideBadges);
            alert('Notification badges ' + (hideBadges ? 'HIDDEN' : 'SHOWN') +
                  '.\nReload the page to fully apply.');
        }
    );
})();
