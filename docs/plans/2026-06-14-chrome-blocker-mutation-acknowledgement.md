# Chrome Blocker Mutation Acknowledgement

Status: In Progress

## Problem

Background mutation messages acknowledge success immediately after calling
`addBlockedSite`, `unlistSite`, or `clearBlacklist`. During startup hydration,
those functions only enqueue work; after hydration failure, they reject work
without changing state. Callers can therefore continue as though a block-list
mutation completed when it is still pending or can never run.

## Requirements

1. Serialize background mutations so overlapping messages cannot race storage
   writes or overwrite newer block-list state.
2. Complete each background mutation response only after its
   `chrome.storage.local.set` callback reports success.
3. Return an explicit unsuccessful response when storage hydration or mutation
   persistence has failed, leaving committed in-memory and tab state unchanged.
4. Keep the Manifest V2 message channel open for deferred `sendResponse`
   callbacks by returning literal `true` only for accepted mutation actions.
5. Preserve sender validation, action and payload validation, startup
   fail-closed request blocking, queued mutation order, storage ownership,
   tab-state cleanup, popup behavior, blocked-page navigation, and current
   message names.
6. Require popup and blocked-page callers to proceed only after an acknowledged
   successful mutation.
7. Add executable tests and mutation-sensitive source contracts for queued,
   persisted, persistence-failure, and hydration-failure responses.

## Implementation Units

### Background Completion Boundary

**Files:** `js/background.js`

Use one serialized mutation queue for pre-hydration and post-hydration work.
Each mutation derives its next block list without mutating committed state,
persists that list, then publishes list and tab-state changes only when the
storage callback has no `runtime.lastError`. Complete queued message callbacks
with explicit success or failure and keep the runtime response channel open for
deferred responses.

### Caller Acknowledgement

**Files:** `js/popup.js`, `js/blockedSite.js`

Require a successful response before redirecting a newly blocked tab or
clearing popup state. Preserve the existing blocked-page rule that navigates
back to the origin only after unlisting succeeds.

### Regression Protection

**Files:** `scripts/test-background.js`, `scripts/test-popup.js`,
`scripts/test-blocked-site.js`, `scripts/check-baseline.sh`, `README.md`,
`SECURITY.md`, `CHANGES.md`, this plan

Exercise deferred acknowledgement before hydration, serialized persistence,
explicit hydration and write failures, literal-true channel retention, no
in-memory publication after failed writes, and caller refusal to proceed on
missing or unsuccessful responses.

## Verification

- Run JavaScript and shell syntax checks plus the repository test suites.
- Run `make check` from the repository root and through an absolute Makefile
  path from an unrelated working directory.
- Reject focused mutations for immediate acknowledgement, omitted literal
  `true`, dropped failure responses, caller response bypass, stale docs, and
  incomplete plan evidence.
- Inspect the exact diff, generated artifacts, conflict markers, whitespace,
  and credential-shaped additions before committing.

## Scope Boundaries

- Do not migrate Manifest V2, webRequest blocking, or the persistent background
  page in this change.
- Do not change URL normalization, host permissions, message action names,
  countdown duration, or user-visible text.
- Do not add dependencies or claim unpacked-extension browser verification.
- Do not merge or close stacked pull requests without explicit authorization.

## Assumptions

- Chrome's Manifest V2 message contract requires a listener to return literal
  `true` when `sendResponse` will run asynchronously.
- The initial normalization write is part of hydration readiness: request
  processing and queued mutations remain fail-closed until that write succeeds.
