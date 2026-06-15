# Chrome Blocker Changes

## 2026-06-15

- Only the exact popup extension page may start the blocked-page unlist countdown.

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
