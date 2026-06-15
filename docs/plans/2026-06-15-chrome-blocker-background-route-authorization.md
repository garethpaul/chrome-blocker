# Chrome Blocker Background Route Authorization

Status: Planned

## Problem

The background listener verifies that messages come from this extension, but
then permits every extension page to invoke every background action. The
blocked page can therefore call popup-only read/add/clear routes, and the popup
can bypass the blocked-page countdown by calling the unlist mutation directly.

## Requirements

1. Accept get-state, add-site, and clear-list actions only from this extension's
   exact `popup.html` URL.
2. Accept unlist mutations only from this extension's exact
   `blockedSite.html` page with its blocked-origin query.
3. Reject missing, foreign-extension, web, sibling-page, suffix-lookalike, and
   wrong-route senders before mutation or response work.
4. Preserve tab ID validation, URL normalization, serialized storage writes,
   acknowledgements, and blocked-page countdown behavior.
5. Add mutation-sensitive source, VM test, documentation, and completed-plan
   contracts to the portable baseline.

## Scope Boundaries

- Do not change block-list persistence, tab-state ownership, URL
  normalization, manifest permissions, HTML, CSS, dependencies, or storage
  shape.
- Do not weaken the popup-to-blocked-page sender guard or same-tab/same-origin
  countdown checks.
- Do not claim unpacked-extension browser execution from Node VM tests.
- Do not merge or close stacked pull requests without explicit authorization.

## Verification

- `sh -n scripts/check-baseline.sh`
- focused background, popup, blocked-page, and URL-rule VM tests
- repository and external-directory `make check`
- hostile sender-route, exact-URL, ordering, guidance, and completed-plan
  mutations
- exact-diff, generated-artifact, credential-pattern, conflict-marker, and
  whitespace audits
