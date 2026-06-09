# Chrome Blocker Content Redirect Validation

## Status: Completed

## Goal

Validate content-script redirect message payloads before constructing extension
redirect URLs.

## Scope

- Preserve the existing popup-to-content-script redirect flow.
- Reuse the shared `normalizeBlockedOrigin` helper.
- Continue encoding the blocked origin in the `blockedSite.html` query string.
- Keep verification in the SDK-free source baseline.

## Out Of Scope

- Manifest V3 migration.
- Changing background `webRequest` interception behavior.
- Reworking popup UI or blocked-page countdown behavior.

## Verification

- `make check`
- `scripts/check-baseline.sh`
- `node scripts/test-url-rules.js`
- `git diff --check`
