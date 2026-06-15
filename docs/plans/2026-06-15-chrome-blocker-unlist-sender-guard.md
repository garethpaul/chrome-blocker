# Chrome Blocker Unlist Sender Guard

Status: In Progress

## Problem

The blocked page validates the unlist action, tab ID, and normalized blocked
origin, but it does not validate the runtime message sender. The popup is the
only intended initiator, so other extension contexts should not be able to
start the unlist countdown by constructing the same message.

## Requirements

1. Accept `beginUnlist` only from this extension's exact `popup.html` URL.
2. Reject missing, content-script, background-page, sibling-page, and URL
   prefix-lookalike senders before opening the modal or starting a timer.
3. Preserve the existing same-tab, same-origin message validation and
   countdown behavior for the popup.
4. Add mutation-sensitive source, test, documentation, and completed-plan
   contracts to the portable baseline.

## Scope Boundaries

- Do not change block-list persistence, tab-state ownership, URL
  normalization, manifest permissions, HTML, CSS, dependencies, or storage
  shape.
- Do not weaken the popup's existing tab and origin checks.
- Do not claim unpacked-extension browser execution from Node VM tests.
- Do not merge or close stacked pull requests without explicit authorization.

## Verification

- Pending implementation and focused VM tests.
- Pending repository-root and external-directory `make check`.
- Pending hostile mutation and final diff, artifact, and secret audits.
