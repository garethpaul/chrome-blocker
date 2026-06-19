# Chrome Blocker Finite Integer Tab IDs

Status: Completed

## Problem

The shared background tab-ID validator accepts every nonnegative number,
including fractional values and `Infinity`. Those values are not Chrome tab
identifiers but can still create impossible `tabBlockingMap` keys or address
runtime mutation handlers.

## Requirements

1. Accept only finite, whole, nonnegative numeric tab IDs.
2. Apply the existing validator to runtime messages, navigation callbacks, and
   direct tab-state writes.
3. Add executable tests for fractional and infinite message IDs and state
   writes.
4. Preserve normal integer IDs, persistence ordering, sender validation,
   hydration behavior, redirects, and tab replacement/removal semantics.
5. Add mutation-sensitive source, test, documentation, and completed-plan
   contracts.

## Scope Boundaries

- Do not change URL normalization, host permissions, Manifest V2, blocking
  request behavior, storage schema, UI, or vendored libraries.
- Do not claim unpacked-extension browser execution.
- Do not merge or close stacked pull requests without explicit authorization.

## Verification

- The real background-script Node VM suite passed accepted integer IDs and
  rejected fractional and infinite IDs through runtime messages and direct
  state writes.
- Root and external-directory `make check` passed URL rules, background,
  blocked-page, popup, source, workflow, documentation, and plan gates.
- Six hostile mutations were rejected for missing finiteness, missing integer
  enforcement, permissive fractional or infinite tests, documentation drift,
  and reopened plan status.
- JavaScript and shell syntax, exact diff, generated-artifact, vendored-path,
  whitespace, and credential-shaped addition audits passed.
- No unpacked-extension browser execution is claimed.
