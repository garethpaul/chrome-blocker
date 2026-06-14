# Decouple Extension Pages From the Background Page

Status: In Progress

## Context

The popup and blocked-site page call `chrome.extension.getBackgroundPage()` to
read and mutate background state. Manifest V3 replaces persistent background
pages with service workers, where that API and shared global-object access are
not available. Chrome also requires a separate declarative-network migration
for the extension's blocking `webRequest` listener.

This stage removes the direct background-page dependency while preserving the
current Manifest V2 request interception and fail-closed hydration behavior.

## Requirements

- R1. Expose add, unlist, clear, and tab-state operations through one validated
  `chrome.runtime.onMessage` contract.
- R2. Reject malformed actions, origins, and tab identifiers without changing
  storage or tab state.
- R3. Migrate popup and blocked-site callers away from
  `chrome.extension.getBackgroundPage()`.
- R4. Preserve current block-list hydration ordering, redirect behavior, and
  global unlist semantics.
- R5. Add behavior and static contracts that fail if direct background-page
  access or unvalidated messages return.

## Implementation Units

### 1. Background message boundary

Files:

- `js/background.js`
- `scripts/test-background.js`

Register a narrow runtime listener and route accepted operations through the
existing normalized mutation and tab-state helpers.

### 2. Extension-page callers

Files:

- `js/popup.js`
- `js/blockedSite.js`
- `scripts/test-blocked-site.js`

Use runtime messages for state reads and mutations while retaining current UI
and countdown behavior.

### 3. Contracts and guidance

Files:

- `scripts/check-baseline.sh`
- `README.md`
- `SECURITY.md`
- `VISION.md`
- `CHANGES.md`

Record the service-worker compatibility boundary and reject legacy direct
background-page calls.

## Verification

Verification: Pending

- Run the real-script Node behavior suites and full `make check`.
- Run syntax, whitespace, diff, generated-artifact, and secret audits.
- Run focused hostile mutations against message validation and the direct-call
  prohibition.

## Scope Boundaries

- Do not change Manifest V2, host permissions, or blocking `webRequest` in this
  stage.
- Do not claim the extension is Manifest V3 compatible until interception is
  migrated to `declarativeNetRequest` and service-worker lifecycle behavior is
  tested.
- Do not weaken fail-closed startup behavior or URL-origin normalization.
