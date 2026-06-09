# Chrome Blocker Tab State Cleanup

## Status: Completed

## Goal

Keep background tab blocking state bounded to live, valid browser tabs so closed
tabs and non-tab navigation events do not leave stale entries behind.

## Scope

- Add a shared valid-tab-id guard for background tab state writes.
- Ignore negative or non-numeric tab ids from navigation/request events.
- Remove tab blocking state when Chrome reports a tab was closed.
- Extend the source baseline and docs for tab-state cleanup.

## Out Of Scope

- Migrating the extension from Manifest V2 to Manifest V3.
- Changing exact-origin URL matching or block-list storage semantics.
- Adding browser automation for unpacked-extension runtime flows.

## Verification

- `make check`
- `scripts/check-baseline.sh`
- `node scripts/test-url-rules.js`
- `git diff --check`
