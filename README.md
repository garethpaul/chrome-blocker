# chrome-blocker

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

- No single runtime entry point was identified. Start by reading the source files and manifests listed above.

## Testing and Verification

- No dedicated automated test command was identified from the checked-in files. Verify changes by running the relevant build or manually exercising the sample.

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

- See `SECURITY.md` for vulnerability reporting and safe research guidance.
- See `VISION.md` for project direction and contribution guardrails.

## Contributing

Keep changes small and tied to the project that is already present in this repository. For code changes, document the toolchain used, avoid committing generated dependency directories or local configuration, and update this README when setup or verification steps change.

## Existing Project Notes

Prior README summary:

> Chrome Blocker <!-- README-OVERVIEW-IMAGE --> Chrome Blocker is a small Manifest V2 Chrome extension for blocking distracting websites during focused work. It stores the block list in local Chrome storage and redirects blocked HTTP(S) page loads to `blockedSite.html`. Install Locally 1. Open `chrome://extensions`. 2. Enable developer mode.

