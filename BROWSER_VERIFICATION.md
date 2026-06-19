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
| Commit SHA | `49c1f6685c4eb12fb4a7ec0591f3353dafff4056` |
| Pull request | `#16` |
| Chrome version | `Chromium 133.0.0.0` |
| Manifest V2 support state | Loaded unpacked successfully in Chromium 133 |
| Normal or test profile | Fresh isolated Playwright persistent test profile |
| Incognito access state | `not run` |
| Synthetic host set | Ephemeral loopback `127.0.0.1` and `localhost` origins |
| Evidence location | Sanitized local run `local-chromium133-20260619-1` |

## Verification Matrix

| Scenario | Expected evidence | Result | Evidence |
| --- | --- | --- | --- |
| Load unpacked extension | Chrome accepts the exact-head repository or records a Manifest V2 support blocker. | `pass` | Chromium 133 loaded the exact runtime commit and exposed its generated background page. |
| Empty startup hydration | The popup and navigation listener remain closed until storage hydration completes. | `not run` | `not run` |
| Popup add site | Adding a synthetic host persists one normalized, deduplicated rule after acknowledgement. | `not run` | `not run` |
| Blocked navigation | A blocked main-frame HTTP(S) navigation reserves ownership, redirects to the extension page, and exposes blocked state only after the top-level blocked document commits. | `pass` | State remained `0` before reload, then matched the loopback origin with Chrome document ID `36CCE61459E25FCA381585D64EF3000C` after commit. |
| Blocked-page unlist | Unlisting requires the current finite integer tab, frame 0, exact committed document ID, and matching blocked origin before resuming the original synthetic URL after acknowledgement. | `pass` | An exact popup message started the top-level countdown; forced expiry received persistence acknowledgement, returned to the synthetic origin, and cleared state/storage. |
| Embedded blocked page | A blocked page loaded as a child frame cannot start the countdown or authorize an unlist mutation. | `pass` | A web page embedded the web-accessible blocked page and an exact popup message left its interval at `0`. |
| Replacement navigation | Replacing or navigating away from the committed blocked document invalidates its unlist authority. | `not run` | `not run` |
| Popup remove site | Removing a rule persists before the popup reports success and later navigation remains allowed. | `not run` | `not run` |
| Clear block list | Clear persists an empty list and removes per-tab block state without stale redirects. | `not run` | `not run` |
| Storage mutation failure | Failed persistence reports failure and does not present an uncommitted mutation as successful. | `not run` | `not run` |
| Extension reload | Reload rehydrates persisted rules without replaying stale queued mutations. | `not run` | `not run` |
| Multiple tabs | Blocking and unlisting remain scoped to their finite integer tab IDs. | `not run` | `not run` |
| Closed tab cleanup | Closing a tab removes its per-tab state without affecting other tabs. | `not run` | `not run` |
| Split-incognito flow | With explicit incognito access, normal and incognito behavior follow Chrome storage/profile rules without cross-tab leakage. | `not run` | `not run` |

## Current Status

The four rows marked `pass` were executed against exact runtime commit
`49c1f6685c4eb12fb4a7ec0591f3353dafff4056` in a fresh Chromium 133 profile.
All other rows remain unexecuted, including real popup-button interaction,
storage failure, extension reload, multi-tab blocking, closed-tab cleanup, and
split-incognito behavior. Google Chrome 149 was not used because branded Chrome
rejects command-line unpacked-extension flags; Chromium 121 also crashed on the
host macOS before extension startup.
