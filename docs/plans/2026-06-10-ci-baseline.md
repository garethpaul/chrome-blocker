# CI Baseline

Status: Completed

## Context

The repository had a local Node-backed `make check` baseline for the Chrome
extension source guards and URL-rule tests, but no hosted workflow ran it for
pushes and pull requests.

## Objectives

- Run the Node-backed baseline across active Node release lines.
- Pin third-party action code and keep workflow access read-only.
- Preserve the current extension behavior while keeping Manifest V3 migration
  as separately testable work.

## Changes

- Added a GitHub Actions workflow that runs `make check` on Node 20, 22, and
  24 for pushes, pull requests, and manual dispatches.
- Pinned checkout and Node setup actions to reviewed commits, limited
  repository access to read-only, and bounded execution with timeout and
  concurrency cancellation.
- Extended the baseline script and docs so the hosted CI path stays visible.

## Verification

- `make check`
- Node 20, 22, and 24 hosted workflow jobs

## Follow-Up

- Migrate from Manifest V2 only alongside replacements for blocking
  `webRequest` interception and persistent background-page APIs.
