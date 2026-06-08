#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
MANIFEST="$ROOT_DIR/manifest.json"
BACKGROUND="$ROOT_DIR/js/background.js"
POPUP="$ROOT_DIR/js/popup.js"
CONTENT_SCRIPT="$ROOT_DIR/js/contentScript.js"
BLOCKED_SITE="$ROOT_DIR/js/blockedSite.js"
URL_RULES="$ROOT_DIR/js/urlRules.js"
README="$ROOT_DIR/README.md"
PLAN="$ROOT_DIR/docs/plans/2026-06-08-chrome-blocker-url-baseline.md"

for path in "$MANIFEST" "$BACKGROUND" "$POPUP" "$CONTENT_SCRIPT" "$BLOCKED_SITE" "$URL_RULES" "$README" "$PLAN" "$ROOT_DIR/scripts/test-url-rules.js"; do
  if [ ! -f "$path" ]; then
    printf '%s\n' "Required baseline file is missing: $path" >&2
    exit 1
  fi
done

if ! grep -Fq '"scripts": ["js/urlRules.js", "js/background.js"]' "$MANIFEST"; then
  printf '%s\n' "Manifest must load URL rules before the background worker." >&2
  exit 1
fi

if ! grep -Fq '"http://*/*", "https://*/*"' "$BACKGROUND"; then
  printf '%s\n' "Background interception must be limited to HTTP(S) URLs." >&2
  exit 1
fi

if grep -Fq "new RegExp" "$BACKGROUND" || grep -Fq ".match(" "$BACKGROUND"; then
  printf '%s\n' "Background request matching must not use user-controlled regular expressions." >&2
  exit 1
fi

if ! grep -Fq "requestMatchesBlockedSite(requestUrl, blockedSites[i])" "$BACKGROUND"; then
  printf '%s\n' "Background request matching must use exact normalized origin comparison." >&2
  exit 1
fi

if ! grep -Fq "setTabBlockingState(request.tabId, tabBlockingState)" "$BACKGROUND"; then
  printf '%s\n' "Background state must use the webRequest tab id instead of selected tab state." >&2
  exit 1
fi

if ! grep -Fq "encodeURIComponent(tabBlockingState)" "$BACKGROUND"; then
  printf '%s\n' "Background redirects must encode the blocked origin." >&2
  exit 1
fi

if ! grep -Fq "normalizeBlockedOrigin(response.URL)" "$POPUP"; then
  printf '%s\n' "Popup must normalize the active tab URL before storing a block rule." >&2
  exit 1
fi

if grep -Fq "/.*" "$POPUP"; then
  printf '%s\n' "Popup must not derive roots with regular expressions." >&2
  exit 1
fi

if ! grep -Fq "encodeURIComponent(request.blockedSite)" "$CONTENT_SCRIPT"; then
  printf '%s\n' "Content redirects must encode the blocked origin query parameter." >&2
  exit 1
fi

if ! grep -Fq "getBlockedOriginFromSearch(window.location.search)" "$BLOCKED_SITE"; then
  printf '%s\n' "Blocked page must decode and validate its blocked origin parameter." >&2
  exit 1
fi

if ! grep -Fq "decodeURIComponent(match[1])" "$URL_RULES"; then
  printf '%s\n' "URL rules must decode blocked redirect parameters." >&2
  exit 1
fi

if grep -R "console\\.log" "$BACKGROUND" "$POPUP" "$CONTENT_SCRIPT" "$BLOCKED_SITE" >/dev/null 2>&1; then
  printf '%s\n' "Extension scripts must not log tab URLs or block-list state." >&2
  exit 1
fi

if ! grep -Fq "node scripts/test-url-rules.js" "$README"; then
  printf '%s\n' "README must document the URL rule test." >&2
  exit 1
fi

printf '%s\n' "Chrome blocker baseline checks passed."
