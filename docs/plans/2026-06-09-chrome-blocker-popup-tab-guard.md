# Chrome Blocker Popup Tab Guard

Status: Completed
Date: 2026-06-09

## Goal

Keep popup actions scoped to a valid active tab before reading background tab
state or sending content-script messages.

## Changes

- Added a small popup tab-id validator.
- Guarded active-tab callback execution behind the validator.
- Extended the source baseline and documentation to enforce the popup tab guard.

## Verification

- `scripts/check-baseline.sh`
- `node scripts/test-url-rules.js`
- `make check`
- `git diff --check`
