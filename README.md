# chrome-blocker

<!-- README-OVERVIEW-IMAGE -->
![Project overview](docs/readme-overview.svg)

## Overview

`garethpaul/chrome-blocker` is a static web project. Block websites to focus on work

This README is based on the checked-in source, manifests, scripts, and repository metadata on the `master` branch. The project language mix found during review was: JavaScript (8), shell (1).

## Repository Contents

- `README.md` - project overview and local usage notes
- `bootstrap` - source or example code
- `docs` - source or example code
- `js` - source or example code
- `scripts` - source or example code
- `SECURITY.md` - security reporting and disclosure guidance
- `VISION.md` - project direction and maintenance guardrails

Additional scan context:

- Source directories: bootstrap, docs, js, scripts
- Dependency and build manifests: none detected
- Entry points or build surfaces: none detected
- Test-looking files: scripts/test-url-rules.js

## Getting Started

### Prerequisites

- Git

### Setup

```bash
git clone https://github.com/garethpaul/chrome-blocker.git
cd chrome-blocker
```

The setup commands above are derived from repository files. Legacy mobile, Python, or JavaScript samples may require older SDKs or package versions than a modern workstation uses by default.

## Running or Using the Project

Load the extension unpacked from this directory:

1. Open `chrome://extensions`.
2. Enable developer mode.
3. Choose "Load unpacked" and select this repository root.

## Testing and Verification

Trusted local convenience commands:

```sh
make check
scripts/check-baseline.sh
node scripts/test-url-rules.js
node scripts/test-background.js
node scripts/test-blocked-site.js
node scripts/test-popup.js
```

The URL-rule baseline verifies normalized HTTP(S) origin matching, rejected
lookalike hosts, rejected credential-bearing blocker URLs, block-list
deduplication, encoded redirect parameters for `blockedSite.html`, and scoped
manifest host permissions.
The background behavior test executes the real request listener with mocked
Chrome APIs and covers deferred and failed storage hydration, invalid tab ids,
subframes, blocked redirects, allowed navigation, and tab state updates.
The blocked-page behavior test executes the real runtime listener with mocked
Chrome and DOM APIs and covers rejected unlist messages plus the accepted
same-tab, same-origin request.
Only the exact popup extension page may start the blocked-page unlist countdown.
Popup routes and blocked-page unlist routes use separate exact sender authorization.
Blocked-page unlist mutations require exact blocked-origin and sender-tab ownership.
Blocked-page unlist mutations also require the sender tab's current blocked-origin state to match the requested origin.
Blocked-page unlist mutations require a reserved top-level redirect and the exact committed document ID; subframes, stale documents, and replacement navigations fail closed.
The popup behavior test executes the real popup script with mocked Chrome and
DOM APIs and covers background state lookup, add, clear, unlist, and redirect
messages.
The path-safe verification entry point is a direct process invocation whose
executable and first argument are `/usr/bin/env` and `-i`.
Supply absolute Node, launcher, and repository paths as separate OS argv values:

```sh
/usr/bin/env -i HOME=/nonexistent LANG=C LC_ALL=C PATH=/usr/bin:/bin TMPDIR=/tmp TZ=UTC \
  /absolute/path/to/node \
  /absolute/path/to/chrome-blocker/scripts/run-make.js \
  /absolute/path/to/chrome-blocker check
```

The command above requires a trusted pre-exec environment. The caller process,
operating-system user account, dynamic loader environment (including
`LD_PRELOAD` and `DYLD_*`), and absolute `/usr/bin/env` and Node executables must
already be trusted because they can execute or redirect code before application
sanitization begins. If a shell discovers or interpolates the absolute paths,
that shell is trusted too. This interface does not claim to defend against
same-privilege pre-exec loader, executable-replacement, or parent-process
injection.

Within that trust boundary, `/usr/bin/env -i` gives the Node launcher a fixed
post-start environment, and repository paths and targets remain separate opaque
OS argv values rather than Make or shell source. The Node launcher then
receives the repository and target through OS argv before Make parsing,
validates the exact Chrome Blocker marker and manifest identity, clears Make
control environment channels, requires a clean Git checkout, and archives the
exact tracked `HEAD` tree into a private temporary directory before invoking
only fixed internal targets. The source checkout is checked again after the
snapshot, and execution fails closed if its directory identity, `HEAD`, index,
or worktree changes during the copy. Make and every gate run only inside the
validated snapshot rather than reopening the caller pathname. Git subprocesses
use the selected checkout's pinned metadata path, an isolated home/config,
disabled fsmonitor, hooks, and clean/process filters, plus a minimal environment
that does not inherit repository, object, index, config, lock, discovery, or
trace channels. Git, Tar, Make, Node, and the baseline shell are resolved to
canonical executable files from a fixed system-tool search list before the
repository argument is processed; their file identities and execute bits are
checked again immediately before use, and child processes receive a fixed
`/usr/bin:/bin` path instead of caller `PATH`. No `npm` process is used. It
preserves spaces, newlines, dollar signs, quotes, backslashes, and shell
metacharacters in repository paths as opaque process arguments. Symlink inputs
resolve to the selected checkout.

Plain `make check`, `scripts/check`, and direct `node scripts/run-make.js` remain
conveniences for trusted local environments only and are not the path-safe
automation interface. Raw Make flags,
assignments, external `-f` files, and extra targets are not part of the
hostile-input interface; GNU Make 3.81 can evaluate Make syntax embedded in
external `-f` path data before any repository recipe or Node guard runs.

GitHub Actions runs the hostile-path launcher regression and the direct
clean-child command on
Node 20, 22, and 24 for pushes, pull requests, and manual dispatches. The
workflow uses commit-pinned actions,
read-only repository access, and a bounded runtime.
It also clears common loader and Node variables as defense-in-depth hygiene;
that does not create a security boundary against code that executes before the
workflow shell or `/usr/bin/env` starts.
The job does not persist checkout credentials after source retrieval.

Use [`BROWSER_VERIFICATION.md`](BROWSER_VERIFICATION.md) to record exact-head
unpacked-extension evidence. Keep unavailable Chrome scenarios as explicit unexecuted rows
rather than treating Node VM or static checks as installed browser execution.

When the required SDK or runtime is unavailable, use static checks and source review first, then verify on a machine that has the matching platform toolchain.

## Configuration and Secrets

- Detected references to Twitter. Keep API keys, OAuth credentials, tokens, and account-specific values in local configuration only.

## Security and Privacy Notes

- Review changes touching authentication or token handling; examples from the scan include bootstrap/css/bootstrap.min.css.
- Review changes touching external API calls or credential-adjacent configuration; examples from the scan include bootstrap/css/bootstrap.min.css, bootstrap/js/bootstrap.min.js.
- Review changes touching network requests, sockets, or service endpoints; examples from the scan include bootstrap/css/bootstrap.min.css, bootstrap/js/bootstrap.min.js, scripts/test-url-rules.js.
- Review changes touching file, media, JSON, XML, CSV, OCR, or data parsing; examples from the scan include bootstrap/css/bootstrap.min.css, docs/plans/2026-06-08-chrome-blocker-url-baseline.md, js/jquery-1.8.2.min.js, scripts/check-baseline.sh.
- Review changes touching shell execution, subprocess, or dynamic evaluation; examples from the scan include js/jquery-1.8.2.min.js, js/urlRules.js.
- Review changes touching database, model, or persistence code; examples from the scan include docs/plans/2026-06-08-chrome-blocker-url-baseline.md.

## Maintenance Notes

- The blocked-page unblock countdown clears any prior interval before starting
  a new timer and resets interval state when the modal closes.
- Background tab blocking state is removed when tabs close and ignores invalid
  non-tab navigation ids.
- Non-tab main-frame requests are ignored before URL matching or redirect
  construction, keeping blocking behavior scoped to real browser tabs.
- The background page cancels valid main-frame navigation until local block-list hydration succeeds;
  storage read failures remain closed, and canceled URLs are neither logged nor
  retained for replay.
- Successful startup hydration must replay queued block-list mutations after the
  loaded snapshot is installed; failed hydration drops queued actions while
  navigation remains fail closed.
- The content-script redirect messages are normalized before constructing
  `blockedSite.html` URLs.
- Content-script URL reads and redirects require exact popup sender and current-document origin ownership.
- The background context owns block-list storage writes; the popup delegates new
  blocked origins instead of writing the same list twice.
- Background block-list mutations are serialized and acknowledged only after
  storage persistence succeeds.
- Popup and blocked-site pages use validated same-extension runtime messages
  instead of direct access to the background page's global object.
- The background add and unblock paths use centralized tab state writes so
  invalid tab ids cannot create stray per-tab entries.
- Chrome Blocker accepts only finite integer tab IDs at runtime boundaries.
- Background navigation and removal paths use centralized tab state helpers;
  tab replacement clears only the replaced tab's ownership and preserves state
  already committed for the replacing tab instead of transferring document authority.
- A tab becomes blocked state only after the reserved blocked-page redirect commits
  in the top-level frame; unrelated top-level commits clear pending and committed ownership.
- Reloading the canonical blocked page preserves its blocked origin while replacing the authorized document ID.
- Starting an allowed navigation clears only pending redirect state; the visible blocked page keeps unlist authority until another top-level document commits.
- A global unlisting clears matching state across every tracked tab while
  preserving tabs blocked by other origins.
- The blocked page validates the current tab before unlisting a site or showing
  the unblock countdown.
- Popup unlist requests use a typed runtime message, and the blocked page
  requires a matching numeric tab id and normalized blocked origin before the
  countdown can begin.
- The blocked page redirects back only after the guarded unlist path runs.
- The popup validates the active tab id before messaging content scripts or
  reading background tab state.
- Host permissions are scoped to HTTP(S) pages to match the URL matcher and
  content-script coverage.
- URL normalization rejects credential-bearing blocker URLs before storing,
  matching, or decoding redirected block origins.
- See `SECURITY.md` for vulnerability reporting and safe research guidance.
- See `VISION.md` for project direction and contribution guardrails.
- See `CHANGES.md` for the maintenance history.
- See `docs/plans/2026-06-08-chrome-blocker-check-wrapper.md` for the root
  verification wrapper baseline.
- See `docs/plans/2026-06-09-chrome-blocker-content-redirect-validation.md`
  for the content-script redirect validation baseline.
- See `docs/plans/2026-06-09-chrome-blocker-background-tab-state-writes.md`
  for the background tab-state write baseline.
- See `docs/plans/2026-06-09-chrome-blocker-blocked-page-tab-guard.md` for the
  blocked-page current-tab guard.
- See `docs/plans/2026-06-09-chrome-blocker-blocked-page-redirect-guard.md` for
  the blocked-page redirect guard.
- See `docs/plans/2026-06-09-chrome-blocker-popup-tab-guard.md` for the popup
  current-tab guard.
- See `docs/plans/2026-06-09-chrome-blocker-http-host-permissions.md` for the
  scoped host-permission baseline.
- See `docs/plans/2026-06-09-chrome-blocker-credential-url-guard.md` for the
  credential-bearing blocker URL guard.
- See `docs/plans/2026-06-10-ci-baseline.md` for the hosted GitHub Actions
  baseline.
- See `docs/plans/2026-06-13-chrome-blocker-global-unlist-state.md` for the
  origin-wide tab cleanup boundary.
- See `docs/plans/2026-06-13-chrome-blocker-unlist-message-contract.md` for the
  typed popup-to-blocked-page unlist request boundary.
- See `docs/plans/2026-06-10-chrome-blocker-non-tab-request-guard.md` for the
  background interception boundary and executable listener test.
- See `docs/plans/2026-06-13-chrome-blocker-startup-hydration-gate.md` for the
  fail-closed background startup boundary.
- A Manifest V3 migration remains separate work because it requires replacing
  blocking `webRequest` behavior and the persistent background lifecycle, not just
  changing the manifest version.

## Contributing

Keep changes small and tied to the project that is already present in this repository. For code changes, document the toolchain used, avoid committing generated dependency directories or local configuration, and update this README when setup or verification steps change.
