# Chrome Blocker Changes

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
