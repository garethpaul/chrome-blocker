# Chrome Blocker

<!-- README-OVERVIEW-IMAGE -->
![Project overview](docs/readme-overview.svg)

Chrome Blocker is a small Manifest V2 Chrome extension for blocking distracting
websites during focused work. It stores the block list in local Chrome storage
and redirects blocked HTTP(S) page loads to `blockedSite.html`.

## Install Locally

1. Open `chrome://extensions`.
2. Enable developer mode.
3. Choose `Load unpacked` and select this repository directory.

## Baseline

- Block rules are normalized to exact HTTP(S) origins such as
  `https://example.com`.
- User-entered block rules are not treated as regular expressions.
- Redirect query parameters are encoded, decoded, and validated before use.
- The extension keeps broad tab, storage, webRequest, and navigation
  permissions because Manifest V2 blocking redirects require them.
- Visited URLs and block-list entries must not be logged or sent to external
  services.

## Verify

Run both checks after changing extension behavior:

```sh
node scripts/test-url-rules.js
scripts/check-baseline.sh
```

Manual verification still requires Chrome:

1. Load the unpacked extension.
2. Visit an HTTP(S) site and choose `Blacklist site`.
3. Confirm another URL on the same origin redirects to the blocked page.
4. Confirm a lookalike origin such as `example.com.evil.test` is not blocked by
   an `example.com` rule.
5. Remove the site from the blocked page and confirm navigation returns to the
   unblocked origin.

## Modernization Notes

This repository intentionally keeps the original vendored Bootstrap and jQuery
assets for now. Future work should migrate to Manifest V3 with a maintained
blocking strategy, replace deprecated Chrome extension APIs, and add browser
automation coverage for popup, redirect, and unblock flows.
