# Blocked-Page Reload Ownership

Status: Completed

## Problem

The first committed blocked page consumed its pending redirect reservation. A
reload committed the same canonical blocked-page URL without a pending entry,
so the background cleared the tab's blocked origin and document ownership. The
popup then treated the tab as unblocked and the reloaded page could not complete
its guarded unlist flow.

## Change

Allow a top-level canonical blocked-page commit when either a matching pending
redirect exists or the tab already owns the same blocked origin. Every accepted
commit replaces the authorized document ID, so the pre-reload document remains
stale and cannot mutate the block list.

## Verification

- RED reproduced with `reloaded-blocked-document` in the real background VM test.
- Added a second reload flow proving the old document ID is rejected and the
  replacement document can complete the authorized unlist mutation.
- Added static contracts for same-origin reload preservation and lifecycle docs.
- Passed focused Node tests and `make check` from a clean committed snapshot.
- No unpacked-extension browser flow was executed locally.
