# Chrome Blocker Content Message Ownership

Status: Completed

## Problem

The content-script message listener accepts `geturl` and `redirect` requests
without authenticating the sender. The popup is the intended caller, but any
same-extension context that can address a tab can currently read its URL or
redirect it to the blocked-page flow.

The popup also persists a blocked origin before sending the redirect message.
If the tab navigates while that asynchronous mutation is in flight, the old
callback can redirect the newly loaded, unrelated document because the content
script validates the requested origin but does not compare it with the current
document origin.

## Priority

1. Bind content-script messages to the exact popup extension page and the
   current document origin. This closes an active message-boundary and stale
   navigation race in the current Manifest V2 runtime.
2. Preserve the existing background route, storage serialization, blocked-page
   ownership, and popup acknowledgement contracts.
3. Defer broader Manifest V3 and `declarativeNetRequest` migration because it is
   architectural work and does not replace this current-runtime boundary.

## Requirements

- Reject content-script messages unless `sender.id` matches the extension and
  `sender.url` is exactly the popup page URL.
- Continue returning the current document URL for an authorized `geturl`
  request.
- Redirect only when the authorized request carries a valid normalized origin
  equal to the receiving document's current normalized origin.
- Reject malformed messages, unauthorized senders, and stale-origin redirects
  without returning URL data or changing `window.location`.
- Add real-script VM tests and mutation-sensitive portable contracts.
- Keep dependencies, permissions, manifest version, storage behavior,
  background routing, and blocked-page behavior unchanged.

## Implementation Units

### 1. Content-script authorization and origin ownership

Files:

- `js/contentScript.js`

Add a small exact-popup sender predicate before action dispatch. Require current
document-origin ownership before constructing the blocked-page redirect.

### 2. Executable regressions

Files:

- `scripts/test-content-script.js`
- `Makefile`

Run the real URL-rule and content-script sources in a Node VM. Cover authorized
URL reads and redirects, unauthorized sender variants, malformed payloads, and
the stale-navigation race where the current document no longer matches the
persisted origin.

### 3. Portable contracts and guidance

Files:

- `scripts/check-baseline.sh`
- `AGENTS.md`
- `README.md`
- `SECURITY.md`
- `VISION.md`
- `CHANGES.md`

Require the source guard, ordering, focused test fixtures, maintained guidance,
and completed plan evidence without weakening existing contracts.

## Verification Plan

- Demonstrate the stale-origin redirect in the real-script VM test before the
  source fix, then pass the focused content-script suite after implementation.
- Run JavaScript and POSIX-shell syntax checks, the repository-root full gate,
  and the complete gate from an external working directory.
- Run isolated hostile mutations against sender authorization, current-origin
  ownership, test fixtures, documentation, and completed plan evidence.
- Audit the exact diff, generated artifacts, dependency and permission drift,
  whitespace, conflict markers, and added credential-shaped values.
- Record local/upstream identity, PR state, and one bounded exact-head hosted
  snapshot after pushing.

## Scope Boundaries

- Do not migrate to Manifest V3 or replace blocking `webRequest`.
- Do not change the block-list data model, storage keys, URL normalization, or
  popup/background message schemas.
- Do not add dependencies or broaden host permissions.
- Do not claim unpacked-extension browser execution; the automated evidence is
  the real-script VM contract.

## Work Completed

- Added exact popup sender authorization before content-script action dispatch.
- Required redirect requests to retain ownership of the receiving document's
  current normalized origin.
- Added a real-script content VM suite and wired it into the complete test gate.
- Added mutation-sensitive portable contracts and synchronized maintained
  guidance.

## Verification Completed

- The focused test first reproduced an unauthorized sender reading the current
  document URL before the source guard was added.
- The focused content-script suite then passed authorized URL reads and
  redirects while rejecting unauthorized senders, malformed origins, and the
  stale-navigation race.
- `make test` passed all five real-script suites: URL rules, content script,
  background, blocked page, and popup.
- JavaScript syntax checks passed for the changed source and test, and `sh -n`
  passed for the portable baseline checker.
- Repository-root `make check` passed the baseline and all five real-script
  suites.
- The complete `make check` gate also passed from `/tmp` through the absolute
  Makefile path.
- Five isolated hostile mutations were rejected for popup sender authorization,
  current-document origin ownership, wrong-extension fixtures, maintained
  guidance, and completed plan evidence.
- Final audits and hosted exact-head state are recorded by the shipping evidence
  for this branch.
