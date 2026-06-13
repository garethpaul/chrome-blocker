---
title: Chrome Blocker Unlist Message Contract
type: fix
date: 2026-06-13
status: completed
---

# Chrome Blocker Unlist Message Contract

## Summary

Replace the blocked page's ambiguous numeric runtime message with a typed
unlist request that identifies both the active tab and the normalized blocked
origin before the countdown can begin.

## Problem Frame

The popup currently broadcasts only a numeric tab id. The blocked page starts
its destructive unlist countdown whenever any runtime message loosely equals
its current tab id, so an unrelated extension message with the same primitive
value can trigger the flow. The message also carries no origin for the blocked
page to compare with its own validated query parameter.

## Requirements

- R1. The popup must send a structured `beginUnlist` request containing a
  numeric tab id and the normalized blocked origin.
- R2. The blocked page must reject primitive, missing, malformed, wrong-action,
  wrong-tab, and wrong-origin messages without showing the modal or starting a
  timer.
- R3. A valid request must match both the blocked page's current tab id and its
  normalized origin before the countdown begins.
- R4. Existing countdown cancellation, background-owned unlisting, and guarded
  redirect behavior must remain unchanged.
- R5. Executable behavior tests and the static baseline must enforce the new
  message boundary and remain part of `make test` and `make check`.

## Key Technical Decisions

- **Use an explicit action object:** Send `{action, tabId, blockedSite}` rather
  than assigning meaning to a bare number in the shared runtime channel.
- **Validate at the receiving boundary:** Normalize the request's origin on the
  blocked page and compare it with the already validated page origin.
- **Keep background ownership unchanged:** The countdown continues to call the
  background page only after validation and expiration; this change does not
  add a second block-list writer.
- **Test the real script in a VM:** Load `blockedSite.js` with small Chrome,
  jQuery, timer, and location fakes so rejected and accepted messages exercise
  the production listener.

## Implementation Units

### U1. Emit A Typed Unlist Request

- **Files:** `js/popup.js`
- **Goal:** Validate the popup's blocked origin and send the structured action
  with the active numeric tab id.
- **Covers:** R1

### U2. Validate The Blocked-Page Message

- **Files:** `js/blockedSite.js`
- **Goal:** Require the expected action, tab id, and matching normalized origin
  before showing the modal or starting the countdown.
- **Covers:** R2, R3, R4

### U3. Add Behavior And Static Contracts

- **Files:** `scripts/test-blocked-site.js`, `scripts/check-baseline.sh`,
  `Makefile`, `README.md`, `CHANGES.md`, `VISION.md`, `AGENTS.md`
- **Goal:** Exercise hostile message shapes and a valid request, wire the test
  into repository gates, and document the runtime-channel boundary.
- **Covers:** R5

## Verification

- Run `node scripts/test-blocked-site.js`, `make test`, and `make check`.
- Run the absolute-path `make check` wrapper from outside the repository.
- Run shell syntax, whitespace, and explicit secret/artifact scans.
- Apply isolated mutations for raw numeric acceptance, action omission,
  wrong-tab acceptance, wrong-origin acceptance, popup payload regression, and
  missing test wiring; each mutation must fail the relevant gate.
- Use `agent-browser` only if installed; otherwise record that interactive
  unpacked-extension behavior was not automated locally.

## Verification Results

- `node scripts/test-blocked-site.js` passed with rejected primitive,
  malformed, wrong-action, wrong-tab, credential-bearing, and wrong-origin
  messages plus accepted normalized same-origin requests.
- `make test`, `make check`, and the absolute-path `make check` wrapper from
  `/tmp` passed.
- `sh -n`, Node syntax checks, whitespace validation, and explicit
  secret/artifact scans passed.
- Six isolated hostile mutations covering raw numeric acceptance, omitted
  action validation, omitted tab validation, omitted origin validation, popup
  action drift, and removed test wiring were each rejected.
- `agent-browser` was not installed, so no interactive unpacked-extension
  browser claim is made.

## Prioritized Follow-Ups

1. Close the asynchronous startup interval before persisted block-list loading
   completes.
2. Plan a Manifest V3 migration that replaces background-page coupling and the
   blocking web-request architecture without weakening block enforcement.

## Risks

- Popup and blocked-page scripts must deploy together because the accepted
  message shape changes atomically inside the extension package.
- VM tests verify the listener contract but cannot prove Chrome's rendered
  modal styling or extension-page integration.
