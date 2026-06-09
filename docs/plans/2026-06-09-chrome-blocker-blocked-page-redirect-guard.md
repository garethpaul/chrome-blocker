# Chrome Blocker Blocked Page Redirect Guard

Status: Completed
Date: 2026-06-09

## Goal

Keep blocked-page redirects tied to the same guarded current-tab lookup used to
unlist a site.

## Changes

- Moved the post-countdown `window.location.href` assignment into the guarded
  current-tab unlist callback.
- Added a source baseline guard that rejects an unguarded blocked-page return
  redirect.
- Documented the redirect guard in the README, changelog, and vision.

## Verification

- `scripts/check-baseline.sh`
- `node scripts/test-url-rules.js`
- `make lint`
- `make test`
- `make build`
- `make check`
- `git diff --check`
