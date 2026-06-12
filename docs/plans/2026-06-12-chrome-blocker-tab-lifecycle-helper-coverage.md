# Chrome Blocker Tab Lifecycle Helper Coverage

## Status: Completed

## Goal

Keep all per-tab blocking-state mutations behind the shared valid-tab helpers
and prove tab initialization, replacement, and cleanup behavior in the Node
background harness.

## Problem

`addBlockedSite`, `unlistSite`, request interception, and tab removal use the
guarded state helpers, but `updateMapping` and `updateReplacedTabMapping` still
write and delete `tabBlockingMap` directly. Those paths currently validate ids,
yet bypassing the ownership helpers makes future guard changes easy to apply
incompletely. The executable background test also stops after request redirect
coverage and does not exercise these lifecycle listeners.

## Scope

- Route committed-navigation initialization through `setTabBlockingState`.
- Transfer replacement state through `getTabState` and `setTabBlockingState`.
- Remove replaced-tab state through `removeTabBlockingState`.
- Extend the background behavior test for tab initialization, replacement,
  invalid replacement details, and tab removal.
- Extend the static baseline and maintenance documentation for the contract.

## Out Of Scope

- Migrating Manifest V2 APIs or changing request interception behavior.
- Changing block-list persistence, URL normalization, or incognito mode.
- Adding an unpacked-extension browser automation dependency.

## Verification

- `node scripts/test-url-rules.js`
- `node scripts/test-background.js`
- `make check`
- `sh -n scripts/check-baseline.sh`
- Targeted mutation checks
- `git diff --check`

Live extension installation and split-incognito behavior remain manual Chrome
verification paths.
