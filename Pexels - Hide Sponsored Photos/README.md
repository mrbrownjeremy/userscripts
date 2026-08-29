# Pexels - Hide Sponsored Photos

Hides the ads Pexels mixes into its pages:

- The "Sponsored Photos" blocks (iStock / Getty affiliate tiles) in search results
  and gallery grids.
- The full-screen Canva promo that pops up after you download a photo.

## Install

Open `Pexels - Hide Sponsored Photos.user.js` in Tampermonkey, or drag it onto the
Tampermonkey dashboard.

## How it works

### Sponsored grid tiles

Pexels deliberately makes these blocks hard to target:

- The "Sponsored Photos" label lives in a `data-heading` attribute with zero-width
  characters sprinkled between the letters, so a plain text match fails.
- Class names are hashed CSS-module names (`Inline_container__JiSd4`) whose suffix
  changes between builds.

So the script matches on three independent signals and hides the whole grid cell
(`[data-testid="item"]`) when any of them fire:

1. A link through the Pexels ad redirector — `pexels.com/r/eyJ…` (the base64 payload
   always begins `eyJ`).
2. A `data-heading` that reads "Sponsored" once zero-width characters are stripped.
3. An `<img>` served from `istockphoto.com` or `gettyimages.com`.

### Post-download Canva ad

Matched by the `AfterDownloadAdContent_` CSS-module prefix. Hiding the ad's own
markup is not enough — it sits inside a modal whose backdrop would keep the page
locked — so the script walks up to the modal and clicks the site's own close button,
which unwinds the scroll lock normally. If no close button turns up it hides the
modal directly and clears the inline `overflow` lock as a fallback. The promo video
is paused either way, since `display: none` alone does not stop playback.

A `:has()` CSS rule handles the common cases before first paint so nothing flashes,
and a throttled `MutationObserver` catches ads added by infinite scroll or by the
download flow.

Run `pexelsSponsoredHidden()` in the console to see how many blocks have been hidden.

## Notes

Grid tiles tested against a saved search-results page: 2 of 27 grid cells flagged,
25 untouched, no false positives. The post-download ad is matched from the markup
Pexels serves for it; the close-button and scroll-lock handling is defensive, since
the surrounding modal's structure was not captured.
