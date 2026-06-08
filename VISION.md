## Chrome Blocker Vision

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
- Keep the block list local to the browser
- Make host, tab, storage, webRequest, and navigation permissions explicit
- Avoid adding tracking or remote configuration

Next priorities:

- Add README setup, install, and permissions notes
- Migrate from Manifest V2 to a maintained Manifest V3 design
- Improve URL matching so blocked-site rules are predictable and safe
- Add tests or manual verification steps for add/remove/block flows

Contribution rules:

- One PR = one focused extension behavior, permissions, or documentation change.
- Explain any new browser permission in the README.
- Keep the extension usable for personal local installation.
- Verify block and unblock behavior across normal and incognito contexts.

## Security And Privacy

This extension can observe and redirect browser navigation. It must not send
visited URLs, block-list entries, or tab state to external services.

Permission changes need a clear purpose, minimal scope, and documentation.

## What We Will Not Merge For Now

- Remote telemetry, analytics, or synced block lists
- Additional broad permissions without a documented need
- Manifest migration mixed with unrelated feature work
- URL matching changes that silently over-block sites
