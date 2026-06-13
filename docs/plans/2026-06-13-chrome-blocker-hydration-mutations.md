# Preserve Mutations During Block-List Hydration

Status: In Progress

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

Verification: Pending

- Run focused background VM tests and JavaScript syntax checks.
- Run the full pinned `make check` gate with an explicit timeout.
- Run focused hostile mutations for queueing, replay order, error cleanup,
  regression coverage, documentation, and plan status.
- Inspect the exact diff, generated artifacts, and credential-shaped additions.

## Scope Boundaries

- Do not change URL matching, host permissions, redirect destinations, or the
  fail-closed request behavior during hydration.
- Do not migrate the manifest or extension architecture in this change.
- Do not claim unpacked-extension browser coverage.
