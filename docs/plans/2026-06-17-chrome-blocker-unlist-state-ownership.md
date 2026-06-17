---
title: Chrome Blocker Unlist State Ownership
type: security
date: 2026-06-17
status: planned
execution: code
---

# Chrome Blocker Unlist State Ownership

## Context

`blockedSite.html` must remain web-accessible because the extension redirects
blocked top-level requests to it. Chrome documents that web-accessible resources
can be navigated to from web origins. The background unlist route currently
verifies the extension-page URL, normalized blocked origin, and numeric sender
tab identity, but it does not verify that the sender tab is presently recorded
as blocked for that same origin. A directly navigated blocked page can therefore
request removal of a globally blocked origin it does not own.

Primary references:

- https://developer.chrome.com/docs/extensions/reference/manifest/web-accessible-resources
- https://developer.chrome.com/docs/extensions/reference/api/runtime/#type-MessageSender

## Priorities

1. Bind blocked-page unlist mutations to the sender tab's current blocked-origin
   state.
2. Add unpacked-extension browser automation for normal and split-incognito
   profiles.
3. Migrate the extension from Manifest V2 to Manifest V3 with equivalent
   blocking behavior and service-worker lifecycle coverage.

This change implements only priority 1. Browser automation and Manifest V3 are
larger delivery boundaries and must not weaken the current message contracts.

## Requirements

- Preserve exact extension ID, blocked-page URL, normalized origin, and finite
  sender-tab authorization.
- Require the background tab state for the sender tab to equal the normalized
  blocked-page origin before accepting `background:unlistSite`.
- Reject a same-extension blocked page whose URL, message tab ID, and sender tab
  ID agree when that tab has no matching blocked state.
- Preserve successful unlisting for a tab that was actually redirected for the
  same origin.
- Keep serialized storage mutation, response acknowledgement, and all-tab state
  cleanup behavior unchanged.
- Add mutation-sensitive baseline contracts for state-bound authorization and
  the unowned same-tab rejection case.
- Document the stronger boundary without claiming unpacked-browser execution.

## Implementation

### Background authorization

Update `js/background.js` so blocked-page tab authorization receives the
normalized blocked origin and compares it with `getTabState(tabId)`. Keep this
check inside the route authorization boundary before any storage mutation is
queued.

### Real-script regression coverage

Update `scripts/test-background.js` with a same-extension, exact-URL, same-tab
unlist message for a tab that has no matching blocking state. Assert that the
route returns no asynchronous ownership, does not write storage, and leaves the
existing blocked origin intact. Retain the current successful owned-tab case.

### Static contract and documentation

Update `scripts/check-baseline.sh`, `AGENTS.md`, `README.md`, `SECURITY.md`,
`VISION.md`, and `CHANGES.md` so removal of the state guard, regression case, or
documented boundary fails the maintained gate.

## Verification

- Run shell syntax and the focused background real-script suite.
- Run repository-root and external-directory `make check`.
- Reject isolated mutations to the state guard, origin argument, unowned-tab
  case, owned-tab success case, and documentation contract.
- Audit the exact diff, generated artifacts, and credential-shaped additions.
- Require exact-head push and pull-request checks across Node 20, 22, and 24.

## Risks

- A blocked page retained across extension/background restart may no longer be
  allowed to mutate storage until navigation rebuilds its tab state. Failing
  closed is intentional because the background cannot prove prior ownership.
- The VM harness exercises the real extension scripts but does not replace an
  unpacked-extension Chrome run.
- Delivery remains stacked on the existing content-message ownership branch;
  prior pull requests must remain open and unmerged without authorization.
