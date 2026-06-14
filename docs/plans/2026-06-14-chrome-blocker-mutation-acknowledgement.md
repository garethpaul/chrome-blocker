# Chrome Blocker Mutation Acknowledgement

Status: In Progress

## Problem

Background mutation messages acknowledge success immediately after calling
`addBlockedSite`, `unlistSite`, or `clearBlacklist`. During startup hydration,
those functions only enqueue work; after hydration failure, they reject work
without changing state. Callers can therefore continue as though a block-list
mutation completed when it is still pending or can never run.

## Requirements

1. Complete each background mutation response only after its state mutation
   has executed.
2. Return an explicit unsuccessful response when storage hydration has failed.
3. Keep the Manifest V2 message channel open for deferred `sendResponse`
   callbacks by returning literal `true` only for accepted mutation actions.
4. Preserve sender validation, action and payload validation, startup
   fail-closed request blocking, queued mutation order, storage ownership,
   tab-state cleanup, popup behavior, blocked-page navigation, and current
   message names.
5. Require popup and blocked-page callers to proceed only after an acknowledged
   successful mutation.
6. Add executable tests and mutation-sensitive source contracts for immediate,
   queued, and hydration-failure responses.

## Implementation Units

### Background Completion Boundary

**Files:** `js/background.js`

Pass a completion callback through the mutation queue. Invoke it with success
after the mutation executes and with failure when hydration has permanently
failed. Keep the runtime response channel open for deferred mutation responses.

### Caller Acknowledgement

**Files:** `js/popup.js`, `js/blockedSite.js`

Require a successful response before redirecting a newly blocked tab or
clearing popup state. Preserve the existing blocked-page rule that navigates
back to the origin only after unlisting succeeds.

### Regression Protection

**Files:** `scripts/test-background.js`, `scripts/test-popup.js`,
`scripts/test-blocked-site.js`, `scripts/check-baseline.sh`, `README.md`,
`SECURITY.md`, `CHANGES.md`, this plan

Exercise deferred acknowledgement before hydration, explicit failure after
hydration failure, immediate completion after hydration, literal-true channel
retention, and caller refusal to proceed on missing or unsuccessful responses.

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
- Existing state mutations remain synchronous once hydration has completed;
  persistence callbacks are outside this narrow acknowledgement boundary.
