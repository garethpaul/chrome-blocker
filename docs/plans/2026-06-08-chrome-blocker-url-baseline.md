---
title: Chrome Blocker URL Baseline
type: fix
status: completed
date: 2026-06-08
---

# Chrome Blocker URL Baseline

## Summary

Harden the legacy Manifest V2 blocker by making block rules exact, normalized
HTTP(S) origins; removing user-controlled regular expression matching; encoding
blocked-site redirect parameters; and adding repeatable source and Node checks.

## Problem Frame

The extension stored root URLs from the active tab and matched them by building
a regular expression from stored data. That made block rules difficult to
reason about and allowed regex metacharacters in stored URLs to change matching
behavior. The blocked-site redirect also passed the blocked value as raw query
text and parsed it with manual string slicing. Because this repository has no
build system, the baseline needs lightweight checks that run without Chrome.

## Requirements

- R1. Block rules must normalize to exact HTTP(S) origins.
- R2. Matching must compare normalized origins and must not build regular
  expressions from block-list entries.
- R3. Redirect parameters must be encoded, decoded, and validated before display
  or navigation.
- R4. Tab blocking state must use the `webRequest` tab id instead of the
  selected tab.
- R5. Extension scripts must not log tab URLs or block-list state.
- R6. README, changelog, and verification scripts must document the baseline.

## Implementation Units

### U1. URL Rule Utilities

- **Goal:** Centralize origin normalization and matching.
- **Files:** `js/urlRules.js`, `scripts/test-url-rules.js`
- **Verification:** `node scripts/test-url-rules.js`

### U2. Request Blocking Flow

- **Goal:** Use exact-origin matching for main-frame HTTP(S) requests.
- **Files:** `js/background.js`, `manifest.json`
- **Verification:** `scripts/check-baseline.sh`

### U3. Popup And Blocked Page Safety

- **Goal:** Store normalized origins and make redirect query handling safe.
- **Files:** `js/popup.js`, `js/contentScript.js`, `js/blockedSite.js`,
  `popup.html`, `blockedSite.html`
- **Verification:** `scripts/check-baseline.sh`

## Risks & Dependencies

- Manifest V2 remains deprecated in modern Chrome; a Manifest V3 migration is a
  separate project.
- Browser behavior still needs manual Chrome verification because this
  repository has no extension automation harness.
- Exact-origin matching is intentionally narrower than substring matching and
  avoids silent over-blocking of lookalike or embedded URLs.

## Sources / Research

- `manifest.json` defines a Manifest V2 extension with blocking webRequest
  permissions.
- `js/background.js` owns request interception and tab state.
- `js/popup.js` owns adding or removing the current tab's origin.
- `js/blockedSite.js` owns unblock countdown and redirect-back behavior.
