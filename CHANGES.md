# Chrome Blocker Changes

## 2026-06-09

- Guarded blocked-page current-tab lookups before unlisting a site or showing
  the unblock countdown modal.
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
