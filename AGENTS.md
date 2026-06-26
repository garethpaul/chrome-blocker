# AGENTS.md

## Repository purpose

`garethpaul/chrome-blocker` is a static web project. Block websites to focus on work

## Project structure

- `Makefile` - repository verification targets
- `scripts` - baseline checks and helper scripts
- `docs` - plans, notes, and generated README assets
- `bootstrap` - repository source or sample assets
- `js` - repository source or sample assets

## Development commands

- Install dependencies: no repository-specific install command is documented.
- Full baseline: `make check`
- Combined verification: `make verify`
- Lint/static checks: `make lint`
- Tests: `make test`
- Build: `make build`
- If a command above skips because a platform toolchain is missing, verify on a machine with that SDK before claiming platform behavior is tested.

## Coding conventions

- Language mix noted in the README: JavaScript (8), shell (1).

## Testing guidance

- Test-related files detected: `scripts/test-url-rules.js`
- Start with the narrowest relevant test or Make target, then run `make check` before handing off if the change is not documentation-only.
- Keep README verification notes in sync when commands, fixtures, or supported toolchains change.

## PR / change guidance

- Keep diffs focused on the requested repository and avoid unrelated modernization or formatting churn.
- Preserve public APIs, sample behavior, file formats, and documented environment variables unless the task explicitly changes them.
- Update tests, README notes, or docs/plans when behavior, security posture, or validation commands change.
- Call out skipped platform validation, legacy toolchain assumptions, and any risky files touched in the final summary.

## Safety and gotchas

- Blocked-page unlist mutations require exact blocked-origin and sender-tab ownership.
- Blocked-page unlist mutations also require the sender tab's current blocked-origin state to match the requested origin.
- Blocked-page unlist mutations require a reserved top-level redirect and the exact committed document ID; subframes, stale documents, and replacement navigations fail closed.
- Reloading the canonical blocked page preserves its blocked origin while replacing the authorized document ID.
- Tab replacement clears the replaced tab's committed and pending ownership without copying its blocked origin or document ID into the replacing tab.
- Allowed navigation requests clear only pending redirect state; committed blocked-page ownership remains until a new top-level document commits.

- Detected references to Twitter. Keep API keys, OAuth credentials, tokens, and account-specific values in local configuration only.
- The blocked-page unblock countdown clears any prior interval before starting a new timer and resets interval state when the modal closes.
- Popup-to-blocked-page unlist requests are typed and must match both the current numeric tab id and normalized blocked origin.
- Background tab blocking state is removed when tabs close and ignores invalid non-tab navigation ids.
- The content-script redirect messages are normalized before constructing `blockedSite.html` URLs.
- The background context owns block-list storage writes; popup and blocked-site
  pages use validated same-extension runtime messages instead of direct global
  object access.
- Startup hydration must replay queued block-list mutations only after the loaded
  snapshot is installed, and must drop the queue on storage failure.
- The background add and unblock paths use centralized tab state writes so invalid tab ids cannot create stray per-tab entries.
- Chrome Blocker accepts only finite integer tab IDs at runtime boundaries.
- Only the exact popup extension page may start the blocked-page unlist countdown.
- Popup routes and blocked-page unlist routes use separate exact sender authorization.
- Content-script URL reads and redirects require exact popup sender and current-document origin ownership.

## Agent workflow

1. Inspect the README, Makefile, manifests, and the files directly related to the request.
2. Make the smallest source or docs change that satisfies the task; avoid generated, vendored, or local-environment files unless required.
3. Run the narrowest useful validation first, then `make check` or the documented package/platform gate when available.
4. If a required SDK, service credential, or external runtime is unavailable, record the skipped command and why.
5. Summarize changed files, commands run, and remaining risks or follow-up validation.
