# Chrome Blocker Non-Tab Request Guard

## Status: Completed

## Context

The background request handler used the valid-tab helper when writing state,
but it still matched and redirected blocked main-frame requests whose Chrome
`tabId` was `-1`. Those requests are not associated with a normal browser tab,
while the extension's state, blocked page, and unblock flow all require a real
tab. Redirecting them expanded interception beyond the extension's usable and
recoverable boundary.

## Objectives

- Ignore main-frame requests that do not have a valid browser tab id.
- Preserve exact-origin matching and redirects for valid tabs.
- Execute the real background script in Node with mocked Chrome APIs.
- Cover invalid tab, subframe, valid blocked navigation, redirect encoding, and
  tab-state update behavior.
- Keep local and hosted Node verification portable and deterministic.

## Work Completed

- Added the valid-tab check to `requestChecker` before URL matching or state
  mutation.
- Added `scripts/test-background.js`, which loads `urlRules.js` and
  `background.js` in a VM and captures registered Chrome listeners.
- Asserted that `tabId: -1` and subframe requests are untouched while a valid
  blocked main-frame navigation receives the encoded extension redirect and
  updates per-tab state.
- Added the background behavior test to `make test` beside URL-rule coverage.
- Extended the source baseline to require the guard, executable test, docs,
  rooted Makefile, stable CI runner, and completed plan.
- Updated README, VISION, and CHANGES with the interception boundary.

## Verification

- `node scripts/test-url-rules.js`
- `node scripts/test-background.js`
- `make check`
- `make -f /tmp/chrome-blocker-second-pass/Makefile check`
- Baseline mutation checks for invalid-tab guarding, executable test coverage,
  Makefile rooting, CI, and plan status
- `sh -n scripts/check-baseline.sh`
- `git diff --check`

Chrome extension installation and live browsing behavior remain manual checks.
The hosted workflow runs the source and behavior gates on Node 20, 22, and 24.

## Follow-Up Candidates

- Extract additional background storage and tab-replacement behavior into
  executable tests as part of the eventual Manifest V3 migration.
- Test normal and split-incognito blocking flows in a locally installed Chrome
  profile.
