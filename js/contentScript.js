function isTrustedPopupSender(sender) {
  return sender && sender.id === chrome.runtime.id &&
      sender.url === chrome.runtime.getURL("popup.html");
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
  if (!isTrustedPopupSender(sender) || !request ||
      typeof request !== "object") {
    return;
  }

  if (request.action === "geturl") {
    sendResponse({URL: document.location.href});
  } else if (request.action === "redirect") {
    var blockedSite = normalizeBlockedOrigin(request.blockedSite);
    var currentSite = normalizeBlockedOrigin(document.location.href);
    if (blockedSite === "" || currentSite !== blockedSite) {
      return;
    }

    window.location = chrome.runtime.getURL(
      "blockedSite.html?blocked=" + encodeURIComponent(blockedSite));
  }
});
