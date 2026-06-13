---
title: Chrome Blocker Startup Hydration Gate
type: reliability
status: planned
date: 2026-06-13
---

# Chrome Blocker Startup Hydration Gate

## Status: Planned

## Problem Frame

The background page registers its blocking request listener immediately, but
loads the persisted block list asynchronously. A valid main-frame navigation can
therefore pass through while `blockedSites` still contains its empty startup
value, including navigation to an origin that storage will identify as blocked
milliseconds later.

## Assumptions

- Blocking enforcement is more important than allowing a navigation during the
  brief background-page hydration interval.
- Chrome retries remain a user action after a startup-window cancellation; this
  change does not introduce an internal retry page or retain requested URLs.
- A storage read error must not be interpreted as a successfully loaded empty
  block list.
- Successful reading and normalization control readiness; rewriting the
  normalized list remains best-effort housekeeping and does not delay use of the
  valid in-memory list.

## Scope Boundaries

- Preserve normalized origin matching, block-list storage ownership, tab-state
  lifecycle, blocked-page redirects, popup behavior, permissions, and Manifest
  V2 architecture.
- Ignore invalid-tab and non-main-frame requests exactly as before.
- Do not log, persist, or expose canceled startup-window URLs.
- Do not combine this reliability guard with the larger Manifest V3 migration.

## Requirements

- R1. Background startup must begin with block-list hydration marked incomplete.
- R2. A valid HTTP(S) main-frame request received before successful hydration
  must return Chrome's blocking cancellation response.
- R3. Invalid-tab, malformed, and non-main-frame requests must remain ignored
  even while hydration is incomplete.
- R4. Successful storage loading must normalize the block list and schedule its
  normalized persistence before marking hydration complete.
- R5. A storage read error must leave hydration incomplete and enforcement
  fail-closed.
- R6. After successful hydration, existing blocked redirects, allowed requests,
  and tab-state updates must remain unchanged.
- R7. Executable VM tests and static contracts must reject premature readiness,
  fail-open startup requests, ignored storage errors, and missing test evidence.

## Implementation Units

### U1. Track Successful Block-List Hydration

- **Files:** `js/background.js`
- Add explicit readiness state around the existing `chrome.storage.local.get`
  callback.
- Treat `chrome.runtime.lastError` as an unsuccessful hydration and leave the
  readiness state closed.
- Normalize and schedule the loaded-list rewrite before publishing readiness;
  read success, not rewrite completion, determines whether enforcement can use
  the in-memory list.

### U2. Fail Closed During The Startup Window

- **Files:** `js/background.js`
- Keep existing request-shape validation first so unrelated request classes are
  unaffected.
- Cancel only valid main-frame requests while readiness is incomplete.
- Resume the existing origin lookup, tab-state update, and redirect behavior once
  readiness is complete.

### U3. Exercise Deferred And Failed Hydration

- **Files:** `scripts/test-background.js`, `scripts/check-baseline.sh`, `Makefile`
- Defer the storage callback in the VM so request behavior is observed before and
  after hydration instead of hiding the startup interval behind a synchronous
  fake.
- Cover invalid requests during startup, fail-closed valid navigation, successful
  hydration, blocked redirect, allowed navigation, and storage-error behavior.
- Add mutation-sensitive source and fixture contracts to repository gates.

### U4. Document The Enforcement Boundary

- **Files:** `README.md`, `SECURITY.md`, `VISION.md`, `CHANGES.md`, this plan
- Document the startup cancellation tradeoff and the absence of URL logging or
  persistence.
- Record only verification actually completed on this host.

## Verification

- `node scripts/test-background.js`
- `make test`
- `make check`
- `make verify`
- Run `make check` from outside the repository.
- `node --check` for modified JavaScript.
- `sh -n scripts/check-baseline.sh`
- `git diff --check`
- Isolated hostile mutations for initial readiness, startup cancellation,
  readiness ordering, storage-error handling, deferred callback coverage, stale
  plan status, and missing verification evidence must each fail.
- Interactive unpacked-extension behavior is optional and must remain unclaimed
  when no extension-capable browser harness is installed.

## Risks

- A storage read error intentionally cancels valid main-frame requests for the
  lifetime of that background-page instance. Restarting the extension retries
  hydration; silently opening enforcement would recreate the bypass this plan
  closes.
- Users who navigate during the short successful-hydration interval may need to
  retry once. The extension does not retain the canceled URL or attempt a hidden
  replay.
- VM tests prove request-listener ordering and responses but do not prove Chrome's
  rendered cancellation page or extension lifecycle timing.

## Prioritized Follow-Ups

1. Migrate background-page and blocking web-request behavior to a supported
   Manifest V3 architecture without weakening startup enforcement.
2. Add extension-capable browser integration coverage for startup cancellation,
   blocked redirects, popup unlisting, and incognito split-mode behavior.
