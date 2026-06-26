# Content-Owned Redirect Reservation

Status: Completed

## Problem

The popup persisted a new blocked origin and the background immediately
reserved pending tab ownership. If the popup closed before its mutation
callback, or the tab changed documents before redirect delivery, no current
content document approved the navigation while the pending reservation remained
available to a later canonical blocked-page commit.

## Decision

- Keep block-list persistence separate from tab ownership.
- Let only a same-extension, top-level content script with a finite sender tab
  and matching normalized document origin reserve pending ownership.
- Reserve immediately before the content script navigates to the canonical
  blocked page.
- Reject missing, subframe, cross-origin, and other-extension senders without
  changing pending state.

## Work Completed

- Removed pending-state writes from block-list persistence.
- Added an exact content-document reservation route.
- Made the content script reserve ownership and wait for acknowledgement before
  navigating.
- Added accepted, missing-tab, subframe, wrong-sender, and mismatched-origin
  regressions, plus proof that persistence alone creates no pending state.
- Synchronized public, security, roadmap, and maintainer guidance.
- Added fail-closed source, regression, plan, and guidance contracts.

## Verification Completed

- RED direct Node suites proved persistence still created pending authority and
  the content script did not request a document-owned reservation.
- Focused direct Node suites passed after the implementation.
- All five direct VM suites, the hostile Make-launcher suite, JavaScript syntax
  checks, and the static baseline passed on Node 18.19.1.
- The trusted clean-snapshot `make check` passed, and the static baseline plus
  all five VM suites passed in network-disabled Node 20.20.2, 22.23.1, and
  24.18.0 containers.
- Ten isolated hostile source, regression, and plan mutations were rejected.
- `git diff --check` passed.

## Residual Risk

The pending map remains intentionally keyed by tab rather than navigation ID.
Concurrent provisional navigations from the same top-level document still need
browser-level evidence before a larger state model is justified.
