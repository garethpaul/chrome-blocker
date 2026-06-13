var blockedSites = [];
var blockedSitesReady = false;
var blockedSitesHydrationFailed = false;
var pendingBlockedListMutations = [];
var tabBlockingMap = {};

chrome.storage.local.get("blocked", function(items) {
  if (chrome.runtime.lastError) {
    blockedSitesHydrationFailed = true;
    pendingBlockedListMutations = [];
    return;
  }

  blockedSites = normalizeBlockedList(items && items.blocked);
  chrome.storage.local.set({blocked: blockedSites});
  blockedSitesReady = true;
  flushPendingBlockedListMutations();
});

function runBlockedListMutation(mutation) {
  if (blockedSitesHydrationFailed) {
    return;
  }

  if (!blockedSitesReady) {
    pendingBlockedListMutations.push(mutation);
    return;
  }

  mutation();
}

function flushPendingBlockedListMutations() {
  var queuedMutations = pendingBlockedListMutations;
  pendingBlockedListMutations = [];
  for (var i = 0; i < queuedMutations.length; ++i) {
    queuedMutations[i]();
  }
}

function addBlockedSite(tabid, blockedSite) {
  var normalizedSite = normalizeBlockedOrigin(blockedSite);
  if (normalizedSite === "") {
    return;
  }

  runBlockedListMutation(function() {
    if (blockedSites.indexOf(normalizedSite) === -1) {
      blockedSites.push(normalizedSite);
      chrome.storage.local.set({blocked: blockedSites});
    }
    setTabBlockingState(tabid, normalizedSite);
  });
}

function unlistSite(tabid, site) {
  var normalizedSite = normalizeBlockedOrigin(site);
  if (normalizedSite === "") {
    return;
  }

  runBlockedListMutation(function() {
    var i = blockedSites.indexOf(normalizedSite);
    if (i > -1)
      blockedSites.splice(i, 1);
    chrome.storage.local.set({blocked: blockedSites});
    clearTabBlockingStatesForOrigin(normalizedSite);
  });
}

function clearBlacklist() {
  runBlockedListMutation(function() {
    blockedSites = [];
    tabBlockingMap = {};
    chrome.storage.local.set({blocked: blockedSites});
  });
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

function isValidTabId(tabid) {
  return typeof tabid === "number" && tabid >= 0;
}

function setTabBlockingState(tabid, tabBlockingState) {
  if (isValidTabId(tabid)) {
    tabBlockingMap[tabid] = tabBlockingState;
  }
}

function removeTabBlockingState(tabid) {
  if (isValidTabId(tabid)) {
    delete tabBlockingMap[tabid];
  }
}

function clearTabBlockingStatesForOrigin(blockedOrigin) {
  for (var tabid in tabBlockingMap) {
    if (Object.prototype.hasOwnProperty.call(tabBlockingMap, tabid) &&
        tabBlockingMap[tabid] === blockedOrigin) {
      delete tabBlockingMap[tabid];
    }
  }
}

function requestChecker(request) {
  if (!request || request.type !== "main_frame" || !request.url ||
      !isValidTabId(request.tabId)) {
    return;
  }

  if (!blockedSitesReady) {
    return {cancel: true};
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
  if (details && isValidTabId(details.tabId) && !(details.tabId in tabBlockingMap)) {
    setTabBlockingState(details.tabId, 0);
  }
}

function updateReplacedTabMapping(details) {
  if (!details || !isValidTabId(details.tabId)) {
    return;
  }

  if (isValidTabId(details.replacedTabId)) {
    setTabBlockingState(details.tabId, getTabState(details.replacedTabId));
    removeTabBlockingState(details.replacedTabId);
  } else {
    updateMapping(details);
  }
}

chrome.tabs.onRemoved.addListener(removeTabBlockingState);
chrome.webNavigation.onTabReplaced.addListener(updateReplacedTabMapping);
chrome.webNavigation.onCommitted.addListener(updateMapping);
