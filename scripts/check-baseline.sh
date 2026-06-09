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
BLOCKED_PAGE_TAB_PLAN="$ROOT_DIR/docs/plans/2026-06-09-chrome-blocker-blocked-page-tab-guard.md"
BLOCKED_PAGE_REDIRECT_PLAN="$ROOT_DIR/docs/plans/2026-06-09-chrome-blocker-blocked-page-redirect-guard.md"
POPUP_TAB_PLAN="$ROOT_DIR/docs/plans/2026-06-09-chrome-blocker-popup-tab-guard.md"
HOST_PERMISSION_PLAN="$ROOT_DIR/docs/plans/2026-06-09-chrome-blocker-http-host-permissions.md"
CREDENTIAL_URL_PLAN="$ROOT_DIR/docs/plans/2026-06-09-chrome-blocker-credential-url-guard.md"

for path in "$MANIFEST" "$BACKGROUND" "$POPUP" "$CONTENT_SCRIPT" "$BLOCKED_SITE" "$URL_RULES" "$README" "$PLAN" "$BLOCKED_PAGE_TAB_PLAN" "$BLOCKED_PAGE_REDIRECT_PLAN" "$POPUP_TAB_PLAN" "$HOST_PERMISSION_PLAN" "$CREDENTIAL_URL_PLAN" "$ROOT_DIR/CHANGES.md" "$ROOT_DIR/scripts/test-url-rules.js"; do
  if [ ! -f "$path" ]; then
    printf '%s\n' "Required baseline file is missing: $path" >&2
    exit 1
  fi
done

if [ ! -f "$ROOT_DIR/docs/plans/2026-06-09-chrome-blocker-tab-state-cleanup.md" ]; then
  printf '%s\n' "Chrome blocker tab state cleanup plan is missing." >&2
  exit 1
fi

if [ ! -f "$ROOT_DIR/docs/plans/2026-06-09-chrome-blocker-background-storage-owner.md" ]; then
  printf '%s\n' "Chrome blocker background storage owner plan is missing." >&2
  exit 1
fi

if [ ! -f "$ROOT_DIR/docs/plans/2026-06-09-chrome-blocker-background-tab-state-writes.md" ]; then
  printf '%s\n' "Chrome blocker background tab state write plan is missing." >&2
  exit 1
fi

if ! grep -Fq "Chrome Blocker Changes" "$ROOT_DIR/CHANGES.md"; then
  printf '%s\n' "CHANGES.md must identify the project." >&2
  exit 1
fi

if ! grep -Fq '"scripts": ["js/urlRules.js", "js/background.js"]' "$MANIFEST"; then
  printf '%s\n' "Manifest must load URL rules before the background worker." >&2
  exit 1
fi

if ! grep -Fq '"js/urlRules.js",' "$MANIFEST" || ! grep -Fq '"js/contentScript.js"' "$MANIFEST"; then
  printf '%s\n' "Manifest must load URL rules before the content script." >&2
  exit 1
fi

if ! grep -Fq '"http://*/*", "https://*/*"' "$BACKGROUND"; then
  printf '%s\n' "Background interception must be limited to HTTP(S) URLs." >&2
  exit 1
fi

if grep -Fq '"*://*/*"' "$MANIFEST"; then
  printf '%s\n' "Manifest host permissions must not use the all-schemes wildcard." >&2
  exit 1
fi

if ! awk '
  /"permissions": \[/ { in_permissions = 1 }
  in_permissions && /"http:\/\/\*\/\*"/ { saw_http = 1 }
  in_permissions && /"https:\/\/\*\/\*"/ { saw_https = 1 }
  in_permissions && /\]/ { exit (saw_http && saw_https) ? 0 : 1 }
  END { if (!in_permissions) exit 1 }
' "$MANIFEST"; then
  printf '%s\n' "Manifest host permissions must explicitly cover HTTP and HTTPS pages." >&2
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

if ! grep -Fq "function isValidTabId(tabid)" "$BACKGROUND"; then
  printf '%s\n' "Background state must centralize valid tab id checks." >&2
  exit 1
fi

if ! grep -Fq "if (isValidTabId(tabid))" "$BACKGROUND"; then
  printf '%s\n' "Background state writes must ignore invalid tab ids." >&2
  exit 1
fi

if ! grep -Fq "setTabBlockingState(tabid, normalizedSite)" "$BACKGROUND" ||
  ! grep -Fq "setTabBlockingState(tabid, 0)" "$BACKGROUND"; then
  printf '%s\n' "Background add/unlist paths must use centralized tab state writes." >&2
  exit 1
fi

if ! grep -Fq "chrome.tabs.onRemoved.addListener(removeTabBlockingState)" "$BACKGROUND"; then
  printf '%s\n' "Background state must be removed when tabs close." >&2
  exit 1
fi

if ! grep -Fq "delete tabBlockingMap[tabid]" "$BACKGROUND"; then
  printf '%s\n' "Background tab cleanup must delete closed tab state." >&2
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

if ! grep -Fq "chrome.extension.getBackgroundPage().addBlockedSite(tab.id, urlToBlock)" "$POPUP"; then
  printf '%s\n' "Popup must delegate block-list persistence to the background page." >&2
  exit 1
fi

if ! grep -Fq "function hasValidTabId(tab)" "$POPUP"; then
  printf '%s\n' "Popup must centralize current-tab id validation." >&2
  exit 1
fi

if ! grep -Fq "hasValidTabId(tabs[0])" "$POPUP"; then
  printf '%s\n' "Popup current-tab lookup must guard missing or invalid tab ids." >&2
  exit 1
fi

if grep -Fq "chrome.storage.local.set({blocked: blockedSites})" "$POPUP"; then
  printf '%s\n' "Popup must not duplicate background block-list storage writes." >&2
  exit 1
fi

if grep -Fq "/.*" "$POPUP"; then
  printf '%s\n' "Popup must not derive roots with regular expressions." >&2
  exit 1
fi

if ! grep -Fq "var blockedSite = normalizeBlockedOrigin(request.blockedSite)" "$CONTENT_SCRIPT"; then
  printf '%s\n' "Content redirects must normalize message-provided blocked origins." >&2
  exit 1
fi

if ! grep -Fq 'if (blockedSite === "")' "$CONTENT_SCRIPT"; then
  printf '%s\n' "Content redirects must ignore invalid blocked origins." >&2
  exit 1
fi

if ! grep -Fq "encodeURIComponent(blockedSite)" "$CONTENT_SCRIPT"; then
  printf '%s\n' "Content redirects must encode the normalized blocked origin query parameter." >&2
  exit 1
fi

if ! grep -Fq "getBlockedOriginFromSearch(window.location.search)" "$BLOCKED_SITE"; then
  printf '%s\n' "Blocked page must decode and validate its blocked origin parameter." >&2
  exit 1
fi

if ! grep -Fq "clearCountdownTimer" "$BLOCKED_SITE"; then
  printf '%s\n' "Blocked page must centralize countdown interval cleanup." >&2
  exit 1
fi

countdown_cleanup_calls=$(grep -F "clearCountdownTimer();" "$BLOCKED_SITE" | wc -l | tr -d ' ')
if [ "$countdown_cleanup_calls" -lt 2 ]; then
  printf '%s\n' "Blocked page must clear countdown timers before restart and after modal close." >&2
  exit 1
fi

if ! grep -Fq "interval = 0;" "$BLOCKED_SITE"; then
  printf '%s\n' "Blocked page countdown cleanup must reset interval state." >&2
  exit 1
fi

if ! grep -Fq "function withCurrentTab(callback)" "$BLOCKED_SITE"; then
  printf '%s\n' "Blocked page must centralize current-tab lookup." >&2
  exit 1
fi

if ! grep -Fq 'if (!tab || typeof tab.id !== "number")' "$BLOCKED_SITE"; then
  printf '%s\n' "Blocked page current-tab lookup must guard missing or invalid tab ids." >&2
  exit 1
fi

if [ "$(grep -F "withCurrentTab(function(tab)" "$BLOCKED_SITE" | wc -l | tr -d ' ')" -lt 2 ]; then
  printf '%s\n' "Blocked page unlist and message paths must use guarded current-tab lookup." >&2
  exit 1
fi

if [ "$(grep -F "window.location.href = site;" "$BLOCKED_SITE" | wc -l | tr -d ' ')" -ne 1 ]; then
  printf '%s\n' "Blocked page redirect must stay in the guarded unlist path." >&2
  exit 1
fi

if ! awk '
  /withCurrentTab\(function\(tab\)/ { in_tab = 1; saw_unlist = 0; saw_redirect = 0 }
  in_tab && /unlistSite\(tab.id, site\)/ { saw_unlist = 1 }
  in_tab && /window.location.href = site;/ { saw_redirect = 1 }
  in_tab && /\}\);/ {
    if (saw_unlist && saw_redirect) {
      found = 1
    }
    in_tab = 0
  }
  END { exit found ? 0 : 1 }
' "$BLOCKED_SITE"; then
  printf '%s\n' "Blocked page redirect must run inside the guarded current-tab unlist callback." >&2
  exit 1
fi

if ! grep -Fq "decodeURIComponent(match[1])" "$URL_RULES"; then
  printf '%s\n' "URL rules must decode blocked redirect parameters." >&2
  exit 1
fi

if ! grep -Fq 'parsedUrl.username !== "" || parsedUrl.password !== ""' "$URL_RULES"; then
  printf '%s\n' "URL rules must reject credential-bearing block origins." >&2
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

if ! grep -Fq "scripts/check-baseline.sh" "$README"; then
  printf '%s\n' "README must document the source baseline check." >&2
  exit 1
fi

if ! grep -Fq "chrome://extensions" "$README"; then
  printf '%s\n' "README must document local unpacked-extension installation." >&2
  exit 1
fi

if ! grep -Fq "normalized HTTP(S) origin matching" "$README"; then
  printf '%s\n' "README must document the URL-rule safety baseline." >&2
  exit 1
fi

if ! grep -Fq "CHANGES.md" "$README"; then
  printf '%s\n' "README must point to CHANGES.md." >&2
  exit 1
fi

if ! grep -Fq "blocked-page unblock countdown clears any prior interval" "$README"; then
  printf '%s\n' "README must document blocked-page countdown timer cleanup." >&2
  exit 1
fi

if ! grep -Fq "tab blocking state is removed when tabs close" "$README"; then
  printf '%s\n' "README must document tab blocking state cleanup." >&2
  exit 1
fi

if ! grep -Fq "content-script redirect messages are normalized" "$README"; then
  printf '%s\n' "README must document content-script redirect message validation." >&2
  exit 1
fi

if ! grep -Fq "background page owns block-list storage writes" "$README"; then
  printf '%s\n' "README must document background-owned block-list persistence." >&2
  exit 1
fi

if ! grep -Fq "background add and unblock paths use centralized tab state writes" "$README"; then
  printf '%s\n' "README must document centralized background tab-state writes." >&2
  exit 1
fi

if ! grep -Fq "blocked page validates the current tab before unlisting" "$README"; then
  printf '%s\n' "README must document blocked-page current-tab validation." >&2
  exit 1
fi

if ! grep -Fq "redirects back only after the guarded unlist path runs" "$README"; then
  printf '%s\n' "README must document guarded blocked-page redirect behavior." >&2
  exit 1
fi

if ! grep -Fq "popup validates the active tab id before messaging" "$README"; then
  printf '%s\n' "README must document popup current-tab validation." >&2
  exit 1
fi

if ! grep -Fq "Host permissions are scoped to HTTP(S) pages" "$README"; then
  printf '%s\n' "README must document scoped host permissions." >&2
  exit 1
fi

if ! grep -Fq "URL normalization rejects credential-bearing blocker URLs" "$README"; then
  printf '%s\n' "README must document credential-bearing URL rejection." >&2
  exit 1
fi

if ! grep -Fq "Status: Completed" "$ROOT_DIR/docs/plans/2026-06-09-chrome-blocker-tab-state-cleanup.md"; then
  printf '%s\n' "Chrome blocker tab state cleanup plan must record completed status." >&2
  exit 1
fi

if ! grep -Fq "make check" "$ROOT_DIR/docs/plans/2026-06-09-chrome-blocker-tab-state-cleanup.md"; then
  printf '%s\n' "Chrome blocker tab state cleanup plan must record make check verification." >&2
  exit 1
fi

if ! grep -Fq "Status: Completed" "$ROOT_DIR/docs/plans/2026-06-09-chrome-blocker-content-redirect-validation.md"; then
  printf '%s\n' "Chrome blocker content redirect validation plan must record completed status." >&2
  exit 1
fi

if ! grep -Fq "make check" "$ROOT_DIR/docs/plans/2026-06-09-chrome-blocker-content-redirect-validation.md"; then
  printf '%s\n' "Chrome blocker content redirect validation plan must record make check verification." >&2
  exit 1
fi

if ! grep -Fq "Status: Completed" "$ROOT_DIR/docs/plans/2026-06-09-chrome-blocker-background-storage-owner.md"; then
  printf '%s\n' "Chrome blocker background storage owner plan must record completed status." >&2
  exit 1
fi

if ! grep -Fq "make check" "$ROOT_DIR/docs/plans/2026-06-09-chrome-blocker-background-storage-owner.md"; then
  printf '%s\n' "Chrome blocker background storage owner plan must record make check verification." >&2
  exit 1
fi

if ! grep -Fq "Status: Completed" "$ROOT_DIR/docs/plans/2026-06-09-chrome-blocker-background-tab-state-writes.md"; then
  printf '%s\n' "Chrome blocker background tab state write plan must record completed status." >&2
  exit 1
fi

if ! grep -Fq "make check" "$ROOT_DIR/docs/plans/2026-06-09-chrome-blocker-background-tab-state-writes.md"; then
  printf '%s\n' "Chrome blocker background tab state write plan must record make check verification." >&2
  exit 1
fi

if ! grep -Fq "Status: Completed" "$BLOCKED_PAGE_TAB_PLAN"; then
  printf '%s\n' "Chrome blocker blocked-page tab guard plan must record completed status." >&2
  exit 1
fi

if ! grep -Fq "make check" "$BLOCKED_PAGE_TAB_PLAN"; then
  printf '%s\n' "Chrome blocker blocked-page tab guard plan must record make check verification." >&2
  exit 1
fi

if ! grep -Fq "Status: Completed" "$BLOCKED_PAGE_REDIRECT_PLAN"; then
  printf '%s\n' "Chrome blocker blocked-page redirect guard plan must record completed status." >&2
  exit 1
fi

if ! grep -Fq "make check" "$BLOCKED_PAGE_REDIRECT_PLAN"; then
  printf '%s\n' "Chrome blocker blocked-page redirect guard plan must record make check verification." >&2
  exit 1
fi

if ! grep -Fq "Status: Completed" "$POPUP_TAB_PLAN"; then
  printf '%s\n' "Chrome blocker popup tab guard plan must record completed status." >&2
  exit 1
fi

if ! grep -Fq "make check" "$POPUP_TAB_PLAN"; then
  printf '%s\n' "Chrome blocker popup tab guard plan must record make check verification." >&2
  exit 1
fi

if ! grep -Fq "Status: Completed" "$HOST_PERMISSION_PLAN"; then
  printf '%s\n' "Chrome blocker host permission plan must record completed status." >&2
  exit 1
fi

if ! grep -Fq "make check" "$HOST_PERMISSION_PLAN"; then
  printf '%s\n' "Chrome blocker host permission plan must record make check verification." >&2
  exit 1
fi

if ! grep -Fq "Status: Completed" "$CREDENTIAL_URL_PLAN"; then
  printf '%s\n' "Chrome blocker credential URL guard plan must record completed status." >&2
  exit 1
fi

if ! grep -Fq "make check" "$CREDENTIAL_URL_PLAN"; then
  printf '%s\n' "Chrome blocker credential URL guard plan must record make check verification." >&2
  exit 1
fi

printf '%s\n' "Chrome blocker baseline checks passed."
