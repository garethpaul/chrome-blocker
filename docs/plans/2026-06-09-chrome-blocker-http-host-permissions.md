# Chrome Blocker HTTP Host Permissions

Status: Completed
Date: 2026-06-09

## Goal

Keep extension host permissions aligned with the blocker behavior by requesting
only HTTP and HTTPS page access instead of all URL schemes.

## Changes

- Replaced the manifest `*://*/*` host permission with explicit `http://*/*`
  and `https://*/*` permissions.
- Extended the static baseline to reject the all-schemes wildcard and require
  HTTP(S) permissions in the manifest permissions block.
- Extended the Node test harness to assert the same manifest host-permission
  scope.
- Documented the scoped host-permission baseline in the README, changelog, and
  vision.

## Verification

- `scripts/check-baseline.sh`
- `make lint`
- `make test`
- `make build`
- `make check`
- `git diff --check`
