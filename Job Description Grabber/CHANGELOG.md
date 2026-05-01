# Changelog

## [3.13.1]
- LinkedIn: added SDUI-layout fallback for the new search-results detail panel (no `h1`, hashed class names); title extracted from `a[href*="/jobs/view/"]`, employer from `[aria-label^="Company,"]`, location from the metadata `<p>` with `·` separator and `<strong>` time indicator
- LinkedIn: excluded `document.title` from position fallback (search-page titles contain "N notifications | LinkedIn", not the job title)

## [3.13.0]
- Squarespace: added site-specific extraction block targeting `.job__location > div`, `.job__description`, salary h3 pattern, and `#LI-Remote`/`#LI-Hybrid` hashtags; added `sqContentObserver` to re-extract once React-loaded content arrives in the DOM (with 8s timeout fallback)
- Greenhouse: added `panelGuard` MutationObserver watching `<html>` direct children to immediately re-append the panel when Greenhouse's React evicts it, replacing the previous 300ms navObserver delay

## [3.2.0]
- Added Site Matching modal — view and edit which domains/URL patterns activate the script
- Settings panel redesigned with quick-input fields for domain and pattern rules
- Minor UI polish: smaller pill buttons, tighter padding

## [3.1.1]
- Bug fixes and minor extraction improvements

## [3.1.0]
- Replaced hardcoded `@match`/`@include` directives with user-editable domain and URL pattern lists (`DEFAULT_DOMAINS`, `DEFAULT_PATTERNS`)
- Added collapsible sections to the submission modal
- Added eightfold.ai to default domain list

## [3.0.0]
- Switched to universal `@match *://*/*` with runtime site-matching logic
- Improved ld+json parsing: rejects UUIDs and URL paths from job identifier fields
- Cleaner extraction fallback chain

## [2.9.5]
- Fixed Gusto extraction to not overwrite already-extracted employer/position values
- Extended employer name filter to reject "corp" and "inc" as generic values
- Removed overly broad `@include` path patterns that caused false activations

## [2.9.4]
- Expanded site support: BambooHR, Taleo, ADP, JazzHR, Breezy HR, Ashby, Rippling, Recruitee, Paycom, Paylocity, Oracle Cloud, Dayforce, Gusto, Comeet
- Added `@include` regex patterns for generic careers/jobs subdomains and URL paths
- Added scrollable modal body with sticky footer
- Interest slider styling improvements

## [1.9.1]
- Initial version: extract job data from page, copy to clipboard, save as TXT, or POST to Coda database
