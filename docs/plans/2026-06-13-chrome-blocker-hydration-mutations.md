# Preserve Mutations During Block-List Hydration

Status: Completed

## Context

Navigation enforcement waits for the initial `chrome.storage.local` read, but
popup-driven add, unlist, and clear operations can run before that callback.
The callback then replaces the in-memory list with its older storage snapshot,
silently losing the newer user action.

## Requirements

- R1. Queue normalized block-list mutations while startup hydration is pending.
- R2. Install and normalize the loaded snapshot before replaying queued
  mutations in their original order.
- R3. Preserve existing storage writes and tab-state updates for replayed
  operations.
- R4. Drop queued mutations when the storage read fails while retaining the
  existing fail-closed navigation behavior.
- R5. Add deferred-callback VM coverage and mutation-sensitive static contracts.

## Implementation Units

### 1. Background mutation queue

Files:

- `js/background.js`

Centralize readiness-aware mutation dispatch, ordered replay after successful
hydration, and queue cleanup on storage failure.

### 2. Regression and contracts

Files:

- `scripts/test-background.js`
- `scripts/check-baseline.sh`

Prove an add requested before hydration survives the loaded snapshot and prove
failed hydration does not retain or execute queued work.

### 3. Guidance and evidence

Files:

- `AGENTS.md`
- `README.md`
- `SECURITY.md`
- `VISION.md`
- `CHANGES.md`

Document the startup mutation-ordering boundary and completed verification.

## Verification

Verification: Completed

- The real-script background VM suite passes deferred add replay after a loaded
  snapshot and queued-work cleanup after a storage error.
- URL-rule and blocked-page suites, JavaScript syntax checks, shell syntax, and
  whitespace checks pass.
- Full `make check` passes all source contracts and three Node behavior suites.
- Nine focused hostile mutations remove queue insertion, readiness-before-replay
  ordering, storage-error cleanup, terminal failure state, direct mutation
  execution, replay-loop work, regression evidence, documentation, or completed
  plan status; every mutation is rejected.
- Exact-diff review, generated artifact inspection, and credential-shaped
  addition scanning are completed before the implementation commit.

## Work Completed

- Added one readiness-aware queue for normalized add, unlist, and clear
  mutations.
- Installed the loaded snapshot and published readiness before replaying queued
  mutations in original order.
- Dropped queued work and rejected later mutation retention on storage failure
  while preserving fail-closed navigation.
- Updated the VM fake to snapshot storage writes like the Chrome API and added
  deterministic success/failure regressions.

## Scope Boundaries

- Do not change URL matching, host permissions, redirect destinations, or the
  fail-closed request behavior during hydration.
- Do not migrate the manifest or extension architecture in this change.
- Do not claim unpacked-extension browser coverage.

This change claims no unpacked-extension browser execution.
