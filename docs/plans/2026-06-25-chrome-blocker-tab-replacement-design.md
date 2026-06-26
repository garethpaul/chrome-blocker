# Tab Replacement Ownership Design

## Status: Accepted

## Problem

Chrome's official
[`webNavigation` documentation](https://developer.chrome.com/docs/extensions/reference/api/webNavigation)
describes `onTabReplaced` as firing when a fully loaded or prerendered page is
swapped into the current tab. The background currently copies the replaced
tab's blocked origin and committed `documentId` into the replacing tab.
That assigns authorization from an old document to different contents and can
also overwrite state already owned by the prerendered tab.

## Decision

Treat replacement as an ownership boundary. Remove committed and pending state
for the replaced tab, preserve any state already recorded for the replacing
tab, and never copy the old document ID across tab identities.

## Validation

- Reproduce old-state transfer in the real background VM harness.
- Prove replacement preserves independently committed new-tab state.
- Run focused tests, full Make verification, hostile mutations, hosted checks,
  and CodeQL before merge.
