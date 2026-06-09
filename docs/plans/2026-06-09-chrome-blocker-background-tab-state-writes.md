# Chrome Blocker Background Tab State Writes

Status: Completed
Date: 2026-06-09

## Goal

Keep every background path that writes per-tab blocking state behind the same
valid-tab-id guard.

## Changes

- Routed `addBlockedSite` through `setTabBlockingState` after normalizing the
  blocked origin.
- Routed `unlistSite` through `setTabBlockingState` when clearing the current
  tab's blocked state.
- Extended the source baseline to require centralized add/unblock state writes.
- Documented the per-tab write contract in the README, changelog, and vision.

## Verification

- `scripts/check-baseline.sh`
- `node scripts/test-url-rules.js`
- `make lint`
- `make test`
- `make build`
- `make check`
- `git diff --check`
