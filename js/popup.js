var tabState = 0;

function hasValidTabId(tab) {
  return tab && typeof tab.id === "number";
}

function getCurrentTab(callback) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs && tabs.length > 0 && hasValidTabId(tabs[0])) {
      callback(tabs[0]);
    }
  });
}

function clearBlacklist() {
  chrome.runtime.sendMessage({action: "background:clearBlacklist"}, function(response) {
    if (chrome.runtime.lastError || !response || response.ok !== true) {
      return;
    }
    tabState = 0;
  });
}

function unlist() {
  var normalizedSite = normalizeBlockedOrigin(tabState);
  if (normalizedSite === "") {
    return;
  }

  getCurrentTab(function(tab) {
    chrome.runtime.sendMessage({
      action: "beginUnlist",
      tabId: tab.id,
      blockedSite: normalizedSite
    });
  });
}

function blacklistSite() {
  getCurrentTab(function(tab) {
    chrome.tabs.sendMessage(tab.id, {action: "geturl"}, function(response) {
      if (chrome.runtime.lastError || !response || !response.URL) {
        return;
      }

      var urlToBlock = normalizeBlockedOrigin(response.URL);
      if (urlToBlock === "") {
        return;
      }

      chrome.runtime.sendMessage({
        action: "background:addBlockedSite",
        tabId: tab.id,
        blockedSite: urlToBlock
      }, function(mutationResponse) {
        if (chrome.runtime.lastError || !mutationResponse ||
            mutationResponse.ok !== true) {
          return;
        }
        chrome.tabs.sendMessage(tab.id, {action: "redirect", blockedSite: urlToBlock});
      });
    });
  });
}

var triggered = 0;
if (triggered ++ == 0) {
  getCurrentTab(function(tab) {
    chrome.runtime.sendMessage({
      action: "background:getTabState",
      tabId: tab.id
    }, function(response) {
      if (chrome.runtime.lastError || !response || response.ok !== true) {
        return;
      }

      tabState = response.tabState;
      var button = $("#blacklistButton");
      if (tabState == 0) {
        button.click(blacklistSite);
        button.text("Blacklist site");
      } else {
        button.click(unlist);
        button.text("Remove " + tabState + " from the Blacklist");
      }
    });
  });    
}
