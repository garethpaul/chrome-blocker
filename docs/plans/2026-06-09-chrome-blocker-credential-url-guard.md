# Chrome Blocker Credential URL Guard

Status: Completed
Date: 2026-06-09

## Goal

Keep block rules unambiguous by rejecting URLs with embedded credentials before
they can be stored, matched, or decoded from blocked-page redirects.

## Changes

- Updated shared URL normalization to reject HTTP(S) URLs with usernames or
  passwords.
- Extended the URL-rule Node harness to cover credential-bearing direct inputs,
  block-list entries, request matching, and blocked-page query parameters.
- Extended the static baseline so the credential guard, README note, and
  completed plan remain checked by `make check`.
- Documented the credential URL guard in the README, changelog, and vision.

## Verification

- `scripts/check-baseline.sh`
- `node scripts/test-url-rules.js`
- `make check`
- `git diff --check`
