# Allowed Navigation Commit Ownership Plan

Status: Completed

## Goal

Preserve blocked-page unlist authority across cancelled or failed allowed
navigations while still clearing superseded pending redirects.

## Steps

1. Add request-start ownership regression coverage.
2. Demonstrate eager committed-state removal fails.
3. Add pending-only cleanup helper.
4. Keep committed cleanup in `onCommitted`.
5. Run focused and full verification.

## Acceptance Criteria

- Allowed request start preserves committed origin and document ID.
- Allowed request start clears pending redirect state.
- Allowed top-level commit removes all prior blocked state.
- Hostile restoration of eager teardown fails verification.
- `make check` passes.
