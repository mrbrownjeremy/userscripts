# Amazon – UI Tweaks

A Tampermonkey userscript for [amazon.com](https://www.amazon.com) that collects small quality-of-life cleanups. Each tweak has its own on/off entry in the Tampermonkey menu.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) in Chrome/Vivaldi
2. Open the raw script file and Tampermonkey will intercept and prompt you to install

## Tweaks

### Disable Rufus / "Alexa for Shopping" sidebar *(on by default)*

Fully removes Amazon's Rufus AI shopping assistant:

- Removes the docked-left chat panel (`#nav-flyout-rufus`) and its chat-history overlay so it can't auto-open or reserve layout space
- Hides the Rufus/Alexa ingress buttons and slots via CSS
- A `MutationObserver` re-strips the panel because Amazon injects it late and re-injects it on SPA navigation

Toggle it from the Tampermonkey menu ("☑/☐ Disable Rufus / Alexa sidebar"). Turning it **off** reloads the page, since a panel that has already been removed can't be brought back without a fresh render.

### Hide Prime renewal nag banner *(on by default)*

Hides the "Your Prime membership ends on … / Continue Prime" auto-renew warning banner that Amazon shows on product pages. Keyed off the stable `data-csa-c-widget-id="prime-pcr-autorenew-risk-widget"` / `data-csa-c-painter="prime-risk-message-cx-cards"` attributes (the `CardInstance*` id is random per render). It's inline flow content, so hiding just collapses it — no layout gap. Toggle from the Tampermonkey menu ("☑/☐ Hide Prime renewal nag banner").

## Notes

Rufus hides behind a couple of stable ids (`#nav-flyout-rufus`, `#rufus-container-overlay`) plus `data-csa-c-*` slot/content ids and `aria-label` text ("Rufus", "Alexa"). If Amazon renames these after a deployment, update `PANEL_SELECTORS` and the CSS block near the top of the file. Match rules are scoped to `amazon.com`; add `@match` lines for other locales (e.g. `amazon.co.uk`) if needed.
