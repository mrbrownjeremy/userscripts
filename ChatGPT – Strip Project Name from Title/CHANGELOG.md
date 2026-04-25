# Changelog

## [1.2] – 2026-04-22

### Changed
- Tightened `PROJECT_URL_RE` to avoid false matches on paths that merely start with `/g/g-p-`
- Replaced single MutationObserver on `<title>` with a broader observer on `document.head`
- Added `scheduleStrips()` with staggered timeouts (50 ms, 200 ms, 500 ms, 1 s) to catch delayed title updates

### Added
- Hook `history.pushState` and `history.replaceState` for SPA navigation
- Listeners for `popstate` and `hashchange` events

## [1.1] – 2026-04-22

### Added
- Initial release
- Strip project name prefix from title on ChatGPT project pages
- MutationObserver on `<title>` to handle dynamic title updates
