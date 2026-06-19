---
title: Chrome Blocker Global Unlist Tab State
type: fix
date: 2026-06-13
---

# Chrome Blocker Global Unlist Tab State

## Summary

Clear every tab-state entry associated with an origin when that origin is
removed from the global block list, so other open tabs do not retain stale
blocked status.

## Problem Frame

`unlistSite` removes an origin from the shared `blockedSites` list but resets
only the initiating tab. Any other tab whose `tabBlockingMap` entry references
the same origin continues to appear blocked to the popup until a later
navigation refreshes its state.

## Requirements

- R1. Removing a blocked origin must clear every valid tab-state entry equal to
  that normalized origin.
- R2. Tab-state entries for other blocked origins must remain unchanged.
- R3. Invalid or absent origins must not clear unrelated tab state.
- R4. The initiating tab must still report unblocked after the global removal.
- R5. Background tests and the static baseline must cover multi-tab cleanup,
  unrelated-state preservation, and the centralized helper boundary.

## Key Technical Decisions

- **Centralize origin-wide cleanup:** Add one background helper that iterates
  owned `tabBlockingMap` entries and removes only entries equal to the
  normalized origin.
- **Keep global storage ownership unchanged:** `unlistSite` remains responsible
  for block-list persistence; the popup and blocked page continue delegating to
  the background page.
- **Remove stale entries instead of writing zero:** Deleting matching entries
  keeps the existing `getTabState` default and tab-removal cleanup semantics.
- **Reject invalid origins before cleanup:** A failed normalization must leave
  both storage and tab state unchanged.

## Implementation Units

### U1. Clear Matching Tab State On Global Unlist

- **Files:** `js/background.js`
- **Goal:** Remove all tab map entries for the normalized unlisted origin while
  preserving other origins and existing storage behavior.
- **Covers:** R1, R2, R3, R4

### U2. Add Multi-Tab Regression Coverage

- **Files:** `scripts/test-background.js`, `scripts/check-baseline.sh`
- **Goal:** Exercise two tabs blocked by the same origin, one tab blocked by a
  different origin, invalid-origin rejection, and helper ownership.
- **Covers:** R5

### U3. Record The State-Consistency Boundary

- **Files:** `README.md`, `CHANGES.md`, `VISION.md`
- **Goal:** Document that global unlisting clears matching state across all
  open tabs and retain the browser-interaction limitation.
- **Covers:** R1, R5

## Verification

- Run `node scripts/test-background.js`, `make check`, and the absolute-path
  `make check` wrapper from an external working directory.
- Run shell syntax and diff checks.
- Apply isolated hostile mutations for current-tab-only cleanup, unrelated-tab
  deletion, invalid-origin handling, multi-tab fixtures, and documentation
  contracts; each mutation must fail.
- Use `agent-browser` only if installed; otherwise do not substitute another
  browser automation system or claim interactive Chrome coverage.

## Prioritized Follow-Ups

1. Close the asynchronous startup interval before `chrome.storage.local.get`
   has loaded the persisted block list.
2. Plan a Manifest V3 migration that replaces background-page coupling and the
   blocking web-request architecture without weakening block enforcement.

## Risks

- Iterating the in-memory tab map is linear in the number of tracked tabs, which
  is bounded by the browser session and occurs only during explicit unlisting.
- Static VM tests cannot prove popup and blocked-page behavior in a loaded
  Chrome extension.
