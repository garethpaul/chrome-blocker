## Chrome Blocker Vision

This document explains the current state and direction of the project.
Project overview and developer docs: [`README.md`](README.md)

Chrome Blocker is a small Chrome extension for blocking websites during focused
work.

The repository contains an empty README, a Manifest V2 extension, popup UI,
background request interception, and a blocked-site page. The extension stores a
local list of blocked roots in Chrome local storage.

The goal is to keep the blocker simple, personal, and transparent about its
broad browser permissions.

The current focus is:

Priority:

- Preserve the popup-to-background flow for adding and removing blocked sites
- Keep popup and blocked-site background operations behind validated runtime
  message contracts
- Keep the block list local to the browser
- Keep block-list persistence owned by background extension state
- Keep per-tab blocking state scoped to live browser tabs
- Keep background tab-state writes behind the valid-tab-id helper
- Chrome Blocker accepts only finite integer tab IDs at runtime boundaries.
- Keep tab navigation, replacement, and removal lifecycle behavior executable
- Keep global origin-wide tab-state cleanup consistent across open tabs
- Keep request interception scoped to main-frame navigations with valid tab ids
- Keep fail-closed block-list startup hydration ahead of origin matching
- Replay queued block-list mutations only after successful startup hydration
- Keep blocked-page actions scoped to a valid current tab
- Require typed unlist messages to match both the blocked origin and active tab
- Only the exact popup extension page may start the blocked-page unlist countdown.
- Keep blocked-page redirects scoped to the guarded unlist path
- Keep popup actions scoped to a valid active tab id
- Validate redirect message payloads before constructing extension URLs
- Keep host permissions scoped to the HTTP(S) pages the blocker can inspect
- Reject credential-bearing blocker URLs before storing or matching rules
- Make host, tab, storage, webRequest, and navigation permissions explicit
- Keep GitHub Actions aligned with the local Node `make check` baseline
- Keep non-persisted checkout credentials in hosted verification
- Avoid adding tracking or remote configuration

Next priorities:

- Execute the Chrome Blocker browser verification matrix against an exact commit
  in an isolated Chrome profile
- Add README setup, install, and permissions notes
- Migrate from Manifest V2 to a maintained Manifest V3 design
- Improve URL matching so blocked-site rules are predictable and safe
- Add tests or manual verification steps for add/remove/block flows

Contribution rules:

- One PR = one focused extension behavior, permissions, or documentation change.
- Explain any new browser permission in the README.
- Keep the extension usable for personal local installation.
- Verify block and unblock behavior across normal and incognito contexts.
- Keep `.github/workflows/check.yml` in sync with the local static and URL-rule
  baseline.

## Security And Privacy

Canonical security policy and reporting:

- [`SECURITY.md`](SECURITY.md)

This extension can observe and redirect browser navigation. It must not send
visited URLs, block-list entries, or tab state to external services.

Permission changes need a clear purpose, minimal scope, and documentation.

## What We Will Not Merge (For Now)

- Remote telemetry, analytics, or synced block lists
- Additional broad permissions without a documented need
- Manifest migration mixed with unrelated feature work
- URL matching changes that silently over-block sites

This list is a roadmap guardrail, not a permanent rule.
Strong user demand and strong technical rationale can change it.
