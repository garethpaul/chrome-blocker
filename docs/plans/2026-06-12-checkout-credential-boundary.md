---
title: Checkout Credential Boundary
date: 2026-06-12
status: completed
execution: code
---

# Checkout Credential Boundary

## Summary

Prevent the Node matrix from retaining its GitHub token after checkout while
preserving extension behavior, tests, and existing CodeQL coverage.

## Requirements

- Disable credential persistence on the only checkout step.
- Enforce immutable actions, exact read-only permissions, one checkout, one
  setup-node step, one Make command, and no bypasses.
- Preserve Node 20/22/24, extension files, tests, and default CodeQL.
- Pass repository/external-working-directory checks and hostile mutations.

## Scope And Verification

Only the Check workflow, static contracts, guidance, and evidence change.

## Work Completed

- Disabled credential persistence on the only checkout step.
- Added exact action count/pin, permission, command, documentation, and plan
  contracts while preserving the Node 20/22/24 matrix.
- Preserved extension code, manifest, tests, and default CodeQL.

## Verification Completed

- The untouched baseline passed from the repository and an external working directory.
- `make check` passed static, URL-rule, manifest-permission, background request,
  and tab lifecycle tests after implementation.
- Focused hostile mutations rejected credential, pin, permission, command,
  documentation, and incomplete-plan drift; all hostile mutations rejected.
- YAML/shell parsing, `git diff --check`, and secret scanning passed.

## Hosted Verification

Exact-head Node matrix and default CodeQL evidence will be recorded after push.
Tracker reconciliation remains pending until both are terminal green.
