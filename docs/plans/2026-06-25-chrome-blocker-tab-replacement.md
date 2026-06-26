# Tab Replacement Ownership Implementation Plan

## Status: In Progress

### Task 1: Reproduce stale authority

- Assert old committed state is not transferred to the replacing tab.
- Assert independently committed replacing-tab state remains unchanged.
- Assert malformed self-replacement events cannot clear valid tab ownership.
- Assert the replaced tab's pending redirect reservation is removed.

### Task 2: Fix lifecycle ownership

- Remove only the replaced tab's state.
- Preserve the replacing tab's own committed and pending state.
- Keep invalid lifecycle payloads fail closed.

### Task 3: Preserve and publish

- Add static and public lifecycle contracts.
- Run focused, full, mutation, review, and hosted gates.
- Merge only after the exact final head is green.
