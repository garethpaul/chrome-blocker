var blockedSites = [];
var tabBlockingMap = {};

chrome.storage.local.get("blocked", function(items) {
  blockedSites = normalizeBlockedList(items.blocked);
  chrome.storage.local.set({blocked: blockedSites});
});

function addBlockedSite(tabid, blockedSite) {
  var normalizedSite = normalizeBlockedOrigin(blockedSite);
  if (normalizedSite === "") {
    return;
  }

  if (blockedSites.indexOf(normalizedSite) === -1) {
    blockedSites.push(normalizedSite);
    chrome.storage.local.set({blocked: blockedSites});
  }
  tabBlockingMap[tabid] = normalizedSite;
}

function unlistSite(tabid, site) {
  var normalizedSite = normalizeBlockedOrigin(site);
  var i = blockedSites.indexOf(normalizedSite);
  if (i > -1)
    blockedSites.splice(i, 1);
  chrome.storage.local.set({blocked: blockedSites});
  tabBlockingMap[tabid] = 0;
}

function clearBlacklist() {
  blockedSites = [];
  tabBlockingMap = {};
  chrome.storage.local.set({blocked: blockedSites});
}

function getTabState(tabid) {
  return tabBlockingMap[tabid] || 0;
}

function findBlockedSite(requestUrl) {
  for (var i = 0; i < blockedSites.length; ++i) {
    if (requestMatchesBlockedSite(requestUrl, blockedSites[i])) {
      return blockedSites[i];
    }
  }

  return 0;
}

function setTabBlockingState(tabid, tabBlockingState) {
  if (typeof tabid === "number" && tabid >= 0) {
    tabBlockingMap[tabid] = tabBlockingState;
  }
}

function requestChecker(request) {
  if (!request || request.type !== "main_frame" || !request.url) {
    return;
  }

  var tabBlockingState = findBlockedSite(request.url);
  setTabBlockingState(request.tabId, tabBlockingState);

  if (tabBlockingState !== 0) {
    var redirectUrl = chrome.runtime.getURL(
        "blockedSite.html?blocked=" + encodeURIComponent(tabBlockingState));
    return { redirectUrl: redirectUrl };
  }
}

chrome.webRequest.onBeforeRequest.addListener(
  requestChecker, {urls: ["http://*/*", "https://*/*"]}, ["blocking"]);

function updateMapping(details) {
  if (details && typeof details.tabId !== "undefined" && !(details.tabId in tabBlockingMap)) {
    tabBlockingMap[details.tabId] = 0;
  }
}

function updateReplacedTabMapping(details) {
  if (!details || typeof details.tabId === "undefined") {
    return;
  }

  if (typeof details.replacedTabId !== "undefined") {
    tabBlockingMap[details.tabId] = tabBlockingMap[details.replacedTabId] || 0;
    delete tabBlockingMap[details.replacedTabId];
  } else {
    updateMapping(details);
  }
}

chrome.webNavigation.onTabReplaced.addListener(updateReplacedTabMapping);
chrome.webNavigation.onCommitted.addListener(updateMapping);
