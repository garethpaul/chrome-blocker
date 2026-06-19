---
title: Chrome Blocker Unlist Tab Ownership
type: security
status: completed
date: 2026-06-15
---

# Chrome Blocker Unlist Tab Ownership

## Problem

The background unlist route authorizes the blocked extension page and requires
its query origin to match the message origin, but it accepts the message's
`tabId` without comparing it to `sender.tab.id`. A valid blocked page can thus
name a different tab when requesting the persistent unlist mutation.

## Priorities

1. P0: Bind blocked-page unlist mutations to the exact sender tab.
2. P1: Reject missing, malformed, and mismatched sender-tab ownership before
   persistence work begins.
3. P2: Preserve current same-tab unlist acknowledgement and origin checks.

## Requirements

- Require `sender.tab.id` to be a valid finite nonnegative integer.
- Require the sender tab ID to equal the validated message tab ID.
- Perform sender-tab authorization before calling `unlistSite()`.
- Preserve popup-only route authorization and blocked-origin equality.
- Add VM regressions and mutation-sensitive source, ordering, guidance, and
  completed-plan contracts.
- Do not claim unpacked-extension browser execution.

## Implementation Units

### U1: Sender Tab Authorization

**File:** `js/background.js`

Add a small blocked-page sender-tab ownership predicate and use it in the
unlist route authorization boundary before mutation dispatch.

### U2: VM And Static Contracts

**Files:** `scripts/test-background.js`, `scripts/check-baseline.sh`

Cover same-tab success plus absent, noninteger, negative, and mismatched sender
tabs. Require authorization to precede `unlistSite()` and fail closed when the
predicate or tests are weakened.

### U3: Maintained Guidance

**Files:** `README.md`, `SECURITY.md`, `VISION.md`, `CHANGES.md`, and this plan.

Document that blocked-page unlist mutations require exact origin and sender-tab
ownership.

## Verification

- Run the focused background VM suite and POSIX static baseline.
- Run repository-root and external-directory `make check`.
- Reject isolated predicate, sender tab, equality, ordering, regression,
  guidance, and incomplete-plan mutations.
- Audit exact intended paths, generated artifacts, protected dependency and
  workflow files, conflict markers, whitespace, and credential-shaped additions.

## Scope Boundaries

- Do not change popup route authorization, URL normalization, countdown UI,
  storage hydration, mutation serialization, redirect behavior, dependencies,
  manifest permissions, or workflows.
- Keep this pull request stacked on PR #12 and preserve base-first ordering.

## Completion Evidence

- The focused background VM suite passed same-tab success and missing,
  negative, fractional, and mismatched sender-tab rejection.
- All four Node VM suites passed under Node 20.
- Repository-root and external-directory `make check` passed the portable
  static baseline and all four Node VM suites.
- Eight hostile sender-tab mutations were rejected across the
  predicate, sender-tab presence, integer validation, equality, route guard,
  regression fixture, maintained guidance, and incomplete plan status.
- No unpacked-extension browser flow was executed.
