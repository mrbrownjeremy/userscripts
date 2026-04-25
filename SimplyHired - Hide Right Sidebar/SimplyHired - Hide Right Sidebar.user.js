// ==UserScript==
// @name         SimplyHired – Hide Right Sidebar
// @namespace    https://github.com/mrbrownjeremy
// @version      1.0
// @description  Hides the right sidebar (Similar Jobs + Job Alert) on SimplyHired job pages, with a toggle button to show/hide
// @author       Jeremy Brown
// @match        https://www.simplyhired.com/*
// @icon         https://www.simplyhired.com/favicon.ico
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_KEY = 'sh_sidebar_hidden';

    // true = sidebar hidden (default)
    let sidebarHidden = GM_getValue(STORAGE_KEY, true);

    GM_addStyle(`
        #sh-sidebar-toggle {
            position: fixed;
            top: 100px;
            right: 12px;
            z-index: 9999;
            background: #1564bf;
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
        #sh-sidebar-toggle:hover {
            background: #1976d2;
        }
    `);

    function getSidebar() {
        // The sidebar wraps #similarJobsFeature and [data-testid="JobAlertSideComponent"].
        // Walk up from the heading to the column-level container (typically 2 levels up).
        const heading = document.getElementById('similarJobsFeature');
        if (!heading) return null;

        // Go up until we find a container that is a direct child of the page grid/layout
        // (i.e. a sibling of the main job-detail column). Stop after 6 hops.
        let el = heading.parentElement;
        for (let i = 0; i < 6 && el; i++) {
            const parent = el.parentElement;
            if (!parent) break;
            const style = window.getComputedStyle(parent);
            // The layout wrapper uses flex or grid — stop one level below it
            if (style.display === 'flex' || style.display === 'grid') {
                return el;
            }
            el = parent;
        }
        return heading.parentElement; // fallback
    }

    function applySidebarState() {
        const sidebar = getSidebar();
        if (!sidebar) return;

        if (sidebarHidden) {
            sidebar.style.setProperty('display', 'none', 'important');
            toggleBtn.textContent = 'Show R. Sidebar ▶';
        } else {
            sidebar.style.removeProperty('display');
            toggleBtn.textContent = 'Hide R. Sidebar ◀';
        }
    }

    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'sh-sidebar-toggle';
    toggleBtn.title = 'Toggle right sidebar';

    toggleBtn.addEventListener('click', () => {
        sidebarHidden = !sidebarHidden;
        GM_setValue(STORAGE_KEY, sidebarHidden);
        applySidebarState();
    });

    function init() {
        if (!document.getElementById('sh-sidebar-toggle')) {
            document.body.appendChild(toggleBtn);
        }
        applySidebarState();
    }

    // Wait for DOM, then watch for SPA navigation
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-apply after dynamic content renders (SPA route changes)
    let debounceTimer;
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(init, 300);
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
