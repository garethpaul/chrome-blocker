---
title: Chrome Blocker Check Wrapper
type: chore
status: completed
date: 2026-06-08
---

# Chrome Blocker Check Wrapper

## Summary

Expose the extension source baseline and URL-rule tests through the shared root
`make check` command.

## Requirements

- R1. Preserve `scripts/check-baseline.sh` as the source verification gate.
- R2. Run the Node URL-rule tests from the root test target.
- R3. Keep build verification static because this is an unpacked Manifest V2
  extension without a package/build toolchain.
- R4. Document the wrapper in README and CHANGES.

## Verification

- `make check`
- `git diff --check`
