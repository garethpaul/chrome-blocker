---
title: Chrome Blocker Countdown Timer Cleanup
type: fix
status: completed
date: 2026-06-08
---

# Chrome Blocker Countdown Timer Cleanup

## Summary

Prevent overlapping unblock countdown timers on the blocked page by clearing
the existing interval before each restart and resetting interval state when the
modal closes.

## Requirements

- R1. The blocked page keeps validating the `blocked` redirect parameter.
- R2. Countdown interval cleanup is centralized in one helper.
- R3. Starting a countdown clears any prior interval first.
- R4. Hiding the modal clears the interval and resets interval state.
- R5. README, changelog, and source baseline document the timer lifecycle.

## Verification

- `scripts/check-baseline.sh`
- `node scripts/test-url-rules.js`
- `git diff --check`
