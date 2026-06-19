# Chrome Blocker Blocked-Document Ownership

Status: Completed

## Problem

The reviewed stack recorded a tab's blocked origin as soon as a popup mutation or
HTTP(S) interception requested a redirect. The blocked-page unlist route then
accepted any same-extension blocked-page sender whose URL, tab ID, and origin
matched that state. A redirect failure, non-HTTP navigation, embedded
web-accessible blocked page, or replacement document could therefore retain or
reuse authorization that belonged to a different document.

## Design

- Keep a pending per-tab redirect reservation separate from committed blocked
  state.
- Promote a reservation only when the exact blocked-page URL commits in frame 0.
- Bind committed state to Chrome's `documentId` and require the sender's exact
  tab, top-level frame, document ID, and blocked origin for unlisting.
- Clear committed and pending state on unrelated top-level navigation, tab
  removal, global clear, and matching global unlist.
- Reject fractional, infinite, and negative tab IDs in popup and blocked-page
  helpers as well as the background.
- Refuse to start blocked-page UI inside an embedded frame.

## Evidence

- RED reproduced premature state visibility before redirect commit, subframe and
  replacement-document acceptance, pending cross-tab state surviving global
  unlist, embedded blocked-page countdown initiation, and non-integer UI tab IDs.
- Real-script Node VM suites cover successful exact-document unlisting and the
  hostile lifecycle cases above.
- `make check` passed at repository root and through the absolute Makefile path
  from an external directory.
- Isolated hostile mutations to the reservation, frame, document, navigation,
  pending cleanup, top-level page, and finite-ID guards were rejected.
- Hosted exact-head and post-merge evidence is recorded in the pull request.

## Residual Risk

No Chrome Web Store deployment, normal-profile or split-incognito live flow, or
physical browser UI interaction is claimed. `documentId` requires Chrome 106 or
newer; older browsers fail closed for unlisting. Manifest V2 availability remains
browser-policy dependent.
