// ==UserScript==
// @name         Superhuman → Coda Rebrand
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Replaces Superhuman branding with Coda on connect.superhuman.com
// @author       mrbrownjeremy
// @match        https://connect.superhuman.com/*
// @icon         data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDM4Ni4yIDM4Ni4yIiB4bWw6c3BhY2U9InByZXNlcnZlIj48c3R5bGU+LnN0MHtmaWxsOiNFRTVBMjl9PC9zdHlsZT48cGF0aCBjbGFzcz0ic3QwIiBkPSJNMjYyLjcsMTMwLjhjMTQuNSwwLDI4LjYsNS4zLDM5LjQsMTVjNi43LDUuNywxNy4xLDEsMTcuMS04LjNWNzkuNGMwLTExLjQtOS4zLTIxLjMtMjEuMy0yMS4zSDg3LjhjLTExLjksMC0yMS4zLDkuMy0yMS4zLDIxLjN2MjI3LjhjMCwxMS40LDkuMywyMC44LDIxLjMsMjAuOGgyMTAuNmMxMS40LDAsMjEuMy05LjMsMjEuMy0yMS4zdi01OC4xYzAtOC44LTEwLjQtMTQtMTcuMS04LjNjLTEwLjksOS4zLTI0LjQsMTUtMzkuNCwxNWMtMzQuMiwwLTYxLjctMjgtNjEuNy02Mi4zUzIyOSwxMzAuOCwyNjIuNywxMzAuOHoiLz48L3N2Zz4=
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const CODA_SVG_WORDMARK = '<svg version="1.0" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1104 386.2" xml:space="preserve"><style>.st0{fill:#101010}.st1{fill:#EE5A29}</style><path class="st0" d="M792.9,88.9h40.2c-0.1,66.5,0.1,133.1-0.1,199.6c-13.4,0-26.9,0-40.3,0.1c0.1-3.7,0.2-7.4,0.3-11.1c-9.2,7.2-19.9,12.8-31.6,14.6h-11.2c-17.9-1.6-35.2-10.3-45.6-25.1c-17.7-25.2-19.4-59.8-8.2-88c9.5-23.5,33.7-40.3,59.3-39.2c13.9-0.5,26.5,6.2,37.1,14.6C792.7,132.5,792.9,110.7,792.9,88.9M751.3,177.6c-24.2,11.1-27,46.5-12.3,66.4c12.5,17.6,43.5,16.5,53.2-3.2c1.3-16.6,1.3-33.2,0-49.7C785.5,176.1,765.4,171,751.3,177.6M423.4,168.1c21.9-30.3,67.9-37,99.1-17.7c-0.1,12.3-0.2,24.5,0.1,36.8c-10.2-7.3-21.9-13.4-34.8-12.7c-15.2-0.9-30,8.6-35.6,22.8c-7.9,19.4-2.5,46.4,17.8,55.8c17.5,8.2,37.5,1.9,52.4-8.8c-0.2,12.2-0.2,24.5-0.1,36.8c-10.2,5.2-20.9,9.6-32.3,10.8h-12.8c-17.5-1.4-35-8.1-47.3-21c-12.9-12.8-19.5-30.7-21.2-48.5v-12.7C410,195,414.4,180.2,423.4,168.1M565.2,152.1c20.6-14.4,48.9-16.1,71.8-6.2c19.3,8.4,33.5,26.4,38.3,46.7c6.3,26,2.2,56-15.9,76.6c-12,14.3-30.3,21.6-48.6,22.8h-9.4c-12.8-1.3-25.7-4.8-36.2-12.4C524.9,250.5,524.6,181,565.2,152.1M598.9,174.7c-13.4,3-21.2,16.8-22.9,29.5c-2.3,16-0.7,35,11.7,46.7c10.6,9.4,28.5,8.9,38.4-1.2c15.6-17.9,15.5-47.9,1.5-66.8C620.9,174.7,609,172.2,598.9,174.7M865.5,150.8c26.2-12.3,58.7-16.3,85.3-3.2c17.2,8.2,26.3,27.4,26.3,45.9c0.5,31.5,0,63.1,0.2,94.6c-13.1,0-26.2,0-39.3,0c0.1-1.7,0.3-5.2,0.4-6.9c-23.6,14.2-58,13.9-77.8-6.7c-17.1-17.5-14.8-49.7,4.9-64.5c20.6-16.5,50.4-16.1,73.2-4.6c-0.1-9.6-1.4-21-11.1-25.9c-19.8-9.8-43.8-4.2-62.2,6.3C865.6,174.1,865.5,162.5,865.5,150.8M898.1,228.7c-10.6,2.9-16.4,17.3-8.1,25.6c11.2,9.9,29.3,9.8,41.7,2c7.1-3.6,8-13.5,4.8-19.9C927.4,225.3,910.7,224.4,898.1,228.7z"/><path class="st1" d="M274.6,135.2c14.5,0,28.6,5.3,39.4,15c6.7,5.7,17.1,1,17.1-8.3V83.8c0-11.4-9.3-21.3-21.3-21.3H99.7c-11.9,0-21.3,9.3-21.3,21.3v227.8c0,11.4,9.3,20.8,21.3,20.8h210.6c11.4,0,21.3-9.3,21.3-21.3V253c0-8.8-10.4-14-17.1-8.3c-10.9,9.3-24.4,15-39.4,15c-34.2,0-61.7-28-61.7-62.3S240.9,135.2,274.6,135.2z"/></svg>';

    const CODA_LOGO_DATA_URI = 'data:image/svg+xml;base64,' + btoa(CODA_SVG_WORDMARK);

    // Inline data URI so there's no external request — Coda "C" mark SVG
    const CODA_FAVICON_URI = 'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDM4Ni4yIDM4Ni4yIiB4bWw6c3BhY2U9InByZXNlcnZlIj48c3R5bGU+LnN0MHtmaWxsOiNFRTVBMjl9PC9zdHlsZT48cGF0aCBjbGFzcz0ic3QwIiBkPSJNMjYyLjcsMTMwLjhjMTQuNSwwLDI4LjYsNS4zLDM5LjQsMTVjNi43LDUuNywxNy4xLDEsMTcuMS04LjNWNzkuNGMwLTExLjQtOS4zLTIxLjMtMjEuMy0yMS4zSDg3LjhjLTExLjksMC0yMS4zLDkuMy0yMS4zLDIxLjN2MjI3LjhjMCwxMS40LDkuMywyMC44LDIxLjMsMjAuOGgyMTAuNmMxMS40LDAsMjEuMy05LjMsMjEuMy0yMS4zdi01OC4xYzAtOC44LTEwLjQtMTQtMTcuMS04LjNjLTEwLjksOS4zLTI0LjQsMTUtMzkuNCwxNWMtMzQuMiwwLTYxLjctMjgtNjEuNy02Mi4zUzIyOSwxMzAuOCwyNjIuNywxMzAuOHoiLz48L3N2Zz4=';

    // ---- Intercept document.title setter (must run at document-start, before Ember) ----
    const titleDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'title');
    Object.defineProperty(document, 'title', {
        get() { return titleDesc.get.call(document); },
        set(val) {
            titleDesc.set.call(document, val.replace(/Superhuman/g, 'Coda'));
        },
        configurable: true
    });

    // ---- Wait for DOM before doing anything else ----
    function onDOMReady(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    onDOMReady(() => {

        // ---- CSS: hide footer + logo override (immune to Ember re-renders) ----
        // The CSS `content` property replaces the rendered image in Chromium-based browsers.
        // The JS fallback below covers Firefox.
        const logoStyle = document.createElement('style');
        logoStyle.textContent = `
            footer.site-footer { display: none !important; }
            img#site-logo, img.logo-big {
                content: url("${CODA_LOGO_DATA_URI}") !important;
                height: 36px !important;
                width: auto !important;
                max-height: 36px !important;
            }
        `;
        document.head.appendChild(logoStyle);

        // ---- Remove footer from DOM (JS fallback for any SPA-injected footer) ----
        function removeFooter() {
            document.querySelectorAll('footer.site-footer').forEach(el => el.remove());
        }

        // ---- Favicon ----
        function lockFavicon() {
            // Remove all existing favicon links
            document.querySelectorAll('link[rel*="icon"]').forEach(el => el.remove());

            const link = document.createElement('link');
            link.rel = 'icon';
            link.type = 'image/svg+xml';

            // Set the actual HTML attribute FIRST (browser reads this, not the IDL property)
            link.setAttribute('href', CODA_FAVICON_URI);

            // Now lock setAttribute so Discourse can't overwrite href going forward
            const origSetAttr = link.setAttribute.bind(link);
            link.setAttribute = (name, value) => {
                if (name === 'href') return;
                origSetAttr(name, value);
            };

            // Lock the IDL property too (covers link.href = ... assignments)
            Object.defineProperty(link, 'href', {
                get() { return CODA_FAVICON_URI; },
                set() { /* locked */ },
                configurable: false,
                enumerable: true,
            });

            document.head.appendChild(link);
            return link;
        }

        // ---- Logo src (JS fallback for Firefox) ----
        function replaceLogoSrc() {
            document.querySelectorAll('img#site-logo, img.logo-big').forEach(img => {
                if (!img.src.startsWith('data:')) {
                    img.src = CODA_LOGO_DATA_URI;
                    img.alt = 'Coda Community';
                }
            });
        }

        // ---- Text + attribute replacement ----
        function replaceInNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.textContent.includes('Superhuman')) {
                    node.textContent = node.textContent.replace(/Superhuman/g, 'Coda');
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tag = node.tagName;
                if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return;
                for (const attr of ['alt', 'title', 'aria-label', 'placeholder']) {
                    if (node.hasAttribute(attr)) {
                        const val = node.getAttribute(attr);
                        if (val.includes('Superhuman')) {
                            node.setAttribute(attr, val.replace(/Superhuman/g, 'Coda'));
                        }
                    }
                }
                node.childNodes.forEach(child => replaceInNode(child));
            }
        }

        // ---- Initial run ----
        const faviconLink = lockFavicon();
        replaceLogoSrc();
        removeFooter();
        replaceInNode(document.body);

        // ---- Watch <head> for Discourse adding competing favicon links ----
        // If a new link[rel*=icon] appears that isn't ours, kill it immediately.
        // Also re-lock if our link somehow gets removed from the DOM.
        new MutationObserver(mutations => {
            let ourLinkMissing = !document.head.contains(faviconLink);
            mutations.forEach(({ addedNodes }) => {
                addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE &&
                        node.tagName === 'LINK' &&
                        node.rel && node.rel.includes('icon') &&
                        node !== faviconLink) {
                        node.remove();
                    }
                });
            });
            if (ourLinkMissing) lockFavicon();
        }).observe(document.head, { childList: true, subtree: true });

        // ---- Watch <body> for SPA navigation ----
        new MutationObserver(mutations => {
            replaceLogoSrc();
            removeFooter();
            mutations.forEach(({ addedNodes }) => {
                addedNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
                        replaceInNode(node);
                    }
                });
            });
        }).observe(document.body, { childList: true, subtree: true });

    });

})();
