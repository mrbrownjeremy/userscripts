// ==UserScript==
// @name         Google Voice – Hide Right Sidebar
// @namespace    https://github.com/mrbrownjeremy
// @version      1.0
// @description  Hides the right-hand call panel (gv-call-sidebar) in Google Voice, with a toggle button to show/hide
// @author       Jeremy Brown
// @match        https://voice.google.com/*
// @icon         https://ssl.gstatic.com/images/branding/product/1x/voice_2020q4_48dp.png
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'gv_sidebar_hidden';
    const HIDE_CLASS = 'gv-hide-right-sidebar';

    // true = sidebar hidden (default)
    let sidebarHidden = GM_getValue(STORAGE_KEY, true);

    GM_addStyle(`
        body.${HIDE_CLASS} gv-call-sidebar {
            display: none !important;
        }
        #gv-sidebar-toggle {
            position: fixed;
            top: 72px;
            right: 12px;
            z-index: 99999;
            background: #1a73e8;
            color: #fff;
            border: none;
            border-radius: 4px;
            padding: 9px 13px;
            cursor: pointer;
            font-size: 13px;
            font-weight: bold;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            transition: background 0.2s;
            white-space: nowrap;
        }
        #gv-sidebar-toggle:hover {
            background: #1765cc;
        }
    `);

    function applySidebarState() {
        document.body.classList.toggle(HIDE_CLASS, sidebarHidden);
        toggleBtn.textContent = sidebarHidden ? 'Show R. Sidebar ▶' : 'Hide R. Sidebar ◀';
    }

    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'gv-sidebar-toggle';
    toggleBtn.title = 'Toggle right sidebar';

    toggleBtn.addEventListener('click', () => {
        sidebarHidden = !sidebarHidden;
        GM_setValue(STORAGE_KEY, sidebarHidden);
        applySidebarState();
    });

    function init() {
        if (!document.getElementById('gv-sidebar-toggle')) {
            document.body.appendChild(toggleBtn);
        }
        applySidebarState();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
