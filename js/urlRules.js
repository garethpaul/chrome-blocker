(function(root) {
  function normalizeBlockedOrigin(rawUrl) {
    if (typeof rawUrl !== "string") {
      return "";
    }

    var trimmedUrl = rawUrl.trim();
    if (trimmedUrl === "") {
      return "";
    }

    try {
      var parsedUrl = new URL(trimmedUrl);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return "";
      }

      return parsedUrl.origin.toLowerCase();
    } catch (error) {
      return "";
    }
  }

  function normalizeBlockedList(rawList) {
    var normalizedList = [];
    var seen = {};
    if (!Array.isArray(rawList)) {
      return normalizedList;
    }

    for (var i = 0; i < rawList.length; i++) {
      var normalizedOrigin = normalizeBlockedOrigin(rawList[i]);
      if (normalizedOrigin !== "" && !seen[normalizedOrigin]) {
        seen[normalizedOrigin] = true;
        normalizedList.push(normalizedOrigin);
      }
    }

    return normalizedList;
  }

  function requestMatchesBlockedSite(requestUrl, blockedSite) {
    var requestOrigin = normalizeBlockedOrigin(requestUrl);
    var blockedOrigin = normalizeBlockedOrigin(blockedSite);

    return requestOrigin !== "" && blockedOrigin !== "" && requestOrigin === blockedOrigin;
  }

  function getBlockedOriginFromSearch(search) {
    var match = /(?:^\?|&)blocked=([^&]+)/.exec(search || "");
    if (!match) {
      return "";
    }

    try {
      return normalizeBlockedOrigin(decodeURIComponent(match[1]));
    } catch (error) {
      return "";
    }
  }

  root.normalizeBlockedOrigin = normalizeBlockedOrigin;
  root.normalizeBlockedList = normalizeBlockedList;
  root.requestMatchesBlockedSite = requestMatchesBlockedSite;
  root.getBlockedOriginFromSearch = getBlockedOriginFromSearch;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      getBlockedOriginFromSearch: getBlockedOriginFromSearch,
      normalizeBlockedList: normalizeBlockedList,
      normalizeBlockedOrigin: normalizeBlockedOrigin,
      requestMatchesBlockedSite: requestMatchesBlockedSite
    };
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
