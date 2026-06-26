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
CI_PLAN="$ROOT_DIR/docs/plans/2026-06-10-ci-baseline.md"
CI_WORKFLOW="$ROOT_DIR/.github/workflows/check.yml"
NON_TAB_REQUEST_PLAN="$ROOT_DIR/docs/plans/2026-06-10-chrome-blocker-non-tab-request-guard.md"
BACKGROUND_TEST="$ROOT_DIR/scripts/test-background.js"
TAB_LIFECYCLE_PLAN="$ROOT_DIR/docs/plans/2026-06-12-chrome-blocker-tab-lifecycle-helper-coverage.md"
CHECKOUT_CREDENTIAL_PLAN="$ROOT_DIR/docs/plans/2026-06-12-checkout-credential-boundary.md"
GLOBAL_UNLIST_PLAN="$ROOT_DIR/docs/plans/2026-06-13-chrome-blocker-global-unlist-state.md"
UNLIST_MESSAGE_PLAN="$ROOT_DIR/docs/plans/2026-06-13-chrome-blocker-unlist-message-contract.md"
BLOCKED_SITE_TEST="$ROOT_DIR/scripts/test-blocked-site.js"
STARTUP_HYDRATION_PLAN="$ROOT_DIR/docs/plans/2026-06-13-chrome-blocker-startup-hydration-gate.md"
HYDRATION_MUTATION_PLAN="$ROOT_DIR/docs/plans/2026-06-13-chrome-blocker-hydration-mutations.md"
RUNTIME_MESSAGE_PLAN="$ROOT_DIR/docs/plans/2026-06-14-chrome-blocker-runtime-message-boundary.md"
POPUP_TEST="$ROOT_DIR/scripts/test-popup.js"
CONTENT_SCRIPT_TEST="$ROOT_DIR/scripts/test-content-script.js"
MUTATION_ACK_PLAN="$ROOT_DIR/docs/plans/2026-06-14-chrome-blocker-mutation-acknowledgement.md"
INTEGER_TAB_ID_PLAN="$ROOT_DIR/docs/plans/2026-06-14-chrome-blocker-integer-tab-ids.md"
BROWSER_VERIFICATION_PLAN="$ROOT_DIR/docs/plans/2026-06-14-chrome-blocker-browser-verification.md"
README_INSTALL_PLAN="$ROOT_DIR/docs/plans/2026-06-25-chrome-blocker-install-permissions.md"
UNLIST_SENDER_PLAN="$ROOT_DIR/docs/plans/2026-06-15-chrome-blocker-unlist-sender-guard.md"
BACKGROUND_ROUTE_PLAN="$ROOT_DIR/docs/plans/2026-06-15-chrome-blocker-background-route-authorization.md"
UNLIST_TAB_OWNERSHIP_PLAN="$ROOT_DIR/docs/plans/2026-06-15-chrome-blocker-unlist-tab-ownership.md"
CONTENT_MESSAGE_OWNERSHIP_PLAN="$ROOT_DIR/docs/plans/2026-06-15-chrome-blocker-content-message-ownership.md"
UNLIST_STATE_OWNERSHIP_PLAN="$ROOT_DIR/docs/plans/2026-06-17-chrome-blocker-unlist-state-ownership.md"
BLOCKED_DOCUMENT_OWNERSHIP_PLAN="$ROOT_DIR/docs/plans/2026-06-19-chrome-blocker-blocked-document-ownership.md"
BLOCKED_PAGE_RELOAD_PLAN="$ROOT_DIR/docs/plans/2026-06-25-chrome-blocker-blocked-page-reload.md"
TAB_REPLACEMENT_DESIGN="$ROOT_DIR/docs/plans/2026-06-25-chrome-blocker-tab-replacement-design.md"
TAB_REPLACEMENT_PLAN="$ROOT_DIR/docs/plans/2026-06-25-chrome-blocker-tab-replacement.md"
MAKE_LAUNCHER="$ROOT_DIR/scripts/run-make.js"
NODE_GATE="$ROOT_DIR/scripts/run-node-gate.js"
MAKE_LAUNCHER_TEST="$ROOT_DIR/scripts/test-make-launcher.js"
CHECK_BOOTSTRAP="$ROOT_DIR/scripts/check"

for path in "$MANIFEST" "$BACKGROUND" "$POPUP" "$CONTENT_SCRIPT" "$BLOCKED_SITE" "$URL_RULES" "$README" "$PLAN" "$BLOCKED_PAGE_TAB_PLAN" "$BLOCKED_PAGE_REDIRECT_PLAN" "$POPUP_TAB_PLAN" "$HOST_PERMISSION_PLAN" "$CREDENTIAL_URL_PLAN" "$CI_PLAN" "$CI_WORKFLOW" "$NON_TAB_REQUEST_PLAN" "$BACKGROUND_TEST" "$TAB_LIFECYCLE_PLAN" "$CHECKOUT_CREDENTIAL_PLAN" "$GLOBAL_UNLIST_PLAN" "$UNLIST_MESSAGE_PLAN" "$BLOCKED_SITE_TEST" "$STARTUP_HYDRATION_PLAN" "$HYDRATION_MUTATION_PLAN" "$RUNTIME_MESSAGE_PLAN" "$MUTATION_ACK_PLAN" "$INTEGER_TAB_ID_PLAN" "$BROWSER_VERIFICATION_PLAN" "$README_INSTALL_PLAN" "$UNLIST_SENDER_PLAN" "$BACKGROUND_ROUTE_PLAN" "$UNLIST_TAB_OWNERSHIP_PLAN" "$CONTENT_MESSAGE_OWNERSHIP_PLAN" "$UNLIST_STATE_OWNERSHIP_PLAN" "$BLOCKED_DOCUMENT_OWNERSHIP_PLAN" "$BLOCKED_PAGE_RELOAD_PLAN" "$TAB_REPLACEMENT_DESIGN" "$TAB_REPLACEMENT_PLAN" "$POPUP_TEST" "$CONTENT_SCRIPT_TEST" "$CHECK_BOOTSTRAP" "$MAKE_LAUNCHER" "$NODE_GATE" "$MAKE_LAUNCHER_TEST" "$ROOT_DIR/CHANGES.md" "$ROOT_DIR/scripts/test-url-rules.js"; do
  if [ ! -f "$path" ]; then
    printf '%s\n' "Required baseline file is missing: $path" >&2
    exit 1
  fi
done

for readme_install_contract in \
  'This repository still uses Manifest V2.' \
  'Chrome may reject the extension before installation' \
  '| `http://*/*` and `https://*/*` | Runs the content script' \
  '| `tabs` | Finds the active tab' \
  '| `storage` | Persists the normalized block list' \
  '| `webRequest` and `webRequestBlocking` | Observes and synchronously redirects' \
  '| `webNavigation` | Tracks committed top-level documents' \
  '| `incognito: split` | Runs extension pages and the background page in a separate incognito process' \
  '`chrome.storage.local` remains shared' \
  'does not add telemetry, remote configuration, or synced block lists' \
  '[`BROWSER_VERIFICATION.md`](BROWSER_VERIFICATION.md) for installed-extension'; do
  if ! grep -Fq "$readme_install_contract" "$README"; then
    printf '%s\n' "README must keep install and permission guidance: $readme_install_contract" >&2
    exit 1
  fi
done

for readme_plan_contract in \
  'Status: Completed' \
  'Add a Manifest V2 compatibility warning without claiming' \
  'Document a permission rationale for HTTP(S) host access' \
  'Sixteen isolated hostile mutations of the Manifest V2 compatibility warning' \
  '`sh scripts/check-baseline.sh` and `make check` passed'; do
  if ! grep -Fq "$readme_plan_contract" "$README_INSTALL_PLAN"; then
    printf '%s\n' "README install plan must keep completion evidence: $readme_plan_contract" >&2
    exit 1
  fi
done

for content_message_source_contract in \
  'function isTrustedPopupSender(sender)' \
  'sender.id === chrome.runtime.id' \
  'sender.url === chrome.runtime.getURL("popup.html")' \
  'if (!isTrustedPopupSender(sender) || !request ||' \
  'var currentSite = normalizeBlockedOrigin(document.location.href);' \
  'if (blockedSite === "" || currentSite !== blockedSite)'; do
  if ! grep -Fq "$content_message_source_contract" "$CONTENT_SCRIPT"; then
    printf '%s\n' "Missing content-script message ownership contract: $content_message_source_contract" >&2
    exit 1
  fi
done

content_message_listener=$(awk '
  /chrome\.runtime\.onMessage\.addListener\(/ { capture = 1 }
  capture { print }
' "$CONTENT_SCRIPT")
content_sender_guard_line=$(printf '%s\n' "$content_message_listener" | grep -nF 'if (!isTrustedPopupSender(sender) || !request ||' | cut -d: -f1)
content_action_line=$(printf '%s\n' "$content_message_listener" | grep -nF 'if (request.action === "geturl")' | cut -d: -f1)
content_origin_guard_line=$(printf '%s\n' "$content_message_listener" | grep -nF 'if (blockedSite === "" || currentSite !== blockedSite)' | cut -d: -f1)
content_redirect_line=$(printf '%s\n' "$content_message_listener" | grep -nF 'window.location = chrome.runtime.getURL(' | cut -d: -f1)
if [ -z "$content_sender_guard_line" ] || [ -z "$content_action_line" ] ||
   [ -z "$content_origin_guard_line" ] || [ -z "$content_redirect_line" ] ||
   [ "$content_sender_guard_line" -ge "$content_action_line" ] ||
   [ "$content_origin_guard_line" -ge "$content_redirect_line" ]; then
  printf '%s\n' "Content-script sender and current-origin authorization must precede action effects." >&2
  exit 1
fi

for content_message_test_contract in \
  'const popupSender = {' \
  '{id: "other-extension", url: popupSender.url}' \
  'url: popupSender.url + "?forged=1"' \
  'for (const message of [undefined, null, "geturl", {}, {action: "unknown"}])' \
  'currentLocation.href = "https://different.example/private";' \
  'assert.strictEqual(context.window.location, "unchanged");' \
  'Content-script sender and document ownership tests passed.'; do
  if ! grep -Fq "$content_message_test_contract" "$CONTENT_SCRIPT_TEST"; then
    printf '%s\n' "Missing content-script ownership regression: $content_message_test_contract" >&2
    exit 1
  fi
done

if ! grep -Fq "'test-content-script.js'" "$NODE_GATE"; then
  printf '%s\n' "The full test gate must execute the content-script ownership suite." >&2
  exit 1
fi

for content_message_doc in "$ROOT_DIR/AGENTS.md" "$README" "$ROOT_DIR/SECURITY.md" \
  "$ROOT_DIR/VISION.md" "$ROOT_DIR/CHANGES.md"; do
  if ! grep -Fq 'Content-script URL reads and redirects require exact popup sender and current-document origin ownership.' "$content_message_doc"; then
    printf '%s\n' "$content_message_doc must document content-script sender and document ownership." >&2
    exit 1
  fi
done

for content_message_plan_contract in \
  'Status: Completed' \
  'unauthorized sender' \
  'stale-navigation race' \
  'test-content-script.js' \
  'hostile mutations'; do
  if ! grep -Fq "$content_message_plan_contract" "$CONTENT_MESSAGE_OWNERSHIP_PLAN"; then
    printf '%s\n' "Content message ownership plan must preserve completed evidence: $content_message_plan_contract" >&2
    exit 1
  fi
done

for unlist_tab_source_contract in \
  'function hasTrustedBlockedPageState(sender, tabid, blockedOrigin)' \
  'isValidTabId(tabid) && sender && sender.tab &&' \
  'isValidTabId(sender.tab.id) && sender.tab.id === tabid &&' \
  'sender.frameId === 0 && typeof sender.documentId === "string" &&' \
  'tabBlockingDocumentMap[tabid] === sender.documentId &&' \
  'getTabState(tabid) === blockedOrigin' \
  '!hasTrustedBlockedPageState(sender, message.tabId, blockedPageOrigin)'; do
  if ! grep -Fq "$unlist_tab_source_contract" "$BACKGROUND"; then
    printf '%s\n' "Missing blocked-page unlist tab ownership contract: $unlist_tab_source_contract" >&2
    exit 1
  fi
done

background_message_handler=$(awk '
  /function handleBackgroundMessage\(message, sender, sendResponse\)/ { capture = 1 }
  capture && /function requestChecker\(request\)/ { exit }
  capture { print }
' "$BACKGROUND")
tab_guard_line=$(printf '%s\n' "$background_message_handler" | grep -nF '!hasTrustedBlockedPageState(sender, message.tabId, blockedPageOrigin)' | cut -d: -f1)
unlist_dispatch_line=$(printf '%s\n' "$background_message_handler" | grep -nF 'unlistSite(message.tabId, message.blockedSite, function(success)' | cut -d: -f1)
if [ -z "$tab_guard_line" ] || [ -z "$unlist_dispatch_line" ] || \
   [ "$tab_guard_line" -ge "$unlist_dispatch_line" ]; then
  printf '%s\n' "Blocked-page sender-tab authorization must precede unlist mutation dispatch." >&2
  exit 1
fi

for unlist_tab_test_contract in \
  'function sendBackgroundMessage(message, senderId, senderUrl, senderTabId,' \
  'sender.tab = {id: senderTabId};' \
  'sender.frameId = senderFrameId;' \
  'sender.documentId = senderDocumentId;' \
  'for (const senderTabId of [undefined, -1, 1.5, 15])' \
  '{frameId: 1, documentId: "message-document"}' \
  '{frameId: 0, documentId: "replacement-document"}'; do
  if ! grep -Fq "$unlist_tab_test_contract" "$BACKGROUND_TEST"; then
    printf '%s\n' "Missing blocked-page sender-tab regression: $unlist_tab_test_contract" >&2
    exit 1
  fi
done

for blocked_document_source_contract in \
  'var tabBlockingDocumentMap = {};' \
  'var pendingTabBlockingMap = {};' \
  'function getBlockedPageOrigin(candidateUrl)' \
  'pendingTabBlockingMap[details.tabId] === blockedOrigin' \
  'getTabState(details.tabId) === blockedOrigin' \
  'setTabBlockingState(details.tabId, blockedOrigin, details.documentId);' \
  'details.frameId !== 0' \
  'function isTopLevelBlockedPage()' \
  'if (!isTopLevelBlockedPage() || !isTrustedPopupSender(sender))'; do
  if ! grep -Fq "$blocked_document_source_contract" "$BACKGROUND" "$BLOCKED_SITE"; then
    printf '%s\n' "Missing blocked-document ownership contract: $blocked_document_source_contract" >&2
    exit 1
  fi
done

for blocked_document_test_contract in \
  'documentId: "subframe-document"' \
  'documentId: "blocked-document"' \
  'documentId: "reloaded-blocked-document"' \
  'documentId: "reloaded-message-document"' \
  'documentId: "replacement-document"' \
  'context.pendingTabBlockingMap[17], undefined' \
  'context.window.top = {};' \
  'assert.strictEqual(currentTabLookups, lookupsBeforeRejectedSenders);'; do
  if ! grep -Fq "$blocked_document_test_contract" "$BACKGROUND_TEST" "$BLOCKED_SITE_TEST"; then
    printf '%s\n' "Missing blocked-document ownership regression: $blocked_document_test_contract" >&2
    exit 1
  fi
done

for blocked_page_reload_doc in "$README" "$ROOT_DIR/SECURITY.md" \
  "$ROOT_DIR/VISION.md" "$ROOT_DIR/AGENTS.md"; do
  if ! tr '\n' ' ' < "$blocked_page_reload_doc" | tr -s '[:space:]' ' ' | \
      grep -Fq "Reloading the canonical blocked page preserves its blocked origin while replacing the authorized document ID."; then
    printf '%s\n' "$blocked_page_reload_doc must document blocked-page reload ownership." >&2
    exit 1
  fi
done

for blocked_page_reload_plan_contract in \
  'Status: Completed' \
  'RED reproduced' \
  'reloaded-blocked-document' \
  'make check'; do
  if ! grep -Fq "$blocked_page_reload_plan_contract" "$BLOCKED_PAGE_RELOAD_PLAN"; then
    printf '%s\n' "Blocked-page reload plan must record completed evidence: $blocked_page_reload_plan_contract" >&2
    exit 1
  fi
done

for blocked_document_doc in "$README" "$ROOT_DIR/SECURITY.md" "$ROOT_DIR/VISION.md" \
  "$ROOT_DIR/CHANGES.md" "$ROOT_DIR/AGENTS.md"; do
  if ! tr '\n' ' ' < "$blocked_document_doc" | tr -s '[:space:]' ' ' | \
      grep -Fq "Blocked-page unlist mutations require a reserved top-level redirect and the exact committed document ID; subframes, stale documents, and replacement navigations fail closed."; then
    printf '%s\n' "$blocked_document_doc must document committed blocked-document ownership." >&2
    exit 1
  fi
done

for blocked_document_plan_contract in \
  'Status: Completed' \
  'RED reproduced' \
  'hostile mutations' \
  'make check'; do
  if ! grep -Fq "$blocked_document_plan_contract" "$BLOCKED_DOCUMENT_OWNERSHIP_PLAN"; then
    printf '%s\n' "Blocked-document ownership plan must record completed evidence: $blocked_document_plan_contract" >&2
    exit 1
  fi
done

for unlist_state_test_contract in \
  'const writesBeforeUnownedTabUnlist = storedValues.length;' \
  'sendBackgroundMessage({action: "background:unlistSite", tabId: 15,' \
  'encodeURIComponent("https://message.test"), 15)' \
  'assert.strictEqual(storedValues.length, writesBeforeUnownedTabUnlist);'; do
  if ! grep -Fq "$unlist_state_test_contract" "$BACKGROUND_TEST"; then
    printf '%s\n' "Missing blocked-page unlist state ownership regression: $unlist_state_test_contract" >&2
    exit 1
  fi
done

for unlist_tab_doc in "$README" "$ROOT_DIR/SECURITY.md" "$ROOT_DIR/VISION.md" \
  "$ROOT_DIR/CHANGES.md" "$ROOT_DIR/AGENTS.md"; do
  if ! tr '\n' ' ' < "$unlist_tab_doc" | tr -s '[:space:]' ' ' | \
      grep -Fq "Blocked-page unlist mutations require exact blocked-origin and sender-tab ownership."; then
    printf '%s\n' "$unlist_tab_doc must document blocked-page sender-tab ownership." >&2
    exit 1
  fi
done

for unlist_tab_plan_contract in \
  'status: completed' \
  'make check' \
  'hostile sender-tab mutations were rejected' \
  'No unpacked-extension browser flow was executed'; do
  if ! grep -Fq "$unlist_tab_plan_contract" "$UNLIST_TAB_OWNERSHIP_PLAN"; then
    printf '%s\n' "Unlist tab ownership plan must record completed verification: $unlist_tab_plan_contract" >&2
    exit 1
  fi
done

for unlist_state_doc in "$README" "$ROOT_DIR/SECURITY.md" "$ROOT_DIR/VISION.md" \
  "$ROOT_DIR/CHANGES.md" "$ROOT_DIR/AGENTS.md"; do
  if ! tr '\n' ' ' < "$unlist_state_doc" | tr -s '[:space:]' ' ' | \
      grep -Fq "Blocked-page unlist mutations also require the sender tab's current blocked-origin state to match the requested origin."; then
    printf '%s\n' "$unlist_state_doc must document blocked-page state ownership." >&2
    exit 1
  fi
done

UNLIST_STATE_PLAN_FLAT=$(tr '\n' ' ' < "$UNLIST_STATE_OWNERSHIP_PLAN" | tr -s '[:space:]' ' ')
for unlist_state_plan_contract in \
  'status: completed' \
  "sender tab's current blocked-origin state" \
  'same-extension, exact-URL, same-tab unlist message' \
  'Require exact-head push and pull-request checks across Node 20, 22, and 24' \
  'Seven isolated mutations were rejected' \
  'Exact implementation head `31192430b334ac8d7636fc024c9ed7d26511037a`' \
  '27680147024' \
  '27680156046'; do
  if ! printf '%s\n' "$UNLIST_STATE_PLAN_FLAT" | grep -Fq "$unlist_state_plan_contract"; then
    printf '%s\n' "Unlist state ownership plan must preserve contract: $unlist_state_plan_contract" >&2
    exit 1
  fi
done

for unlist_sender_source_contract in \
  'function isTrustedPopupSender(sender)' \
  'sender.id === chrome.runtime.id' \
  'sender.url === chrome.runtime.getURL("popup.html")' \
  'if (!isTopLevelBlockedPage() || !isTrustedPopupSender(sender))'; do
  if ! grep -Fq "$unlist_sender_source_contract" "$BLOCKED_SITE"; then
    printf '%s\n' "Missing blocked-page popup sender guard: $unlist_sender_source_contract" >&2
    exit 1
  fi
done

for unlist_sender_test_contract in \
  'const popupSender = {' \
  '{id: "other-extension", url: extensionRoot + "popup.html"}' \
  '{id: "chrome-blocker", url: extensionRoot + "background.html"}' \
  '{id: "chrome-blocker", url: extensionRoot + "popup.html/extra"}' \
  'assert.strictEqual(currentTabLookups, lookupsBeforeRejectedSenders);' \
  '}, popupSender, function() {});'; do
  if ! grep -Fq "$unlist_sender_test_contract" "$BLOCKED_SITE_TEST"; then
    printf '%s\n' "Missing blocked-page sender regression: $unlist_sender_test_contract" >&2
    exit 1
  fi
done

sender_guard_line=$(grep -nF 'if (!isTopLevelBlockedPage() || !isTrustedPopupSender(sender))' "$BLOCKED_SITE" | cut -d: -f1)
tab_lookup_line=$(grep -nF 'withCurrentTab(function(tab) {' "$BLOCKED_SITE" | tail -n 1 | cut -d: -f1)
if [ -z "$sender_guard_line" ] || [ -z "$tab_lookup_line" ] || \
   [ "$sender_guard_line" -ge "$tab_lookup_line" ]; then
  printf '%s\n' "Blocked-page sender authorization must precede the tab lookup." >&2
  exit 1
fi

for unlist_sender_doc in "$ROOT_DIR/AGENTS.md" "$README" "$ROOT_DIR/SECURITY.md" \
  "$ROOT_DIR/VISION.md" "$ROOT_DIR/CHANGES.md"; do
  if ! tr '\n' ' ' < "$unlist_sender_doc" | tr -s '[:space:]' ' ' | \
      grep -Fq "Only the exact popup extension page may start the blocked-page unlist countdown."; then
    printf '%s\n' "$unlist_sender_doc must document popup-only unlist initiation." >&2
    exit 1
  fi
done

for unlist_sender_plan_contract in \
  'Status: Completed' \
  '## Verification: Completed' \
  'make check' \
  'hostile mutations' \
  'no unpacked-extension browser execution'; do
  if ! grep -Fq "$unlist_sender_plan_contract" "$UNLIST_SENDER_PLAN"; then
    printf '%s\n' "Unlist sender plan must record completed verification: $unlist_sender_plan_contract" >&2
    exit 1
  fi
done

if grep -n 'chrome\.extension\.getBackgroundPage(' "$BACKGROUND" "$POPUP" "$BLOCKED_SITE" >/dev/null; then
  printf '%s\n' "Extension pages must not access the background global object directly." >&2
  exit 1
fi

for message_contract in \
  'function isTrustedPopupSender(sender)' \
  'sender.url === chrome.runtime.getURL("popup.html")' \
  'function getBlockedPageOrigin(candidateUrl)' \
  'candidateUrl.indexOf(blockedPageUrl + "?blocked=") !== 0' \
  'candidateUrl.substring(blockedPageUrl.length)' \
  'function getTrustedBlockedPageOrigin(sender)' \
  'sender.id === chrome.runtime.id' \
  'function handleBackgroundMessage(message, sender, sendResponse)' \
  'if ((popupAction && !isTrustedPopupSender(sender)) ||' \
  'blockedPageOrigin !==' \
  'normalizeBlockedOrigin(message.blockedSite)' \
  'chrome.runtime.onMessage.addListener(handleBackgroundMessage);' \
  'message.action === "background:getTabState"' \
  'message.action === "background:addBlockedSite"' \
  'message.action === "background:unlistSite"' \
  'message.action === "background:clearBlacklist"'; do
  if ! grep -Fq "$message_contract" "$BACKGROUND"; then
    printf '%s\n' "Missing validated background message contract: $message_contract" >&2
    exit 1
  fi
done

for route_test_contract in \
  '"chrome-extension://test/blockedSite.html?blocked=https%3A%2F%2Fexample.com"' \
  '"chrome-extension://test/blockedSite.html?blocked=" +' \
  '{action: "background:clearBlacklist"}, undefined,'; do
  if ! grep -Fq "$route_test_contract" "$BACKGROUND_TEST"; then
    printf '%s\n' "Background test must preserve action-specific sender coverage: $route_test_contract" >&2
    exit 1
  fi
done

for route_doc in "$ROOT_DIR/AGENTS.md" "$README" "$ROOT_DIR/SECURITY.md" \
  "$ROOT_DIR/VISION.md" "$ROOT_DIR/CHANGES.md"; do
  if ! tr '\n' ' ' < "$route_doc" | tr -s '[:space:]' ' ' | \
      grep -Fq "Popup routes and blocked-page unlist routes use separate exact sender authorization."; then
    printf '%s\n' "$route_doc must document background route authorization." >&2
    exit 1
  fi
done

for route_plan_contract in \
  'Status: Completed' \
  'make check' \
  'hostile route mutations' \
  'no unpacked-extension browser execution'; do
  if ! grep -Fq "$route_plan_contract" "$BACKGROUND_ROUTE_PLAN"; then
    printf '%s\n' "Background route plan must record completed verification: $route_plan_contract" >&2
    exit 1
  fi
done

for caller_contract in \
  'action: "background:getTabState"' \
  'action: "background:addBlockedSite"' \
  'action: "background:clearBlacklist"'; do
  if ! grep -Fq "$caller_contract" "$POPUP"; then
    printf '%s\n' "Popup must use runtime message contract: $caller_contract" >&2
    exit 1
  fi
done

if ! grep -Fq 'action: "background:unlistSite"' "$BLOCKED_SITE" || \
   ! grep -Fq 'response.ok === true' "$BLOCKED_SITE"; then
  printf '%s\n' "Blocked page must wait for acknowledged runtime unlist messages." >&2
  exit 1
fi

for message_test_contract in \
  'sendBackgroundMessage({action: "background:getTabState", tabId: 7}, "other-extension")' \
  '"https://example.com/"' \
  'sendBackgroundMessage({action: "background:addBlockedSite", tabId: -2,' \
  'sendBackgroundMessage({action: "background:unlistSite", tabId: 14,'; do
  if ! grep -Fq "$message_test_contract" "$BACKGROUND_TEST"; then
    printf '%s\n' "Background test must exercise rejected runtime message: $message_test_contract" >&2
    exit 1
  fi
done

if ! grep -Fq 'Popup runtime message boundary tests passed.' "$POPUP_TEST" || \
   ! grep -Fq "'test-popup.js'" "$NODE_GATE"; then
  printf '%s\n' "Popup runtime behavior test must remain in the repository gate." >&2
  exit 1
fi

for runtime_message_plan_contract in \
  'Status: Completed' \
  'Verification: Completed' \
  'Full `make check` passes' \
  'Nine focused hostile mutations' \
  'no unpacked-extension browser execution'; do
  if ! grep -Fq "$runtime_message_plan_contract" "$RUNTIME_MESSAGE_PLAN"; then
    printf '%s\n' "Runtime message plan must record completed verification: $runtime_message_plan_contract" >&2
    exit 1
  fi
done

for hydration_mutation_contract in \
  'var blockedSitesHydrationFailed = false;' \
  'function failBlockedListHydration()' \
  'if (blockedSitesHydrationFailed)' \
  'var pendingBlockedListMutations = [];' \
  'pendingBlockedListMutations.push({' \
  'pendingBlockedListMutations = [];' \
  'flushPendingBlockedListMutations();' \
  'runBlockedListMutation(function(done) {'; do
  if ! grep -Fq "$hydration_mutation_contract" "$BACKGROUND"; then
    printf '%s\n' "Missing hydration-safe mutation contract: $hydration_mutation_contract" >&2
    exit 1
  fi
done

if [ "$(grep -Fc 'if (!blockedSitesReady)' "$BACKGROUND")" -ne 1 ] || \
   ! grep -Fq 'if (!blockedSitesReady || blockedListMutationInProgress ||' "$BACKGROUND"; then
  printf '%s\n' "Background must guard both serialized mutations and request enforcement during hydration." >&2
  exit 1
fi

ready_line=$(grep -nF 'blockedSitesReady = true;' "$BACKGROUND" | cut -d: -f1)
flush_line=$(grep -nF 'flushPendingBlockedListMutations();' "$BACKGROUND" | head -n 1 | cut -d: -f1)
if [ -z "$ready_line" ] || [ -z "$flush_line" ] || [ "$ready_line" -ge "$flush_line" ]; then
  printf '%s\n' "Loaded block-list state must become ready before queued mutations replay." >&2
  exit 1
fi

for hydration_mutation_test in \
  'const queuedMutationHarness = createBackgroundHarness({deferStorageWrites: true});' \
  'queuedMutationHarness.context.addBlockedSite(5, "https://queued.test/path", function(success) {' \
  'assert.strictEqual(queuedMutationHarness.context.pendingBlockedListMutations.length, 1);' \
  '{blocked: ["https://existing.test", "https://queued.test"]}' \
  'assert.strictEqual(storageErrorHarness.context.pendingBlockedListMutations.length, 0);'; do
  if ! grep -Fq "$hydration_mutation_test" "$BACKGROUND_TEST"; then
    printf '%s\n' "Missing deferred mutation regression: $hydration_mutation_test" >&2
    exit 1
  fi
done

if ! grep -Fq 'assert.strictEqual(storageErrorHarness.context.blockedSitesHydrationFailed, true);' "$BACKGROUND_TEST" || \
   ! grep -Fq 'storageErrorHarness.context.addBlockedSite(6, "https://after-error.test/path");' "$BACKGROUND_TEST"; then
  printf '%s\n' "Failed hydration tests must reject post-error mutation retention." >&2
  exit 1
fi

for mutation_ack_source_contract in \
  'var blockedListMutationInProgress = false;' \
  'chrome.storage.local.set({blocked: hydratedBlockedSites}, function() {' \
  'function persistBlockedSites(nextBlockedSites, commit, completion)' \
  'blockedSites = nextBlockedSites;' \
  'queuedMutation.completion(success);' \
  'sendResponse({ok: success});'; do
  if ! grep -Fq "$mutation_ack_source_contract" "$BACKGROUND"; then
    printf '%s\n' "Missing persisted mutation acknowledgement contract: $mutation_ack_source_contract" >&2
    exit 1
  fi
done

if [ "$(grep -Fc 'return true;' "$BACKGROUND")" -ne 3 ]; then
  printf '%s\n' "Each accepted asynchronous mutation message must retain its response channel." >&2
  exit 1
fi

for mutation_ack_test_contract in \
  'const hydrationWriteFailureHarness = createBackgroundHarness({deferStorageWrites: true});' \
  'assert.deepStrictEqual(hydrationWriteFailureResponse, {ok: false});' \
  'assert.deepStrictEqual(failedWriteResponse, {ok: false});' \
  'assert.strictEqual(serializedHarness.pendingStorageWrites.length, 1);' \
  'assert.deepStrictEqual(serializedResponses, [{ok: true}, {ok: true}]);'; do
  if ! grep -Fq "$mutation_ack_test_contract" "$BACKGROUND_TEST"; then
    printf '%s\n' "Missing persisted mutation acknowledgement regression: $mutation_ack_test_contract" >&2
    exit 1
  fi
done

for popup_ack_contract in \
  'response.ok !== true' \
  'chrome.tabs.sendMessage(tab.id, {action: "redirect", blockedSite: urlToBlock});' \
  'tabState = 0;'; do
  if ! grep -Fq "$popup_ack_contract" "$POPUP"; then
    printf '%s\n' "Popup must proceed only after acknowledged mutation success: $popup_ack_contract" >&2
    exit 1
  fi
done

for mutation_ack_doc in "$README" "$ROOT_DIR/SECURITY.md" "$ROOT_DIR/CHANGES.md"; do
  if ! tr '\n' ' ' < "$mutation_ack_doc" | tr -s '[:space:]' ' ' | \
      grep -Fq "Background block-list mutations are serialized and acknowledged only after storage persistence succeeds."; then
    printf '%s\n' "$mutation_ack_doc must document persisted mutation acknowledgement." >&2
    exit 1
  fi
done

for mutation_ack_plan_contract in \
  'Status: Completed' \
  '## Verification: Completed' \
  'Full `make check` passes' \
  'Nine focused hostile mutations were rejected' \
  'Two focused plan mutations were rejected' \
  'no unpacked-extension browser execution is claimed'; do
  if ! grep -Fq "$mutation_ack_plan_contract" "$MUTATION_ACK_PLAN"; then
    printf '%s\n' "Mutation acknowledgement plan must record completed verification: $mutation_ack_plan_contract" >&2
    exit 1
  fi
done

for hydration_mutation_doc in "$ROOT_DIR/AGENTS.md" "$README" "$ROOT_DIR/SECURITY.md" \
  "$ROOT_DIR/VISION.md" "$ROOT_DIR/CHANGES.md"; do
  if ! tr '\n' ' ' < "$hydration_mutation_doc" | tr -s '[:space:]' ' ' | \
      grep -Fiq "replay queued block-list mutations"; then
    printf '%s\n' "$hydration_mutation_doc must document hydration-safe mutation replay." >&2
    exit 1
  fi
done

for hydration_mutation_plan_contract in \
  "Status: Completed" \
  "Verification: Completed" \
  "make check" \
  "focused hostile mutations" \
  "no unpacked-extension browser"; do
  if ! grep -Fq "$hydration_mutation_plan_contract" "$HYDRATION_MUTATION_PLAN"; then
    printf '%s\n' "Hydration mutation plan must record completed verification: $hydration_mutation_plan_contract" >&2
    exit 1
  fi
done

if [ ! -f "$ROOT_DIR/docs/plans/2026-06-09-chrome-blocker-tab-state-cleanup.md" ]; then
  printf '%s\n' "Chrome blocker tab state cleanup plan is missing." >&2
  exit 1
fi

if [ "$(grep -Fc 'uses: actions/checkout@' "$CI_WORKFLOW")" -ne 1 ] || \
   [ "$(grep -Fc 'persist-credentials: false' "$CI_WORKFLOW")" -ne 1 ] || \
   [ "$(grep -Fc 'uses: actions/setup-node@' "$CI_WORKFLOW")" -ne 1 ] || \
   grep -E '^[[:space:]]*(-[[:space:]]+)?uses:' "$CI_WORKFLOW" | grep -Ev '@[0-9a-f]{40}([[:space:]]+#.*)?$' >/dev/null; then
  printf '%s\n' "Workflow actions must be unique, immutable, and checkout credentials must not persist." >&2
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

if ! grep -Fq "actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10" "$CI_WORKFLOW" ||
  ! grep -Fq "actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e" "$CI_WORKFLOW" ||
  ! grep -Fq "node-version: [20, 22, 24]" "$CI_WORKFLOW" ||
  ! grep -Fq "node scripts/test-make-launcher.js" "$CI_WORKFLOW" ||
  ! grep -Fq "/usr/bin/env -i HOME=/nonexistent LANG=C LC_ALL=C PATH=/usr/bin:/bin TMPDIR=/tmp TZ=UTC" "$CI_WORKFLOW" || \
  ! grep -Fq '"$node_path" "$repository/scripts/run-make.js" "$repository" check' "$CI_WORKFLOW" || \
  ! grep -Fq 'LD_PRELOAD: ""' "$CI_WORKFLOW" || \
  ! grep -Fq 'DYLD_INSERT_LIBRARIES: ""' "$CI_WORKFLOW" || \
  ! grep -Fq 'NODE_OPTIONS: ""' "$CI_WORKFLOW"; then
  printf '%s\n' "GitHub Actions workflow must pin actions and run the validated launcher across supported Node releases." >&2
  exit 1
fi

for trust_contract in \
  'requires a trusted pre-exec environment' \
  'dynamic loader environment' \
  'absolute `/usr/bin/env` and Node executables must' \
  'does not claim to defend against' \
  'same-privilege pre-exec loader'; do
  if ! grep -Fq "$trust_contract" "$README"; then
    printf '%s\n' "README must retain pre-exec trust boundary: $trust_contract" >&2
    exit 1
  fi
done

if [ ! -x "$CHECK_BOOTSTRAP" ] || \
   ! grep -Fq 'Trusted-environment convenience only' "$CHECK_BOOTSTRAP"; then
  printf '%s\n' "Shell helper must remain explicitly trusted-environment only." >&2
  exit 1
fi

if ! grep -Fq "permissions:" "$CI_WORKFLOW" || ! grep -Fq "contents: read" "$CI_WORKFLOW"; then
  printf '%s\n' "GitHub Actions workflow must keep repository access read-only." >&2
  exit 1
fi

if ! grep -Fq "workflow_dispatch:" "$CI_WORKFLOW" || ! grep -Fq "timeout-minutes: 5" "$CI_WORKFLOW"; then
  printf '%s\n' "GitHub Actions workflow must support bounded manual verification." >&2
  exit 1
fi

if ! grep -Fq "runs-on: ubuntu-24.04" "$CI_WORKFLOW" || ! grep -Fq "cancel-in-progress: true" "$CI_WORKFLOW"; then
  printf '%s\n' "GitHub Actions must use a stable runner and cancel superseded checks." >&2
  exit 1
fi

if [ "$(grep -Ec '^[[:space:]]*permissions:' "$CI_WORKFLOW")" -ne 1 ] || \
   [ "$(grep -Ec '^[[:space:]]+contents:[[:space:]]*read[[:space:]]*$' "$CI_WORKFLOW")" -ne 1 ] || \
   grep -Eq 'write-all|:[[:space:]]*write|continue-on-error:[[:space:]]*true|if:[[:space:]]*false' "$CI_WORKFLOW" || \
   [ "$(grep -Ec '^[[:space:]]*(-[[:space:]]+)?run:' "$CI_WORKFLOW")" -ne 1 ]; then
  printf '%s\n' "Check workflow must keep exact read-only permissions and one required command." >&2
  exit 1
fi

if ! grep -Fq "status: completed" "$CHECKOUT_CREDENTIAL_PLAN" || \
   ! grep -Fq "make check" "$CHECKOUT_CREDENTIAL_PLAN" || \
   ! grep -Fq "external working directory" "$CHECKOUT_CREDENTIAL_PLAN" || \
   ! grep -Fq "hostile mutations rejected" "$CHECKOUT_CREDENTIAL_PLAN"; then
  printf '%s\n' "Checkout credential plan must record completed local verification." >&2
  exit 1
fi

if ! grep -Fq "does not persist checkout credentials" "$README" || \
   ! grep -Fq "non-persisted checkout token" "$ROOT_DIR/SECURITY.md" || \
   ! grep -Fq "non-persisted checkout credentials" "$ROOT_DIR/VISION.md" || \
   ! grep -Fq "checkout credential persistence" "$ROOT_DIR/CHANGES.md"; then
  printf '%s\n' "Repository guidance must document the checkout credential boundary." >&2
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

if ! grep -Fq "setPendingTabBlockingState(request.tabId, tabBlockingState)" "$BACKGROUND"; then
  printf '%s\n' "Background redirect reservations must use the webRequest tab id." >&2
  exit 1
fi

if ! grep -Fq "function clearPendingTabBlockingState(tabid)" "$BACKGROUND" || \
   ! grep -Fq "clearPendingTabBlockingState(request.tabId)" "$BACKGROUND" || \
   grep -Fq "removeTabBlockingState(request.tabId)" "$BACKGROUND"; then
  printf '%s\n' "Allowed request start must clear only pending state until top-level commit." >&2
  exit 1
fi

if ! grep -Fq "function isValidTabId(tabid)" "$BACKGROUND"; then
  printf '%s\n' "Background state must centralize valid tab id checks." >&2
  exit 1
fi
for integer_tab_contract in \
  'isFinite(tabid)' \
  'Math.floor(tabid) === tabid' \
  'tabId: 1.5' \
  'tabId: Infinity' \
  'context.setTabBlockingState(2.5' \
  'context.setTabBlockingState(Infinity'; do
  if ! grep -Fq "$integer_tab_contract" "$BACKGROUND" "$BACKGROUND_TEST"; then
    printf '%s\n' "Finite integer tab-id contract is missing: $integer_tab_contract" >&2
    exit 1
  fi
done
for ui_integer_tab_contract in \
  'Math.floor(tab.id) === tab.id && tab.id >= 0;' \
  'for (const tab of [null, {}, {id: -1}, {id: 1.5}, {id: Infinity}])'; do
  if ! grep -Fq "$ui_integer_tab_contract" "$POPUP" "$BLOCKED_SITE" "$POPUP_TEST" "$BLOCKED_SITE_TEST"; then
    printf '%s\n' "Popup/blocked-page finite tab-id contract is missing: $ui_integer_tab_contract" >&2
    exit 1
  fi
done
for integer_doc in AGENTS.md README.md SECURITY.md VISION.md CHANGES.md; do
  if ! grep -Fq "Chrome Blocker accepts only finite integer tab IDs at runtime boundaries." "$ROOT_DIR/$integer_doc"; then
    printf '%s\n' "$integer_doc must document finite integer tab IDs." >&2
    exit 1
  fi
done
for integer_plan_contract in "Status: Completed" "make check" "hostile mutations"; do
  if ! grep -Fq "$integer_plan_contract" "$INTEGER_TAB_ID_PLAN"; then
    printf '%s\n' "Integer tab-id plan must record completed verification: $integer_plan_contract" >&2
    exit 1
  fi
done

if ! grep -Fq '!isValidTabId(request.tabId)' "$BACKGROUND"; then
  printf '%s\n' "Background interception must ignore requests that are not associated with a browser tab." >&2
  exit 1
fi

if ! grep -Fq "if (isValidTabId(tabid))" "$BACKGROUND"; then
  printf '%s\n' "Background state writes must ignore invalid tab ids." >&2
  exit 1
fi

if ! grep -Fq "setPendingTabBlockingState(tabid, normalizedSite)" "$BACKGROUND" || \
   ! grep -Fq "clearTabBlockingStatesForOrigin(normalizedSite)" "$BACKGROUND"; then
  printf '%s\n' "Background add/unlist paths must use centralized pending and committed state helpers." >&2
  exit 1
fi

if ! grep -Fq "function clearTabBlockingStatesForOrigin(blockedOrigin)" "$BACKGROUND" || \
   ! grep -Fq "Object.prototype.hasOwnProperty.call(tabBlockingMap, tabid)" "$BACKGROUND" || \
   ! grep -Fq "tabBlockingMap[tabid] === blockedOrigin" "$BACKGROUND" || \
   ! grep -Fq "pendingTabBlockingMap[pendingTabId] === blockedOrigin" "$BACKGROUND"; then
  printf '%s\n' "Global unlisting must clear only owned tab states for the matching origin." >&2
  exit 1
fi

if ! awk '
  /function unlistSite\(tabid, site, completion\)/ { in_unlist = 1 }
  in_unlist && /if \(normalizedSite === ""\)/ { guard = NR }
  in_unlist && /persistBlockedSites/ { write = NR }
  /function clearBlacklist\(completion\)/ {
    exit (guard && write && guard < write) ? 0 : 1
  }
  END { if (!in_unlist) exit 1 }
' "$BACKGROUND"; then
  printf '%s\n' "Global unlisting must reject invalid origins before persistence or tab cleanup." >&2
  exit 1
fi

if ! grep -Fq "chrome.tabs.onRemoved.addListener(removeTabBlockingState)" "$BACKGROUND"; then
  printf '%s\n' "Background state must be removed when tabs close." >&2
  exit 1
fi

if ! grep -Fq "setTabBlockingState(details.tabId, blockedOrigin, details.documentId)" "$BACKGROUND" || \
   ! grep -Fq "details.replacedTabId !== details.tabId" "$BACKGROUND" || \
   ! grep -Fq "removeTabBlockingState(details.replacedTabId)" "$BACKGROUND" || \
   grep -Fq "getTabState(details.replacedTabId)" "$BACKGROUND"; then
  printf '%s\n' "Background replacement handling must clean old ownership without transferring it." >&2
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

if ! grep -Fq 'action: "background:addBlockedSite"' "$POPUP" || \
   ! grep -Fq 'blockedSite: urlToBlock' "$POPUP"; then
  printf '%s\n' "Popup must delegate block-list persistence through the background message boundary." >&2
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

if ! grep -Fq 'if (blockedSite === "" || currentSite !== blockedSite)' "$CONTENT_SCRIPT"; then
  printf '%s\n' "Content redirects must ignore invalid or stale blocked origins." >&2
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

if ! grep -Fq 'if (!hasValidTabId(tab))' "$BLOCKED_SITE"; then
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
  /function updateCountdown\(\)/ { in_countdown = 1 }
  in_countdown && /withCurrentTab\(function\(tab\)/ { guarded = NR }
  in_countdown && /action: "background:unlistSite"/ { message = NR }
  in_countdown && /response.ok === true/ { acknowledged = NR }
  in_countdown && /window.location.href = site;/ { redirect = NR }
  /function clearCountdownTimer\(\)/ {
    exit (guarded && message && acknowledged && redirect &&
      guarded < message && message < acknowledged && acknowledged < redirect) ? 0 : 1
  }
  END { if (!in_countdown) exit 1 }
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

if ! grep -Fq "Non-tab main-frame requests are ignored" "$README"; then
  printf '%s\n' "README must document the non-tab request interception guard." >&2
  exit 1
fi

if ! grep -Fq 'tabId: -1' "$BACKGROUND_TEST" || \
   ! grep -Fq 'type: "main_frame"' "$BACKGROUND_TEST" || \
   ! grep -Fq 'Background startup, request, tab lifecycle, and global unlist tests passed.' "$BACKGROUND_TEST"; then
  printf '%s\n' "Background tests must execute the invalid-tab and valid main-frame request boundary." >&2
  exit 1
fi

for global_unlist_fixture in \
  'context.addBlockedSite(11, "https://example.com/path");' \
  'context.addBlockedSite(12, "https://example.com/another");' \
  'context.addBlockedSite(13, "https://other.test/path");' \
  'context.unlistSite(11, "https://example.com/private");' \
  'context.unlistSite(13, "javascript:alert(1)");'; do
  if ! grep -Fq "$global_unlist_fixture" "$BACKGROUND_TEST"; then
    printf '%s\n' "Background tests must preserve global-unlist fixture: $global_unlist_fixture" >&2
    exit 1
  fi
done

if ! grep -Fq 'assert.strictEqual(context.getTabState(12), 0);' "$BACKGROUND_TEST" || \
   ! grep -Fq 'assert.strictEqual(context.getTabState(13), "https://other.test");' "$BACKGROUND_TEST" || \
   ! grep -Fq 'assert.strictEqual(storedValues.length, writesBeforeInvalidUnlist);' "$BACKGROUND_TEST"; then
  printf '%s\n' "Background tests must verify matching multi-tab cleanup and unrelated-state preservation." >&2
  exit 1
fi

if ! grep -Fq 'listeners.onCommitted({tabId: 8, frameId: 0' "$BACKGROUND_TEST" || \
   ! grep -Fq '"blocked-before-allowed-navigation"' "$BACKGROUND_TEST" || \
   ! grep -Fq 'assert.strictEqual(context.getTabState(24), "https://example.com");' "$BACKGROUND_TEST" || \
   ! grep -Fq 'assert.strictEqual(context.pendingTabBlockingMap[24], undefined);' "$BACKGROUND_TEST" || \
   ! grep -Fq 'listeners.onTabReplaced({tabId: 9, replacedTabId: 7});' "$BACKGROUND_TEST" || \
   ! grep -Fq 'assert.strictEqual(context.tabBlockingDocumentMap[9], undefined);' "$BACKGROUND_TEST" || \
   ! grep -Fq 'assert.strictEqual(context.tabBlockingDocumentMap[19], "new-replacing-document");' "$BACKGROUND_TEST" || \
   ! grep -Fq 'listeners.onTabReplaced({tabId: -1, replacedTabId: 20});' "$BACKGROUND_TEST" || \
   ! grep -Fq 'listeners.onTabReplaced({tabId: 21, replacedTabId: 21});' "$BACKGROUND_TEST" || \
   ! grep -Fq '"self-replacement-document"' "$BACKGROUND_TEST" || \
   ! grep -Fq 'listeners.onTabReplaced({tabId: 23, replacedTabId: 22});' "$BACKGROUND_TEST" || \
   ! grep -Fq 'assert.strictEqual(context.pendingTabBlockingMap[22], undefined);' "$BACKGROUND_TEST" || \
   ! grep -Fq 'listeners.onRemoved(9);' "$BACKGROUND_TEST"; then
  printf '%s\n' "Background tests must execute tab initialization, replacement, and cleanup listeners." >&2
  exit 1
fi

if [ "$(grep -Fc 'tabId: -1' "$BACKGROUND_TEST")" -lt 1 ] || \
   [ "$(grep -Fc 'type: "main_frame"' "$BACKGROUND_TEST")" -lt 6 ] || \
   [ "$(grep -Fc 'type: "sub_frame"' "$BACKGROUND_TEST")" -lt 1 ]; then
  printf '%s\n' "Background tests must preserve invalid-tab, subframe, and valid main-frame fixtures." >&2
  exit 1
fi

for startup_source_contract in \
  'var blockedSitesReady = false;' \
  'var hydratedBlockedSites = normalizeBlockedList(items && items.blocked);' \
  'chrome.storage.local.set({blocked: hydratedBlockedSites}, function() {' \
  'blockedSites = hydratedBlockedSites;' \
  'return {cancel: true};' \
  'blockedSitesReady = true;'; do
  if [ "$(grep -Fc "$startup_source_contract" "$BACKGROUND")" -ne 1 ]; then
    printf '%s\n' "Background startup hydration contract must remain unique: $startup_source_contract" >&2
    exit 1
  fi
done

storage_initial_line=$(grep -nF 'var blockedSitesReady = false;' "$BACKGROUND" | cut -d: -f1)
storage_get_line=$(grep -nF 'chrome.storage.local.get("blocked", function(items)' "$BACKGROUND" | cut -d: -f1)
storage_read_error_line=$(grep -nF 'if (chrome.runtime.lastError)' "$BACKGROUND" | head -n 1 | cut -d: -f1)
storage_normalize_line=$(grep -nF 'var hydratedBlockedSites = normalizeBlockedList(items && items.blocked);' "$BACKGROUND" | cut -d: -f1)
storage_set_line=$(grep -nF 'chrome.storage.local.set({blocked: hydratedBlockedSites}, function() {' "$BACKGROUND" | cut -d: -f1)
storage_write_error_line=$(grep -nF 'if (chrome.runtime.lastError)' "$BACKGROUND" | sed -n '2p' | cut -d: -f1)
storage_publish_line=$(grep -nF 'blockedSites = hydratedBlockedSites;' "$BACKGROUND" | cut -d: -f1)
storage_ready_line=$(grep -nF 'blockedSitesReady = true;' "$BACKGROUND" | cut -d: -f1)
request_ready_guard_line=$(grep -nF 'if (!blockedSitesReady)' "$BACKGROUND" | tail -n 1 | cut -d: -f1)
request_cancel_line=$(grep -nF 'return {cancel: true};' "$BACKGROUND" | cut -d: -f1)
request_match_line=$(grep -nF 'var tabBlockingState = findBlockedSite(request.url);' "$BACKGROUND" | cut -d: -f1)
request_shape_line=$(grep -nF 'if (!request || request.type !== "main_frame" || !request.url ||' "$BACKGROUND" | cut -d: -f1)

for startup_line in "$storage_initial_line" "$storage_get_line" "$storage_read_error_line" "$storage_normalize_line" \
  "$storage_set_line" "$storage_write_error_line" "$storage_publish_line" "$storage_ready_line" "$request_ready_guard_line" \
  "$request_cancel_line" "$request_match_line" "$request_shape_line"; do
  if [ -z "$startup_line" ]; then
    printf '%s\n' "Startup hydration ordering markers must remain present." >&2
    exit 1
  fi
done

if [ "$storage_initial_line" -ge "$storage_get_line" ] || \
   [ "$storage_get_line" -ge "$storage_read_error_line" ] || \
   [ "$storage_read_error_line" -ge "$storage_normalize_line" ] || \
   [ "$storage_normalize_line" -ge "$storage_set_line" ] || \
   [ "$storage_set_line" -ge "$storage_write_error_line" ] || \
   [ "$storage_write_error_line" -ge "$storage_publish_line" ] || \
   [ "$storage_publish_line" -ge "$storage_ready_line" ] || \
   [ "$request_shape_line" -ge "$request_ready_guard_line" ] || \
   [ "$request_ready_guard_line" -ge "$request_cancel_line" ] || \
   [ "$request_cancel_line" -ge "$request_match_line" ]; then
  printf '%s\n' "Storage hydration and request enforcement must remain fail-closed in source order." >&2
  exit 1
fi

for startup_test_contract in \
  'function createBackgroundHarness(options)' \
  'const storageErrorHarness = createBackgroundHarness();' \
  '{message: "storage unavailable"}' \
  'assert.strictEqual(storageErrorHarness.context.blockedSitesReady, false);' \
  'assert.strictEqual(listeners.onBeforeRequest(null), undefined);' \
  'harness.finishStorageRead({blocked: ["https://example.com"]});' \
  'assert.strictEqual(context.blockedSitesReady, true);' \
  'url: "https://allowed.test/path"' \
  'Background startup, request, tab lifecycle, and global unlist tests passed.'; do
  if ! grep -Fq "$startup_test_contract" "$BACKGROUND_TEST"; then
    printf '%s\n' "Background VM test must preserve startup hydration fixture: $startup_test_contract" >&2
    exit 1
  fi
done

if ! grep -Fq "cancels valid main-frame navigation until local block-list hydration succeeds" "$README" || \
   ! grep -Fq "fail closed while local block-list storage is unresolved" "$ROOT_DIR/SECURITY.md" || \
   ! grep -Fq "fail-closed block-list startup hydration" "$ROOT_DIR/VISION.md" || \
   ! grep -Fq "Closed the asynchronous block-list startup interval" "$ROOT_DIR/CHANGES.md" || \
   ! grep -Fq "R5. A storage read error must leave hydration incomplete" "$STARTUP_HYDRATION_PLAN"; then
  printf '%s\n' "Startup hydration documentation and plan contracts must remain checked in." >&2
  exit 1
fi

for startup_plan_contract in \
  "status: completed" \
  "## Status: Completed" \
  "make verify" \
  "Five isolated hostile source mutations were rejected" \
  '`agent-browser` is unavailable'; do
  if ! grep -Fq "$startup_plan_contract" "$STARTUP_HYDRATION_PLAN"; then
    printf '%s\n' "Startup hydration plan must record completed verification: $startup_plan_contract" >&2
    exit 1
  fi
done

if [ ! -f "$ROOT_DIR/Makefile" ] || \
   ! grep -Fq 'CHROME_BLOCKER_REPOSITORY_MAKEFILE := 1' "$ROOT_DIR/Makefile" || \
   ! grep -Fq 'Private Chrome Blocker targets require the validated Node launcher' "$ROOT_DIR/Makefile" || \
   ! grep -Fq 'node scripts/run-make.js . check' "$ROOT_DIR/Makefile"; then
  printf '%s\n' "Makefile must delegate public checks to the validated launcher." >&2
  exit 1
fi

for launcher_contract in \
  "manifest.name !== 'GetToWork'" \
  "manifest.version !== '0.01'" \
  "'MAKEFLAGS'" \
  "'MAKEFILES'" \
  "'GNUMAKEFLAGS'" \
  "git(gitContext, ['archive', '--format=tar', head], null)" \
  'currentIdentity.ino !== expectedIdentity.ino' \
  "git(gitContext, ['status', '--porcelain=v1', '--untracked-files=all'], 'utf8')" \
  '`--git-dir=${context.gitDirectory}`' \
  '`--work-tree=${context.repository}`' \
  "GIT_CONFIG_NOSYSTEM: '1'" \
  "GIT_CONFIG_GLOBAL: '/dev/null'" \
  "resolveTool('git')" \
  "resolveTool('tar')" \
  "resolveTool('make')" \
  'resolveCurrentNode()' \
  "resolveTool('sh')" \
  'verifyTool(tools.git)' \
  'verifyTool(tools.tar)' \
  'verifyTool(tools.make)' \
  'verifyTool(tools.node)' \
  'verifyTool(tools.sh)' \
  'stat.uid !== tool.uid' \
  "environment.PATH = '/usr/bin:/bin'" \
  "['core.fsmonitor', 'false']" \
  "['core.filemode', 'true']" \
  "['core.symlinks', 'true']" \
  "['core.hooksPath', gitHooks]" \
  'context.configuration.flatMap' \
  "^filter\\\\..*\\\\.(clean|smudge|process|required)$" \
  "shell: false" \
  "targets.get(args[1])"; do
  if ! grep -Fq "$launcher_contract" "$MAKE_LAUNCHER"; then
    printf '%s\n' "Make launcher must retain contract: $launcher_contract" >&2
    exit 1
  fi
done

for gate_contract in \
  'crypto.timingSafeEqual' \
  'fs.realpathSync(process.cwd())' \
  "path.join(root, 'scripts', 'check-baseline.sh')" \
  "'test-background.js'" \
  'shell: false'; do
  if ! grep -Fq "$gate_contract" "$NODE_GATE"; then
    printf '%s\n' "Node gate must retain contract: $gate_contract" >&2
    exit 1
  fi
done

for launcher_test_contract in \
  'clean-child command clears NODE_OPTIONS before the Node child starts' \
  'clean-child command removes post-start Node, npm, shell, Git, and Make variables from every gate' \
  'path-safe launcher rejects extra arguments, flags, assignments, and unsupported targets' \
  'clean-child command uses absolute Node and ignores child PATH and startup variables' \
  'preserves hostile repository bytes through a symlink' \
  'rejects Make flags, assignments, external Makefiles, and extra targets' \
  'clears dangerous Make environment channels' \
  'ignores caller PATH wrappers for git, tar, make, node, npm, and sh' \
  'isolates Git repository, object, index, discovery, config, lock, and trace channels' \
  'disables repository-local fsmonitor configuration' \
  'disables repository-local clean and process filters' \
  'rejects tracked and untracked source changes' \
  'rejects mode, symlink, hardlink content, and staged index changes' \
  'private targets require launcher context' \
  'repository is replaced after validation' \
  'private targets support GNU Make 3.81 and 4.4.1 while launcher propagates gate failure'; do
  if ! grep -Fq "$launcher_test_contract" "$MAKE_LAUNCHER_TEST"; then
    printf '%s\n' "Launcher regression must retain: $launcher_test_contract" >&2
    exit 1
  fi
done

if ! grep -Fq 'action: "beginUnlist"' "$POPUP" || \
   ! grep -Fq 'tabId: tab.id' "$POPUP" || \
   ! grep -Fq 'blockedSite: normalizedSite' "$POPUP" || \
   ! grep -Fq 'function isValidUnlistMessage(message, tab)' "$BLOCKED_SITE" || \
   ! grep -Fq 'message.action === "beginUnlist"' "$BLOCKED_SITE" || \
   ! grep -Fq 'tab.id === message.tabId' "$BLOCKED_SITE" || \
   ! grep -Fq 'normalizeBlockedOrigin(message.blockedSite) === site' "$BLOCKED_SITE"; then
  printf '%s\n' "Popup and blocked page must preserve the typed unlist message boundary." >&2
  exit 1
fi

if ! grep -Fq 'const rejectedMessages = [' "$BLOCKED_SITE_TEST" || \
   ! grep -Fq '{action: "beginUnlist", tabId: 8' "$BLOCKED_SITE_TEST" || \
   ! grep -Fq 'blockedSite: "https://other.test"' "$BLOCKED_SITE_TEST" || \
   ! grep -Fq 'assert.strictEqual(intervalStarts, 0);' "$BLOCKED_SITE_TEST"; then
  printf '%s\n' "Blocked-page tests must cover primitive, wrong-tab, and wrong-origin rejection." >&2
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

if ! grep -Fq "background context owns block-list storage writes" "$README"; then
  printf '%s\n' "README must document background-owned block-list persistence." >&2
  exit 1
fi

if ! grep -Fq "background add and unblock paths use centralized tab state writes" "$README"; then
  printf '%s\n' "README must document centralized background tab-state writes." >&2
  exit 1
fi

if ! grep -Fq "tab replacement clears only the replaced tab's ownership" "$README"; then
  printf '%s\n' "README must document centralized tab lifecycle state ownership." >&2
  exit 1
fi

for replacement_contract in \
  '## Status: Accepted' \
  'webNavigation` documentation' \
  'fully loaded or prerendered page' \
  'never copy the old document ID' \
  '## Status: Completed' \
  'Remove only the replaced tab' \
  'Preserve the replacing tab' \
  'Five isolated hostile mutations were rejected' \
  '28213618025' \
  '28213618286'; do
  if ! grep -Fq "$replacement_contract" "$TAB_REPLACEMENT_DESIGN" "$TAB_REPLACEMENT_PLAN"; then
    printf '%s\n' "Tab replacement plans must preserve: $replacement_contract" >&2
    exit 1
  fi
done

if ! grep -Fq "global unlisting clears matching state across every tracked tab" "$README" || \
   ! grep -Fq "origin-wide tab-state cleanup" "$ROOT_DIR/VISION.md" || \
   ! grep -Fq "stale blocked state from every matching tab" "$ROOT_DIR/CHANGES.md" || \
   ! grep -Fq "R5. Background tests and the static baseline" "$GLOBAL_UNLIST_PLAN"; then
  printf '%s\n' "Global-unlist state consistency documentation and plan contracts must remain checked in." >&2
  exit 1
fi

if ! grep -Fq "blocked page validates the current tab before unlisting" "$README"; then
  printf '%s\n' "README must document blocked-page current-tab validation." >&2
  exit 1
fi

if ! grep -Fq "Popup unlist requests use a typed runtime message" "$README" || \
   ! grep -Fq "typed runtime requests" "$ROOT_DIR/CHANGES.md" || \
   ! grep -Fq "Require typed unlist messages" "$ROOT_DIR/VISION.md" || \
   ! grep -Fq "R5. Executable behavior tests and the static baseline" "$UNLIST_MESSAGE_PLAN" || \
   ! grep -Fq "status: completed" "$UNLIST_MESSAGE_PLAN" || \
   ! grep -Fq "Six isolated hostile mutations" "$UNLIST_MESSAGE_PLAN"; then
  printf '%s\n' "Typed unlist message documentation and plan contracts must remain checked in." >&2
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

if ! grep -Fq "GitHub Actions" "$README" ||
  ! grep -Fq "docs/plans/2026-06-10-ci-baseline.md" "$README" ||
  ! grep -Fq "GitHub Actions" "$ROOT_DIR/VISION.md" ||
  ! grep -Fq "GitHub Actions" "$ROOT_DIR/SECURITY.md" ||
  ! grep -Fq "GitHub Actions" "$ROOT_DIR/CHANGES.md"; then
  printf '%s\n' "Project docs must record the GitHub Actions CI baseline." >&2
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

if ! grep -Fq "Status: Completed" "$CI_PLAN" ||
  ! grep -Fq "make check" "$CI_PLAN"; then
  printf '%s\n' "Chrome blocker CI baseline plan must record completed status and make check verification." >&2
  exit 1
fi

if ! grep -Fq "Status: Completed" "$NON_TAB_REQUEST_PLAN" || \
   ! grep -Fq "make check" "$NON_TAB_REQUEST_PLAN"; then
  printf '%s\n' "Chrome blocker non-tab request plan must record completed status and make check verification." >&2
  exit 1
fi

if ! grep -Fq "Status: Completed" "$TAB_LIFECYCLE_PLAN" || \
   ! grep -Fq "make check" "$TAB_LIFECYCLE_PLAN"; then
  printf '%s\n' "Chrome blocker tab lifecycle helper plan must record completed status and make check verification." >&2
  exit 1
fi

for required_browser_path in "$ROOT_DIR/BROWSER_VERIFICATION.md" "$BROWSER_VERIFICATION_PLAN"; do
  if [ ! -f "$required_browser_path" ]; then
    printf '%s\n' "Required Chrome browser verification file is missing: ${required_browser_path#"$ROOT_DIR/"}" >&2
    exit 1
  fi
done

for browser_contract in \
  'commit SHA and pull request' \
  'synthetic hosts' \
  'Load unpacked extension' \
  'Empty startup hydration' \
  'Popup add site' \
  'Blocked navigation' \
  'Blocked-page unlist' \
  'Storage mutation failure' \
  'Extension reload' \
  'Multiple tabs' \
  'Closed tab cleanup' \
  'Split-incognito flow' \
  'Do not convert `not run` into passing evidence.' \
  'browsing history, profile paths, account data, cookies' \
  'The four rows marked `pass` were executed against exact runtime commit' \
  'All other rows remain unexecuted'; do
  if ! grep -Fq "$browser_contract" "$ROOT_DIR/BROWSER_VERIFICATION.md"; then
    printf '%s\n' "Chrome browser checklist must keep contract: $browser_contract" >&2
    exit 1
  fi
done

if ! grep -Fq 'BROWSER_VERIFICATION.md' "$README" || \
   ! grep -Fq 'explicit unexecuted rows' "$README" || \
   ! grep -Fq 'Complete the remaining Chrome Blocker browser verification matrix rows' "$ROOT_DIR/VISION.md" || \
   ! grep -Fq 'Verified exact blocked-document ownership in an isolated Chromium 133 profile.' "$ROOT_DIR/CHANGES.md"; then
  printf '%s\n' 'Project guidance must document completed and remaining Chrome browser evidence.' >&2
  exit 1
fi

for browser_plan_contract in \
  'Status: Completed' \
  'make check' \
  'hostile mutations' \
  'No unpacked extension, popup, live navigation, Chrome storage, normal-profile, or split-incognito scenario was executed'; do
  if ! grep -Fq "$browser_plan_contract" "$BROWSER_VERIFICATION_PLAN"; then
    printf '%s\n' "Chrome browser plan must keep completion evidence: $browser_plan_contract" >&2
    exit 1
  fi
done

printf '%s\n' "Chrome blocker baseline checks passed."
