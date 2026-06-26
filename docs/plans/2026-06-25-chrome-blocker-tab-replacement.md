# Tab Replacement Ownership Implementation Plan

## Status: Completed

Completed on 2026-06-25. The implementation head
`dfbe30e2e66bf6daed780d5bb8c261a968831254` passed hosted Check runs
`28213618025` and `28213619042` on Node 20, 22, and 24. CodeQL run
`28213618286` passed for Actions and JavaScript/TypeScript. The required
`codex review --base origin/master` attempt was blocked by OpenAI API HTTP 401;
exact-head manual correctness, quality, and security review found no actionable
findings.

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

## Verification Evidence

- RED reproduced stale committed origin/document transfer, stale state after a
  malformed replacement event, self-replacement state loss, and pending
  reservation leakage.
- Focused background tests and all direct VM suites passed.
- Full trusted-snapshot `make check` passed.
- Five isolated hostile mutations were rejected across skipped cleanup, old
  state transfer, new-state deletion, invalid-new-tab handling, and self-event
  cleanup.
