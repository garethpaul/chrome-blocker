# Chrome Blocker Install and Permissions Documentation

Status: Completed

## Problem

The README lists minimal unpacked-extension steps but does not warn that the
checked-in Manifest V2 extension may be rejected by current Chrome releases or
explain why each requested browser capability is necessary.

## Requirements

1. Add a Manifest V2 compatibility warning without claiming that portable
   checks prove current-browser installation.
2. Keep the unpacked-install flow scoped to a compatible isolated profile and
   direct installed-extension testing to the exact-commit browser matrix.
3. Document a permission rationale for HTTP(S) host access, tabs, storage,
   blocking web requests, navigation lifecycle events, the blocked-page
   resource, and split incognito mode, including Chrome's shared local-storage
   behavior across regular and incognito processes.
4. State the local-only privacy boundary and absence of telemetry, remote
   configuration, and synced block lists.
5. Add mutation-sensitive contracts for the guidance and completed plan.

## Scope Boundaries

- Do not change manifest permissions, JavaScript, HTML, CSS, storage shape,
  message contracts, or runtime behavior.
- Do not claim support for a Chrome release that was not tested against the
  exact implementation commit.
- Do not mix Manifest V3 migration into this documentation-only change.

## Verification

- `sh scripts/check-baseline.sh` and `make check` passed with the new README
  contracts.
- Sixteen isolated hostile mutations of the Manifest V2 compatibility warning,
  permission rationale, privacy statement, browser-matrix link, and completed
  plan evidence were rejected by `scripts/check-baseline.sh`.
- No unpacked extension, live navigation, storage, popup, normal-profile, or
  split-incognito scenario was executed for this documentation-only change.
