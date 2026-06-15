var site = getBlockedOriginFromSearch(window.location.search);
if (site === "") {
  $("#blockMessage").text("This site has been blocked.");
} else {
  $("#blockMessage").text(site + " has been blacklisted.");
}

var content = $("#countdown");
var i = 15;
var interval = 0;

function withCurrentTab(callback) {
  chrome.tabs.getCurrent(function(tab) {
    if (!tab || typeof tab.id !== "number") {
      return;
    }

    callback(tab);
  });
}

function updateCountdown() {
  if (site === "") {
    return;
  }

  content.text("Unlisting " + site + " in " + --i + " seconds...");
  if (i == 0) {
    clearInterval(interval);
    withCurrentTab(function(tab) {
      chrome.runtime.sendMessage({
        action: "background:unlistSite",
        tabId: tab.id,
        blockedSite: site
      }, function(response) {
        if (!chrome.runtime.lastError && response && response.ok === true) {
          window.location.href = site;
        }
      });
    });
  }
}

function clearCountdownTimer() {
  if (interval) {
    clearInterval(interval);
    interval = 0;
  }
}

function beginCountdown() {
  clearCountdownTimer();
  i = 15;
  content.text("Unlisting " + site + " in " + i + " seconds...");
  interval = setInterval(function() {updateCountdown(i)}, 1000);
}

function modalHidden() {
  clearCountdownTimer();
}

function hideModal() {
  $("#unlistModal").modal("hide");
}

function isValidUnlistMessage(message, tab) {
  if (site === "" || !message || typeof message !== "object") {
    return false;
  }

  return message.action === "beginUnlist" &&
      typeof message.tabId === "number" &&
      tab.id === message.tabId &&
      normalizeBlockedOrigin(message.blockedSite) === site;
}

function isTrustedPopupSender(sender) {
  return sender && sender.id === chrome.runtime.id &&
      sender.url === chrome.runtime.getURL("popup.html");
}

$("#unlistModal").on('hidden', modalHidden);
$("#cancelUnlist").click(hideModal);

chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
  if (!isTrustedPopupSender(sender)) {
    return;
  }

  withCurrentTab(function(tab) {
    if (isValidUnlistMessage(message, tab)) {
      $("#unlistModal").modal("show");
      beginCountdown();
    }
  });
});
