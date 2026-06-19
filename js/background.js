var blockedSites = [];
var blockedSitesReady = false;
var blockedSitesHydrationFailed = false;
var pendingBlockedListMutations = [];
var blockedListMutationInProgress = false;
var tabBlockingMap = {};
var tabBlockingDocumentMap = {};
var pendingTabBlockingMap = {};

chrome.storage.local.get("blocked", function(items) {
  if (chrome.runtime.lastError) {
    failBlockedListHydration();
    return;
  }

  var hydratedBlockedSites = normalizeBlockedList(items && items.blocked);
  chrome.storage.local.set({blocked: hydratedBlockedSites}, function() {
    if (chrome.runtime.lastError) {
      failBlockedListHydration();
      return;
    }

    blockedSites = hydratedBlockedSites;
    blockedSitesReady = true;
    flushPendingBlockedListMutations();
  });
});

function failBlockedListHydration() {
  blockedSitesHydrationFailed = true;
  var queuedMutations = pendingBlockedListMutations;
  pendingBlockedListMutations = [];
  for (var i = 0; i < queuedMutations.length; ++i) {
    queuedMutations[i].completion(false);
  }
}

function runBlockedListMutation(mutation, completion) {
  var mutationCompletion = typeof completion === "function" ? completion : function() {};
  if (blockedSitesHydrationFailed) {
    mutationCompletion(false);
    return;
  }

  pendingBlockedListMutations.push({
    mutation: mutation,
    completion: mutationCompletion
  });
  flushPendingBlockedListMutations();
}

function flushPendingBlockedListMutations() {
  if (!blockedSitesReady || blockedListMutationInProgress ||
      pendingBlockedListMutations.length === 0) {
    return;
  }

  var queuedMutation = pendingBlockedListMutations.shift();
  blockedListMutationInProgress = true;
  queuedMutation.mutation(function(success) {
    blockedListMutationInProgress = false;
    queuedMutation.completion(success);
    flushPendingBlockedListMutations();
  });
}

function persistBlockedSites(nextBlockedSites, commit, completion) {
  chrome.storage.local.set({blocked: nextBlockedSites}, function() {
    if (chrome.runtime.lastError) {
      completion(false);
      return;
    }

    blockedSites = nextBlockedSites;
    commit();
    completion(true);
  });
}

function addBlockedSite(tabid, blockedSite, completion) {
  var normalizedSite = normalizeBlockedOrigin(blockedSite);
  if (normalizedSite === "") {
    if (typeof completion === "function") {
      completion(false);
    }
    return;
  }

  runBlockedListMutation(function(done) {
    if (blockedSites.indexOf(normalizedSite) !== -1) {
      setPendingTabBlockingState(tabid, normalizedSite);
      done(true);
      return;
    }

    var nextBlockedSites = blockedSites.slice();
    nextBlockedSites.push(normalizedSite);
    persistBlockedSites(nextBlockedSites, function() {
      setPendingTabBlockingState(tabid, normalizedSite);
    }, done);
  }, completion);
}

function unlistSite(tabid, site, completion) {
  var normalizedSite = normalizeBlockedOrigin(site);
  if (normalizedSite === "") {
    if (typeof completion === "function") {
      completion(false);
    }
    return;
  }

  runBlockedListMutation(function(done) {
    var nextBlockedSites = blockedSites.slice();
    var i = blockedSites.indexOf(normalizedSite);
    if (i > -1)
      nextBlockedSites.splice(i, 1);
    persistBlockedSites(nextBlockedSites, function() {
      clearTabBlockingStatesForOrigin(normalizedSite);
    }, done);
  }, completion);
}

function clearBlacklist(completion) {
  runBlockedListMutation(function(done) {
    persistBlockedSites([], function() {
      tabBlockingMap = {};
      tabBlockingDocumentMap = {};
      pendingTabBlockingMap = {};
    }, done);
  }, completion);
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
  return typeof tabid === "number" && isFinite(tabid) &&
      Math.floor(tabid) === tabid && tabid >= 0;
}

function setTabBlockingState(tabid, tabBlockingState, documentId) {
  if (isValidTabId(tabid)) {
    tabBlockingMap[tabid] = tabBlockingState;
    if (typeof documentId === "string" && documentId !== "") {
      tabBlockingDocumentMap[tabid] = documentId;
    } else {
      delete tabBlockingDocumentMap[tabid];
    }
  }
}

function setPendingTabBlockingState(tabid, tabBlockingState) {
  if (isValidTabId(tabid)) {
    pendingTabBlockingMap[tabid] = tabBlockingState;
  }
}

function removeTabBlockingState(tabid) {
  if (isValidTabId(tabid)) {
    delete tabBlockingMap[tabid];
    delete tabBlockingDocumentMap[tabid];
    delete pendingTabBlockingMap[tabid];
  }
}

function clearTabBlockingStatesForOrigin(blockedOrigin) {
  for (var tabid in tabBlockingMap) {
    if (Object.prototype.hasOwnProperty.call(tabBlockingMap, tabid) &&
        tabBlockingMap[tabid] === blockedOrigin) {
      delete tabBlockingMap[tabid];
      delete tabBlockingDocumentMap[tabid];
    }
  }
  for (var pendingTabId in pendingTabBlockingMap) {
    if (Object.prototype.hasOwnProperty.call(pendingTabBlockingMap, pendingTabId) &&
        pendingTabBlockingMap[pendingTabId] === blockedOrigin) {
      delete pendingTabBlockingMap[pendingTabId];
    }
  }
}

function isTrustedPopupSender(sender) {
  return sender && sender.id === chrome.runtime.id &&
      sender.url === chrome.runtime.getURL("popup.html");
}

function getBlockedPageOrigin(candidateUrl) {
  var blockedPageUrl = chrome.runtime.getURL("blockedSite.html");
  if (typeof candidateUrl !== "string" ||
      candidateUrl.indexOf(blockedPageUrl + "?blocked=") !== 0) {
    return "";
  }

  var blockedOrigin = getBlockedOriginFromSearch(
      candidateUrl.substring(blockedPageUrl.length));
  if (blockedOrigin === "" || candidateUrl !== blockedPageUrl +
      "?blocked=" + encodeURIComponent(blockedOrigin)) {
    return "";
  }

  return blockedOrigin;
}

function getTrustedBlockedPageOrigin(sender) {
  if (!sender || sender.id !== chrome.runtime.id) {
    return "";
  }

  return getBlockedPageOrigin(sender.url);
}

function hasTrustedBlockedPageState(sender, tabid, blockedOrigin) {
  return isValidTabId(tabid) && sender && sender.tab &&
      isValidTabId(sender.tab.id) && sender.tab.id === tabid &&
      sender.frameId === 0 && typeof sender.documentId === "string" &&
      sender.documentId !== "" &&
      tabBlockingDocumentMap[tabid] === sender.documentId &&
      getTabState(tabid) === blockedOrigin;
}

function handleBackgroundMessage(message, sender, sendResponse) {
  if (!message || typeof message !== "object") {
    return;
  }

  var popupAction = message.action === "background:getTabState" ||
      message.action === "background:addBlockedSite" ||
      message.action === "background:clearBlacklist";
  var blockedPageOrigin = getTrustedBlockedPageOrigin(sender);
  if ((popupAction && !isTrustedPopupSender(sender)) ||
      (message.action === "background:unlistSite" &&
       (blockedPageOrigin === "" || blockedPageOrigin !==
        normalizeBlockedOrigin(message.blockedSite) ||
        !hasTrustedBlockedPageState(sender, message.tabId, blockedPageOrigin)))) {
    return;
  }

  if (message.action === "background:getTabState" &&
      isValidTabId(message.tabId)) {
    sendResponse({ok: true, tabState: getTabState(message.tabId)});
  } else if (message.action === "background:addBlockedSite" &&
      isValidTabId(message.tabId) &&
      normalizeBlockedOrigin(message.blockedSite) !== "") {
    addBlockedSite(message.tabId, message.blockedSite, function(success) {
      sendResponse({ok: success});
    });
    return true;
  } else if (message.action === "background:unlistSite" &&
      isValidTabId(message.tabId) &&
      normalizeBlockedOrigin(message.blockedSite) !== "") {
    unlistSite(message.tabId, message.blockedSite, function(success) {
      sendResponse({ok: success});
    });
    return true;
  } else if (message.action === "background:clearBlacklist") {
    clearBlacklist(function(success) {
      sendResponse({ok: success});
    });
    return true;
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

  if (tabBlockingState !== 0) {
    setPendingTabBlockingState(request.tabId, tabBlockingState);
    var redirectUrl = chrome.runtime.getURL(
        "blockedSite.html?blocked=" + encodeURIComponent(tabBlockingState));
    return { redirectUrl: redirectUrl };
  }

  removeTabBlockingState(request.tabId);
}

chrome.webRequest.onBeforeRequest.addListener(
  requestChecker, {urls: ["http://*/*", "https://*/*"]}, ["blocking"]);

function updateMapping(details) {
  if (!details || !isValidTabId(details.tabId) || details.frameId !== 0) {
    return;
  }

  var blockedOrigin = getBlockedPageOrigin(details.url);
  if (blockedOrigin !== "" &&
      pendingTabBlockingMap[details.tabId] === blockedOrigin) {
    setTabBlockingState(details.tabId, blockedOrigin, details.documentId);
    delete pendingTabBlockingMap[details.tabId];
  } else {
    removeTabBlockingState(details.tabId);
  }
}

function updateReplacedTabMapping(details) {
  if (!details || !isValidTabId(details.tabId)) {
    return;
  }

  if (isValidTabId(details.replacedTabId)) {
    setTabBlockingState(details.tabId, getTabState(details.replacedTabId),
        tabBlockingDocumentMap[details.replacedTabId]);
    if (Object.prototype.hasOwnProperty.call(
        pendingTabBlockingMap, details.replacedTabId)) {
      setPendingTabBlockingState(
          details.tabId, pendingTabBlockingMap[details.replacedTabId]);
    }
    removeTabBlockingState(details.replacedTabId);
  } else {
    updateMapping(details);
  }
}

chrome.tabs.onRemoved.addListener(removeTabBlockingState);
chrome.webNavigation.onTabReplaced.addListener(updateReplacedTabMapping);
chrome.webNavigation.onCommitted.addListener(updateMapping);
chrome.runtime.onMessage.addListener(handleBackgroundMessage);
