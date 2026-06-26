# Chrome Blocker Changes

## 2026-06-25T19:47:00-0700 — P1 security — tab replacement ownership

- Bug fixed: `webNavigation.onTabReplaced` copied a replaced tab's blocked
  origin and committed document ID into different replacing contents.
- Behavior: replacement now removes only the old tab's committed and pending
  state, preserves independently recorded replacing-tab state, and still cleans
  the old tab when the new tab ID in an event payload is invalid.
- Tests: real background VM regressions cover stale authority transfer,
  replacing-tab ownership preservation, malformed-event cleanup, and
  self-replacement preservation.
- Files: `js/background.js`, `scripts/test-background.js`, static and public
  lifecycle contracts, and the tab-replacement design and implementation plans.
- Validation: focused RED/GREEN Node reproduction completed.
- Next: validate from a clean committed snapshot, run review and hosted checks,
  then merge the focused PR.

## 2026-06-25T21:05:51Z — P1 correctness/security — cycle: blocked-page reload ownership

- Threads: inspected the explicit MIT license, default branch, open pull
  requests and issues, hosted checks, block-list hydration, runtime message
  authorization, pending redirects, committed document ownership, tab
  replacement, blocked-page countdown behavior, and executable VM contracts.
- Bug fixed: reloading an already authorized canonical blocked page now keeps
  the tab's blocked origin while replacing the old committed document ID;
  unrelated top-level navigation still clears ownership.
- Files: `js/background.js`, `scripts/test-background.js`,
  `scripts/check-baseline.sh`, lifecycle documentation, and
  `docs/plans/2026-06-25-chrome-blocker-blocked-page-reload.md`.
- Validation: reproduced the state loss in the real background VM test and
  passed focused background, URL, content-script, popup, blocked-page, and
  static contract checks.
- Blockers: no unpacked-extension browser flow was executed locally; the
  existing isolated-profile browser matrix remains the manual integration gate.
- Next: verify reload, hard reload, back/forward, and tab replacement behavior
  in an isolated current Chrome profile at the reviewed commit.

## 2026-06-25

- Revalidated the trusted-path verification boundary with the hostile launcher
  regression suite, the full repository check, and an independent Codex review.

## 2026-06-22

- Defined the maintained scope as repository-path and Make-argument safety
  within a trusted pre-exec process environment. The caller, account, loader
  environment, and absolute system/Node executables are explicit non-goals.
- Kept the direct `/usr/bin/env -i` command for a fixed post-start child
  environment and opaque Node/repository/target argv, not as a defense against
  same-privilege loader or parent-process injection.
- Kept `scripts/check` only as a trusted-environment convenience. It is not a
  security boundary because a shell interpreter starts before script code can
  clear shell startup variables.
- Added a Node verification launcher that validates repository identity from
  OS argv before Make parsing, clears Make control channels, and exposes only
  fixed verification targets.
- Kept `make check` as a trusted-path convenience while documenting that raw
  external `make -f` input is not safe for arbitrary hostile path data on GNU
  Make 3.81.
- Added launcher regressions for hostile path bytes, symlinks, control-channel
  injection, target validation, exact gate argv, and failure closure.
- Bound Make and gate execution to a private archive of the clean tracked
  `HEAD` tree, with source directory, commit, index, and worktree revalidation
  after snapshot creation to reject direct and symlink directory swaps.
- Pinned snapshot Git commands to the selected checkout and isolated them from
  inherited repository, object, index, config, discovery, lock, trace, hook,
  filter, and fsmonitor channels.
- Resolved Git, Tar, Make, Node, and the baseline shell from fixed system-tool
  locations before repository processing, rechecked executable identities at
  use, and removed caller `PATH` from private snapshot execution.

## 2026-06-19

- Blocked-page unlist mutations require a reserved top-level redirect and the exact committed document ID; subframes, stale documents, and replacement navigations fail closed.
- Pending redirect ownership now clears on navigation, global unlist, global clear,
  and tab removal, while popup and blocked-page tab IDs require finite non-negative integers.
- Verified exact blocked-document ownership in an isolated Chromium 133 profile.

## 2026-06-17

- Blocked-page unlist mutations also require the sender tab's current blocked-origin state to match the requested origin.

## 2026-06-15

- Only the exact popup extension page may start the blocked-page unlist countdown.
- Popup routes and blocked-page unlist routes use separate exact sender authorization.
- Blocked-page unlist mutations require exact blocked-origin and sender-tab ownership.
- Content-script URL reads and redirects require exact popup sender and current-document origin ownership.

## 2026-06-14

- Added an exact-head Chrome browser verification matrix with privacy-safe
  evidence fields and every live-extension row explicitly unexecuted.
- Chrome Blocker accepts only finite integer tab IDs at runtime boundaries.
- Replaced popup and blocked-page `getBackgroundPage()` calls with validated
  same-extension runtime messages for state reads and block-list mutations.
- Added executable popup coverage and required acknowledged background unlist
  mutations before the blocked page returns to the original site.
- Background block-list mutations are serialized and acknowledged only after
  storage persistence succeeds.

## 2026-06-13

- Updated successful startup hydration to replay queued block-list mutations,
  preserving add, unlist, and clear actions while dropping queued actions on
  storage failure.
- Closed the asynchronous block-list startup interval by canceling valid
  main-frame requests until successful local-storage hydration, while preserving
  ignored invalid request classes and normal post-hydration behavior.
- Replaced raw numeric popup unlist broadcasts with typed runtime requests
  containing the active tab id and normalized blocked origin.
- Rejected malformed, wrong-action, wrong-tab, and wrong-origin unlist messages
  before showing the blocked-page countdown modal or starting its timer.
- Added VM coverage for the blocked-page runtime listener and wired it into the
  repository test and static verification gates.
- Removed stale blocked state from every matching tab when an origin is
  globally unlisted, while preserving state for other blocked origins.
- Rejected invalid unlist origins before storage or tab-state mutation and
  added executable multi-tab regression coverage.

## 2026-06-12

- Disabled checkout credential persistence in the canonical Node matrix and
  added exact action, permission, and command contracts.
- Routed committed-navigation and tab-replacement state changes through the
  centralized valid-tab helpers.
- Expanded the real background-script VM test to cover state initialization,
  replacement transfer, invalid replacement details, and tab removal.

## 2026-06-10

- Ignored main-frame web requests without a valid browser tab before matching
  or redirecting, and added a Node VM test over the real background listener.
- Made local checks location-independent and pinned CI to the stable Ubuntu
  24.04 runner image.
- Added a GitHub Actions workflow that runs `make check` on Node 20, 22, and
  24.
- Pinned workflow actions and limited repository access to read-only with
  bounded execution.
- Extended the baseline script and docs to require the hosted CI verification
  path.

## 2026-06-09

- Rejected credential-bearing blocker URLs during shared URL normalization so
  pasted user-info URLs are not stored or matched as bare origins.
- Scoped extension host permissions to HTTP and HTTPS pages instead of the
  all-schemes wildcard.
- Guarded popup active-tab lookup before reading background tab state or
  messaging content scripts.
- Guarded blocked-page current-tab lookups before unlisting a site or showing
  the unblock countdown modal.
- Moved the blocked-page return redirect into the guarded unlist path.
- Routed background add and unblock tab-state writes through the centralized
  valid-tab-id helper.
- Removed the popup's duplicate block-list storage write so background
  `addBlockedSite` remains the single persistence owner.
- Normalized content-script redirect message payloads before constructing
  `blockedSite.html` URLs.
- Added valid-tab-id guards around background blocking state and removed tab
  state when Chrome reports a tab has closed.
- Extended the source baseline and README notes to guard per-tab state cleanup.

## 2026-06-08

- Added `make check` as the root wrapper for the extension source baseline and
  URL-rule tests.
- Reset the blocked-page unblock countdown interval before restarting it and
  after the modal closes.
- Restored README verification notes for the URL-rule test and extension
  source baseline after the generated project overview refresh.
- Added exact-origin URL rule utilities and Node coverage for normalization,
  deduplication, redirect-parameter parsing, and lookalike-host safety.
- Replaced user-controlled regular expression matching with normalized HTTP(S)
  origin comparison in the background request blocker.
- Encoded blocked-site redirect parameters, validated decoded origins on the
  blocked page, and removed extension script logging of tab and block-list state.
- Added README guidance, a source baseline check, and a plan for the Manifest V2
  URL matching baseline.
