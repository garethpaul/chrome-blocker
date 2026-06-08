# Chrome Blocker README Baseline

## Goal

Keep the generated README aligned with the Manifest V2 extension URL-rule baseline.

## Scope

- Document local unpacked-extension installation.
- Document the SDK-free baseline and Node URL-rule test commands.
- Keep the exact-origin matching and redirect-parameter safety notes visible.
- Avoid changing extension runtime behavior.

## Verification

- `scripts/check-baseline.sh`
- `node scripts/test-url-rules.js`
