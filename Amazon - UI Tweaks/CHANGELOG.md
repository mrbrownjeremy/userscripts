# Changelog

## [1.1.0]
- Add tweak: hide the Prime membership-ending / auto-renew ("Continue Prime") nag banner on product pages. Keyed off the stable `data-csa-c-widget-id="prime-pcr-autorenew-risk-widget"` / `data-csa-c-painter="prime-risk-message-cx-cards"` attributes (the `CardInstance*` id is random per render). On by default, with its own Tampermonkey menu toggle.

## [1.0.1]
- Fix grey "hole" left behind where the docked panel was: reclaim the left offset Amazon applies to the page for the docked-left panel. CSS zeroes the known page wrappers (`body`, `#a-page`, `#a-page-wrapper`) and a JS pass clears any dock/rufus class or inline left margin/padding on `<html>`/`<body>`.

## [1.0.0]
- Initial release
- Disable Rufus / "Alexa for Shopping" sidebar (on by default):
  - Removes the docked panel (`#nav-flyout-rufus`) and chat-history overlay (`#rufus-container-overlay`) so it can't auto-open or reserve layout space
  - Hides Rufus/Alexa ingress buttons and slots via CSS (`data-csa-c-*` ids, `aria-label` text)
  - `MutationObserver` re-strips the panel after Amazon's late render and SPA navigation
- Tampermonkey menu toggle per tweak; disabling the tweak reloads to restore Rufus
