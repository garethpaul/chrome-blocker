var site = getBlockedOriginFromSearch(window.location.search);
if (site === "") {
  $("#blockMessage").text("This site has been blocked.");
} else {
  $("#blockMessage").text(site + " has been blacklisted.");
}

var content = $("#countdown");
var i = 15;
var interval = 0;

function updateCountdown() {
  if (site === "") {
    return;
  }

  content.text("Unlisting " + site + " in " + --i + " seconds...");
  if (i == 0) {
    clearInterval(interval);
    chrome.tabs.getCurrent(function(tab) {
      chrome.extension.getBackgroundPage().unlistSite(tab.id, site);
    });
    window.location.href = site;
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

$("#unlistModal").on('hidden', modalHidden);
$("#cancelUnlist").click(hideModal);

chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
  chrome.tabs.getCurrent(function(tab) {
    if (site !== "" && tab.id == message) {
      $("#unlistModal").modal("show");
      beginCountdown();
    }
  });
});
