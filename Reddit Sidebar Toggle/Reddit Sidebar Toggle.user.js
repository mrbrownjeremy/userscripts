// ==UserScript==
// @name         Reddit Sidebar Toggle
// @namespace    https://github.com/mrbrownjeremy
// @version      2.4
// @description  Hide Reddit sidebars with toggle button, center content, and adjustable text size
// @author       Jeremy Brown
// @match        https://www.reddit.com/*
// @icon         https://www.redditstatic.com/shreddit/assets/favicon/64x64.png
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

// Chat reference: https://claude.ai/share/86f7bd66-e7ed-4b1e-83aa-e7e4d6e02c5f

(function() {
    'use strict';

    // Get saved zoom level or default to 1.05 (105%)
    let zoomLevel = GM_getValue('textZoom', 1.05);

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

        /* Center the main content wrapper when sidebars are hidden */
        body:not(.sidebar-visible) #main-content {
            display: flex !important;
            justify-content: center !important;
        }

        /* Center content when sidebars are hidden - feed pages */
        body:not(.sidebar-visible) shreddit-feed {
            max-width: min(75ch, 80vw) !important;
            margin-left: auto !important;
            margin-right: auto !important;
        }

        /* Center content when sidebars are hidden - post detail pages */
        body:not(.sidebar-visible) shreddit-post {
            max-width: min(75ch, 80vw) !important;
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
    `);

    // Create control panel container
    const controlPanel = document.createElement('div');
    controlPanel.id = 'reddit-controls';

    // Create sidebar toggle button
    const toggleButton = document.createElement('button');
    toggleButton.id = 'sidebar-toggle';
    toggleButton.textContent = '◀ Sidebar';
    toggleButton.title = 'Toggle Sidebar';

    // Function to format zoom display as relative value
    function formatZoomDisplay(zoom) {
        const percent = Math.round(zoom * 100);
        const diff = percent - 100;
        
        if (diff === 0) {
            return '±0';
        } else if (diff > 0) {
            return '+' + diff;
        } else {
            return diff.toString(); // negative sign is already included
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

    // Toggle sidebar functionality
    toggleButton.addEventListener('click', function() {
        document.body.classList.toggle('sidebar-visible');
        if (document.body.classList.contains('sidebar-visible')) {
            toggleButton.textContent = '▶ Hide';
        } else {
            toggleButton.textContent = '◀ Sidebar';
        }
    });

    // Zoom functionality
    function updateZoomDisplay() {
        document.getElementById('zoom-display').textContent = formatZoomDisplay(zoomLevel);
    }

    // Add zoom button listeners (using event delegation)
    zoomControls.addEventListener('click', function(e) {
        if (e.target.id === 'zoom-increase') {
            zoomLevel = Math.min(zoomLevel + 0.01, 2.0); // Max 200%, increment by 1%
            applyZoom(zoomLevel);
            updateZoomDisplay();
        } else if (e.target.id === 'zoom-decrease') {
            zoomLevel = Math.max(zoomLevel - 0.01, 0.5); // Min 50%, decrement by 1%
            applyZoom(zoomLevel);
            updateZoomDisplay();
        }
    });

    // Add control panel to page when DOM is ready
    function addControls() {
        if (!document.getElementById('reddit-controls')) {
            document.body.appendChild(controlPanel);
            applyZoom(zoomLevel); // Apply saved zoom level
        }
    }

    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addControls);
    } else {
        addControls();
    }

    // Re-add controls after dynamic content loads (for SPA navigation)
    const observer = new MutationObserver(addControls);
    observer.observe(document.body, { childList: true, subtree: true });
})();