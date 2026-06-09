# Chrome Blocker Blocked Page Tab Guard

Status: Completed
Date: 2026-06-09

## Goal

Keep blocked-page unblock actions from assuming Chrome always returns a current
tab with a numeric tab id.

## Changes

- Added a guarded current-tab helper on the blocked page.
- Routed unblock countdown and popup message handling through the guarded
  current-tab lookup.
- Extended the source baseline to require the current-tab guard.
- Documented the blocked-page tab guard in the README, changelog, and vision.

## Verification

- `scripts/check-baseline.sh`
- `node scripts/test-url-rules.js`
- `make lint`
- `make test`
- `make build`
- `make check`
- `git diff --check`
