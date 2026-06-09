# Chrome Blocker Background Storage Owner

Status: Completed
Date: 2026-06-09

## Goal

Keep block-list persistence owned by the background page instead of duplicating
storage writes from the popup click path.

## Changes

- Removed the popup's local `blockedSites.push` and `chrome.storage.local.set`
  after delegation to `addBlockedSite`.
- Kept the popup responsible for normalizing the active tab URL and redirecting
  the content script.
- Extended the source baseline to reject duplicate popup storage writes.
- Documented the persistence ownership contract in the README, changelog, and
  vision.

## Verification

- `scripts/check-baseline.sh`
- `node scripts/test-url-rules.js`
- `make check`
- `git diff --check`
