# Changelog

## [2.4]
- Retargeted centering from `.main-container` to `#main-content` for better Reddit DOM compatibility
- Cleaned up inline comments; added SPA navigation note on MutationObserver re-injection

## [2.3.3]
- Switched from responsive media query to direct flex centering on `.main-container`
- Set `max-width: min(75ch, 80vw)` on main content for readable line width when sidebars are hidden

## [2.3.2]
- Minor internal cleanup (no functional changes)

## [2.3.1]
- Wrapped centering styles in `@media (min-width: 640px)` to avoid layout issues on narrow viewports

## [2.3]
- Major refactor: reduced from ~556 to ~272 lines
- Added flex centering on `#main-content` when sidebars are toggled off

## [2.0]
- Initial version: sidebar toggle button, persistent hide/show state, centered content layout, adjustable text zoom (saved via GM_setValue)
