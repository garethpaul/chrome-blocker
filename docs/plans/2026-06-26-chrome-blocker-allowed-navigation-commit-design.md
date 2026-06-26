# Allowed Navigation Commit Ownership Design

Status: Completed

## Problem

`requestChecker` removes all tab blocking state as soon as an allowed
main-frame request starts. If that navigation is cancelled or fails before
commit, the canonical blocked page remains visible but its document ID and
blocked-origin authority have already been revoked, so its countdown can no
longer unlist the site.

## Decision

Treat `webNavigation.onCommitted` as the only authority that retires committed
document ownership. An allowed request start clears only superseded pending
redirect state. The displayed blocked document remains authorized until a new
top-level document actually commits.

## Verification

- Add a failing VM test for allowed request start followed by delayed commit.
- Require committed origin/document retention and pending-state cleanup.
- Add source contracts and a hostile mutation for restoring eager teardown.
- Run `make check` before merge.
