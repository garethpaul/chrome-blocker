# Chrome Blocker Browser Verification Matrix

Use this matrix only for an exact implementation commit. Record the commit SHA and pull request
before testing so popup, storage, navigation, and tab-state evidence cannot be
transferred to a different extension implementation.

## Evidence Rules

- Use synthetic hosts such as `example.test` and `blocked.example.test`; do not
  enter personal, employer, customer, authentication, or private-network URLs.
- Record the Chrome version, manifest support state, profile class, incognito
  access state, result, and sanitized evidence identifier.
- Do not include browsing history, profile paths, account data, cookies,
  tokens, unrelated tabs, extension archives, or raw local storage exports.
- Store durable evidence outside git. Link only a sanitized run, screenshot, or
  short log excerpt by stable identifier.
- Record each result as `pass`, `fail`, `blocked`, or `not run`, with an owner
  and follow-up for every result other than `pass`.
- Do not convert `not run` into passing evidence.

## Run Identity

| Field | Value |
| --- | --- |
| Commit SHA | `not run` |
| Pull request | `not run` |
| Chrome version | `not run` |
| Manifest V2 support state | `not run` |
| Normal or test profile | `not run` |
| Incognito access state | `not run` |
| Synthetic host set | `not run` |
| Evidence location | `not run` |

## Verification Matrix

| Scenario | Expected evidence | Result | Evidence |
| --- | --- | --- | --- |
| Load unpacked extension | Chrome accepts the exact-head repository or records a Manifest V2 support blocker. | `not run` | `not run` |
| Empty startup hydration | The popup and navigation listener remain closed until storage hydration completes. | `not run` | `not run` |
| Popup add site | Adding a synthetic host persists one normalized, deduplicated rule after acknowledgement. | `not run` | `not run` |
| Blocked navigation | A blocked main-frame HTTP(S) navigation reserves ownership, redirects to the extension page, and exposes blocked state only after the top-level blocked document commits. | `not run` | `not run` |
| Blocked-page unlist | Unlisting requires the current finite integer tab, frame 0, exact committed document ID, and matching blocked origin before resuming the original synthetic URL after acknowledgement. | `not run` | `not run` |
| Embedded blocked page | A blocked page loaded as a child frame cannot start the countdown or authorize an unlist mutation. | `not run` | `not run` |
| Replacement navigation | Replacing or navigating away from the committed blocked document invalidates its unlist authority. | `not run` | `not run` |
| Popup remove site | Removing a rule persists before the popup reports success and later navigation remains allowed. | `not run` | `not run` |
| Clear block list | Clear persists an empty list and removes per-tab block state without stale redirects. | `not run` | `not run` |
| Storage mutation failure | Failed persistence reports failure and does not present an uncommitted mutation as successful. | `not run` | `not run` |
| Extension reload | Reload rehydrates persisted rules without replaying stale queued mutations. | `not run` | `not run` |
| Multiple tabs | Blocking and unlisting remain scoped to their finite integer tab IDs. | `not run` | `not run` |
| Closed tab cleanup | Closing a tab removes its per-tab state without affecting other tabs. | `not run` | `not run` |
| Split-incognito flow | With explicit incognito access, normal and incognito behavior follow Chrome storage/profile rules without cross-tab leakage. | `not run` | `not run` |

## Current Status

No unpacked extension, popup, live navigation, Chrome storage, normal-profile,
or split-incognito scenario was executed for this checklist. Treat every Chrome, popup, navigation, storage, tab, and incognito row as unexecuted
until evidence is attached to the exact commit.
