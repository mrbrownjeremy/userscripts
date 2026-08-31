// ==UserScript==
// @name         Coda – Disable Sidebar Auto-Expand
// @namespace    https://coda.io/
// @version      1.0
// @description  Prevents the left sidebar from auto-expanding on hover. Press Ctrl+\ to manually toggle.
// @author       mrbrownjeremy
// @match        https://coda.io/*
// @icon         data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PGRlZnM+PHN0eWxlPi5jbHMtMSwuY2xzLTIsLmNscy0ze3N0cm9rZS13aWR0aDozcHg7fS5jbHMtMSwuY2xzLTR7ZmlsbDojZmZmO30uY2xzLTEsLmNscy00LC5jbHMtM3tzdHJva2UtbWl0ZXJsaW1pdDoxMDt9LmNscy0xLC5jbHMtM3tzdHJva2U6IzAwMDt9LmNscy0ye3N0cm9rZTpyZWQ7fS5jbHMtMiwuY2xzLTV7ZmlsbDpub25lO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDt9LmNscy01e3N0cm9rZS13aWR0aDo3cHg7fS5jbHMtNSwuY2xzLTR7c3Ryb2tlOiNmZmY7fS5jbHMtNHtzdHJva2Utd2lkdGg6NnB4O30uY2xzLTN7ZmlsbDojOTk5O308L3N0eWxlPjwvZGVmcz48cGF0aCBjbGFzcz0iY2xzLTQiIGQ9Ik02MCwxNS41MmMwLTMuNi0yLjkyLTYuNTItNi41Mi02LjUySDExLjUyYy0zLjYsMC02LjUyLDIuOTItNi41Miw2LjUydjM0Ljk1YzAsMy42LDIuOTIsNi41Miw2LjUyLDYuNTJoNDEuOTVjMy42LDAsNi41Mi0yLjkyLDYuNTItNi41MlYxNS41MloiLz48cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik00LjUsMTUuMDJ2MzQuOTVjMCwzLjYsMi45Miw2LjUyLDYuNTIsNi41MmgyOC40OFY4LjVIMTEuMDJjLTMuNiwwLTYuNTIsMi45Mi02LjUyLDYuNTJaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNTMuMDQsOC41aC0xMy40OHY0OGgxMy40OGMzLjYsMCw2LjUyLTIuOTIsNi41Mi02LjUyVjE1LjAyYzAtMy42LTIuOTItNi41Mi02LjUyLTYuNTJaIi8+PHBhdGggY2xhc3M9ImNscy01IiBkPSJNMTQuNTIsMTUuMjJsMTUuNDcsMzIuNjhNMjkuOTksMTUuMjJsLTE1LjQ3LDMyLjY4Ii8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNMTQuNTIsMTUuMjJsMTUuNDcsMzIuNjhNMjkuOTksMTUuMjJsLTE1LjQ3LDMyLjY4Ii8+PC9zdmc+
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  // Classes observed via MutationObserver diagnostics (minified, but stable within a Coda build)
  const CLS_ROOT      = 'pgrvB5w8';  // always present on the sidebar root element
  const CLS_COLLAPSED = 'gMhqkzn0';  // sidebar is hidden
  const CLS_OPEN      = 'bPFIdxxX';  // sidebar is visible/expanded
  const CLS_ANIMATING = 'cohJNFfu';  // briefly added during the open transition

  // How close to the left edge (px) counts as "near the sidebar trigger zone"
  const TRIGGER_ZONE_PX = 20;

  let locked = true;   // true = block hover-expand
  let sidebarEl = null;
  let moObserver = null;

  // ── Layer 1: Block the mousemove trigger before Coda sees it ─────────────
  // Coda listens on `document`. We listen on `window` in the capturing phase,
  // which fires before any `document` listener. stopPropagation here means
  // Coda's handler never receives the event.
  window.addEventListener('mousemove', (e) => {
    if (locked && e.clientX < TRIGGER_ZONE_PX) {
      e.stopPropagation();
    }
  }, true);

  // ── Layer 2: MutationObserver backup ─────────────────────────────────────
  // Catches any expand triggered by something other than mousemove
  function setCollapsed(el) {
    el.classList.remove(CLS_OPEN, CLS_ANIMATING);
    if (!el.classList.contains(CLS_COLLAPSED)) el.classList.add(CLS_COLLAPSED);
  }

  function setExpanded(el) {
    el.classList.remove(CLS_COLLAPSED, CLS_ANIMATING);
    if (!el.classList.contains(CLS_OPEN)) el.classList.add(CLS_OPEN);
  }

  function attachObserver(el) {
    if (moObserver) moObserver.disconnect();
    moObserver = new MutationObserver(() => {
      if (!locked) return;
      if (el.classList.contains(CLS_OPEN) || el.classList.contains(CLS_ANIMATING)) {
        // Disconnect before mutating to avoid observing our own change
        moObserver.disconnect();
        setCollapsed(el);
        setTimeout(() => attachObserver(el), 100);
      }
    });
    moObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
  }

  // ── Toggle: Ctrl+\ ───────────────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === '\\') {
      e.preventDefault();
      sidebarEl = sidebarEl || document.querySelector(`.${CLS_ROOT}`);
      if (!sidebarEl) return;

      locked = !locked;
      if (locked) {
        setCollapsed(sidebarEl);
      } else {
        setExpanded(sidebarEl);
      }
    }
  }, true);

  // ── Init ─────────────────────────────────────────────────────────────────
  function init() {
    const el = document.querySelector(`.${CLS_ROOT}`);
    if (!el) return false;
    sidebarEl = el;
    if (el.classList.contains(CLS_OPEN)) setCollapsed(el);
    attachObserver(el);
    return true;
  }

  // Poll for the sidebar element — Coda is a React SPA and renders it async
  let attempts = 0;
  const poller = setInterval(() => {
    if (init() || ++attempts > 120) clearInterval(poller);
  }, 500);

  // Re-init after SPA navigations that remount the sidebar
  new MutationObserver(() => {
    if (!sidebarEl || !document.contains(sidebarEl)) {
      sidebarEl = null;
      init();
    }
  }).observe(document.body, { childList: true, subtree: false });

})();
