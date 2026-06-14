# Chrome Blocker Browser Verification Matrix

Status: In Progress

## Problem

Node VM tests cover URL rules, background hydration, runtime message boundaries,
mutation acknowledgements, and finite integer tab IDs. The repository does not
yet define repeatable, exact-head evidence for an installed unpacked extension
or the user-visible add, remove, block, unlist, reload, and incognito flows.

## Requirements

1. Add an exact-commit matrix for installation, startup hydration, popup add and
   remove, blocked navigation, per-tab unlisting, mutation failures, reload,
   multiple tabs, and split-incognito behavior.
2. Require synthetic hostnames and sanitized Chrome, profile, result, and
   evidence fields with explicit pass, fail, blocked, or not-run outcomes.
3. Keep Node, static, installed-extension, normal-profile, and incognito
   evidence separate so portable checks cannot imply browser execution.
4. Add mutation-sensitive contracts for the matrix, repository guidance, and
   completed plan evidence.

## Scope Boundaries

- Do not change extension JavaScript, HTML, CSS, manifest permissions, storage
  shape, message contracts, dependencies, or runtime behavior.
- Do not add browsing history, profile paths, account data, cookies, tokens,
  screenshots with unrelated tabs, extension archives, or local Chrome state.
- Do not claim unpacked-extension, navigation, popup, storage, or incognito
  execution from Node or static checks.
- Do not merge or close stacked pull requests without explicit authorization.

## Verification

- Pending implementation and bounded repository validation.
