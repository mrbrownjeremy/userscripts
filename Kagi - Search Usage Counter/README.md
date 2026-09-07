# Kagi - Search Usage Counter

Displays your monthly Kagi searches used — e.g. **196/300** — as a pill in the
search page header, so you don't have to open billing to check where you stand.

Works on Kagi search result pages (`/search`, `/images`, `/videos`, `/news`,
`/podcasts`, `/maps`). Click the pill to jump to your billing page.

## Install

Open `Kagi Search Usage Counter.user.js` in Tampermonkey, or drag it onto the
Tampermonkey dashboard.

## How it works

The important part: **the search count is not on the search page at all.** Nothing
in the search-results DOM contains it, which is the usual dead end when trying to
scrape it directly. The number only exists in the server-rendered HTML of the
billing settings page:

```html
<div class="billing_box_count_box">
  <div class="billing_box_count_title">Searches</div>
  <div class="billing_box_count_num"><span>196</span>/300</div>
</div>
```

So the script:

1. Fetches the billing page in the background via `GM_xmlhttpRequest` (same-origin,
   using your existing Kagi session — no API key needed).
2. Parses out the `Searches` box, reading the used count and the plan limit.
3. Injects a small pill into the header's account bar (`.user-auth-bar`), falling
   back to `#accountContainer` if Kagi changes its markup.

The result is cached (via `GM_setValue`) for 10 minutes, so it isn't re-fetched on
every single search. The cached value renders instantly on page load, then a
background refresh updates it if stale. A `MutationObserver` re-injects the pill if
Kagi re-renders the header.

Because it reads two candidate billing URLs (`/settings/billing` and
`/settings?p=billing`), it keeps working if Kagi shifts that path.

## Config

Constants at the top of the script:

| Constant      | Default    | Effect                                             |
| ------------- | ---------- | -------------------------------------------------- |
| `SHOW_LIMIT`  | `true`     | Show `196/300`; set `false` for just `196`.        |
| `CACHE_TTL`   | 10 minutes | How long a cached count stays fresh.               |
| `BILLING_URLS`| two URLs   | Billing pages tried in order until one parses.     |

A Tampermonkey menu command, **Refresh Kagi usage now**, forces an immediate
re-fetch.

## Notes

The count reflects your current billing cycle and resets to zero each cycle
(Kagi's own note: "Restarts at zero each billing cycle"). If the billing page is
unreachable the pill shows `—` rather than a wrong number.
