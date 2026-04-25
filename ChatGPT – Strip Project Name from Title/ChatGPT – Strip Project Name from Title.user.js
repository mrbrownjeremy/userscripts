// ==UserScript==
// @name         ChatGPT – Strip Project Name from Title
// @namespace    https://github.com/mrbrownjeremy
// @version      1.2
// @description  Removes the ChatGPT project name prefix from the page title on project pages
// @author       Jeremy
// @match        https://chatgpt.com/*
// @icon         https://chatgpt.com/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const PROJECT_URL_RE = /^\/g\/g-p-[^/]+(?:\/|$)/;

  function stripProjectPrefix() {
    if (!PROJECT_URL_RE.test(location.pathname)) return;

    const title = document.title;
    const sep = ' - ';
    const idx = title.indexOf(sep);
    if (idx === -1) return;

    document.title = title.slice(idx + sep.length);
  }

  function scheduleStrips() {
    stripProjectPrefix();
    setTimeout(stripProjectPrefix, 50);
    setTimeout(stripProjectPrefix, 200);
    setTimeout(stripProjectPrefix, 500);
    setTimeout(stripProjectPrefix, 1000);
  }

  // Initial run
  scheduleStrips();

  // Watch broad head changes, not just the current <title> node
  new MutationObserver(() => {
    stripProjectPrefix();
  }).observe(document.head, {
    subtree: true,
    childList: true,
    characterData: true,
  });

  // Hook SPA navigation
  const origPushState = history.pushState;
  history.pushState = function (...args) {
    const ret = origPushState.apply(this, args);
    scheduleStrips();
    return ret;
  };

  const origReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    const ret = origReplaceState.apply(this, args);
    scheduleStrips();
    return ret;
  };

  window.addEventListener('popstate', scheduleStrips);
  window.addEventListener('hashchange', scheduleStrips);
})();
