var tabState = 0;

function getCurrentTab(callback) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs && tabs.length > 0) {
      callback(tabs[0]);
    }
  });
}

function clearBlacklist() {
  chrome.extension.getBackgroundPage().clearBlacklist();
}

function unlist() {
  getCurrentTab(function(tab) {
    chrome.runtime.sendMessage(tab.id);
  });
}

function blacklistSite() {
  chrome.storage.local.get("blocked", function(items) {
    var blockedSites = normalizeBlockedList(items.blocked);

    getCurrentTab(function(tab) {
      chrome.tabs.sendMessage(tab.id, {action: "geturl"}, function(response) {
        if (chrome.runtime.lastError || !response || !response.URL) {
          return;
        }

        var urlToBlock = normalizeBlockedOrigin(response.URL);
        if (urlToBlock === "") {
          return;
        }

        if (blockedSites.indexOf(urlToBlock) === -1) {
          blockedSites.push(urlToBlock);

          chrome.extension.getBackgroundPage().addBlockedSite(tab.id, urlToBlock);

          chrome.storage.local.set({blocked: blockedSites});
        }
        chrome.tabs.sendMessage(tab.id, {action: "redirect", blockedSite: urlToBlock});
      });
    });
  });
}

var triggered = 0;
if (triggered ++ == 0) {
  getCurrentTab(function(tab) {
    tabState = chrome.extension.getBackgroundPage().getTabState(tab.id);
    var button = $("#blacklistButton");
    if (tabState == 0) {
      button.click(blacklistSite);
      button.text("Blacklist site");
    } else {
      button.click(unlist);
      button.text("Remove " + tabState + " from the Blacklist");
    }
  });    
}
