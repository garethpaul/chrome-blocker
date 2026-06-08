// var blockedRoot = "";

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
  if (!request || !request.action) {
    return;
  }

  if (request.action == "geturl")
    sendResponse({URL: document.location.href});
  else if (request.action == "redirect") {
    window.location = chrome.runtime.getURL(
      "blockedSite.html?blocked=" + encodeURIComponent(request.blockedSite));
  }
});
