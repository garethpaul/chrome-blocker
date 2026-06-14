const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function createBackgroundHarness() {
  const listeners = {};
  const storedValues = [];
  let storageGetCallback;
  const runtime = {
    id: "test-extension",
    lastError: null,
    getURL(resourcePath) {
      return "chrome-extension://test/" + resourcePath;
    },
    onMessage: {
      addListener(listener) {
        listeners.onMessage = listener;
      }
    }
  };
  const context = {
    URL,
    chrome: {
      runtime,
      storage: {
        local: {
          get(key, callback) {
            storageGetCallback = callback;
          },
          set(value) {
            storedValues.push(plain(value));
          }
        }
      },
      tabs: {
        onRemoved: {
          addListener(listener) {
            listeners.onRemoved = listener;
          }
        }
      },
      webNavigation: {
        onCommitted: {
          addListener(listener) {
            listeners.onCommitted = listener;
          }
        },
        onTabReplaced: {
          addListener(listener) {
            listeners.onTabReplaced = listener;
          }
        }
      },
      webRequest: {
        onBeforeRequest: {
          addListener(listener) {
            listeners.onBeforeRequest = listener;
          }
        }
      }
    },
    console
  };

  vm.createContext(context);
  for (const relativePath of ["js/urlRules.js", "js/background.js"]) {
    const source = fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
    vm.runInContext(source, context, {filename: relativePath});
  }

  return {
    context,
    listeners,
    storedValues,
    finishStorageRead(items, error) {
      runtime.lastError = error || null;
      storageGetCallback(items);
      runtime.lastError = null;
    }
  };
}

const storageErrorHarness = createBackgroundHarness();
storageErrorHarness.context.addBlockedSite(5, "https://queued.test/path");
assert.strictEqual(storageErrorHarness.context.pendingBlockedListMutations.length, 1);
assert.deepStrictEqual(
  plain(storageErrorHarness.listeners.onBeforeRequest({
    tabId: 4,
    type: "main_frame",
    url: "https://example.com/private"
  })),
  {cancel: true}
);
storageErrorHarness.finishStorageRead(
  {blocked: ["https://example.com"]},
  {message: "storage unavailable"}
);
assert.strictEqual(storageErrorHarness.context.blockedSitesReady, false);
assert.strictEqual(storageErrorHarness.context.pendingBlockedListMutations.length, 0);
assert.strictEqual(storageErrorHarness.context.getTabState(5), 0);
assert.strictEqual(storageErrorHarness.context.blockedSitesHydrationFailed, true);
storageErrorHarness.context.addBlockedSite(6, "https://after-error.test/path");
assert.strictEqual(storageErrorHarness.context.pendingBlockedListMutations.length, 0);
assert.strictEqual(storageErrorHarness.context.getTabState(6), 0);
assert.strictEqual(storageErrorHarness.storedValues.length, 0);
assert.deepStrictEqual(
  plain(storageErrorHarness.listeners.onBeforeRequest({
    tabId: 4,
    type: "main_frame",
    url: "https://example.com/private"
  })),
  {cancel: true}
);

const queuedMutationHarness = createBackgroundHarness();
queuedMutationHarness.context.addBlockedSite(5, "https://queued.test/path");
assert.strictEqual(queuedMutationHarness.context.pendingBlockedListMutations.length, 1);
assert.strictEqual(queuedMutationHarness.storedValues.length, 0);
assert.strictEqual(queuedMutationHarness.context.getTabState(5), 0);
queuedMutationHarness.finishStorageRead({blocked: ["https://existing.test"]});
assert.strictEqual(queuedMutationHarness.context.pendingBlockedListMutations.length, 0);
assert.deepStrictEqual(plain(queuedMutationHarness.storedValues), [
  {blocked: ["https://existing.test"]},
  {blocked: ["https://existing.test", "https://queued.test"]}
]);
assert.strictEqual(
  queuedMutationHarness.context.getTabState(5),
  "https://queued.test"
);

const harness = createBackgroundHarness();
const {context, listeners, storedValues} = harness;
assert.strictEqual(typeof listeners.onBeforeRequest, "function");
assert.strictEqual(typeof listeners.onMessage, "function");
assert.strictEqual(typeof context.clearTabBlockingStatesForOrigin, "function");
assert.strictEqual(context.blockedSitesReady, false);
assert.strictEqual(storedValues.length, 0);

assert.strictEqual(listeners.onBeforeRequest(null), undefined);

assert.strictEqual(
  listeners.onBeforeRequest({
    tabId: -1,
    type: "main_frame",
    url: "https://example.com/private"
  }),
  undefined
);

assert.strictEqual(
  listeners.onBeforeRequest({
    tabId: 7,
    type: "sub_frame",
    url: "https://example.com/private"
  }),
  undefined
);

assert.deepStrictEqual(
  plain(listeners.onBeforeRequest({
    tabId: 7,
    type: "main_frame",
    url: "https://example.com/private"
  })),
  {cancel: true}
);
assert.strictEqual(context.getTabState(7), 0);

harness.finishStorageRead({blocked: ["https://example.com"]});
assert.strictEqual(context.blockedSitesReady, true);
assert.deepStrictEqual(plain(storedValues[0]), {blocked: ["https://example.com"]});

assert.deepStrictEqual(
  plain(listeners.onBeforeRequest({
    tabId: 7,
    type: "main_frame",
    url: "https://example.com/private"
  })),
  {
    redirectUrl: "chrome-extension://test/blockedSite.html?blocked=" +
      encodeURIComponent("https://example.com")
  }
);
assert.strictEqual(context.getTabState(7), "https://example.com");

assert.strictEqual(
  listeners.onBeforeRequest({
    tabId: 6,
    type: "main_frame",
    url: "https://allowed.test/path"
  }),
  undefined
);
assert.strictEqual(context.getTabState(6), 0);

function sendBackgroundMessage(message, senderId, senderUrl) {
  let response;
  listeners.onMessage(message, {
    id: senderId || "test-extension",
    url: senderUrl || "chrome-extension://test/popup.html"
  }, function(value) {
    response = plain(value);
  });
  return response;
}

assert.strictEqual(
  sendBackgroundMessage({action: "background:getTabState", tabId: 7}, "other-extension"),
  undefined
);
assert.strictEqual(
  sendBackgroundMessage(
    {action: "background:getTabState", tabId: 7},
    "test-extension",
    "https://example.com/"
  ),
  undefined
);
assert.deepStrictEqual(
  sendBackgroundMessage({action: "background:getTabState", tabId: 7}),
  {ok: true, tabState: "https://example.com"}
);
assert.strictEqual(
  sendBackgroundMessage({action: "background:addBlockedSite", tabId: -2,
    blockedSite: "https://invalid.test"}),
  undefined
);
assert.deepStrictEqual(
  sendBackgroundMessage({action: "background:addBlockedSite", tabId: 14,
    blockedSite: "https://message.test/path"}),
  {ok: true}
);
assert.strictEqual(context.getTabState(14), "https://message.test");
assert.strictEqual(
  sendBackgroundMessage({action: "background:unlistSite", tabId: 14,
    blockedSite: "javascript:alert(1)"}),
  undefined
);
assert.deepStrictEqual(
  sendBackgroundMessage({action: "background:unlistSite", tabId: 14,
    blockedSite: "https://message.test/other"}, undefined,
    "chrome-extension://test/blockedSite.html"),
  {ok: true}
);
assert.strictEqual(context.getTabState(14), 0);

assert.strictEqual(typeof listeners.onCommitted, "function");
listeners.onCommitted({tabId: 8});
assert.strictEqual(context.getTabState(8), 0);

listeners.onTabReplaced({tabId: 9, replacedTabId: 7});
assert.strictEqual(context.getTabState(9), "https://example.com");
assert.strictEqual(context.getTabState(7), 0);

listeners.onTabReplaced({tabId: 10, replacedTabId: -1});
assert.strictEqual(context.getTabState(10), 0);

listeners.onRemoved(9);
assert.strictEqual(context.getTabState(9), 0);

context.addBlockedSite(11, "https://example.com/path");
context.addBlockedSite(12, "https://example.com/another");
context.addBlockedSite(13, "https://other.test/path");
assert.strictEqual(context.getTabState(11), "https://example.com");
assert.strictEqual(context.getTabState(12), "https://example.com");
assert.strictEqual(context.getTabState(13), "https://other.test");

const writesBeforeUnlist = storedValues.length;
context.unlistSite(11, "https://example.com/private");
assert.strictEqual(storedValues.length, writesBeforeUnlist + 1);
assert.deepStrictEqual(plain(storedValues[storedValues.length - 1]), {
  blocked: ["https://other.test"]
});
assert.strictEqual(context.getTabState(11), 0);
assert.strictEqual(context.getTabState(12), 0);
assert.strictEqual(context.getTabState(13), "https://other.test");

const writesBeforeInvalidUnlist = storedValues.length;
context.unlistSite(13, "javascript:alert(1)");
assert.strictEqual(storedValues.length, writesBeforeInvalidUnlist);
assert.strictEqual(context.getTabState(13), "https://other.test");

const writesBeforeMessageClear = storedValues.length;
assert.deepStrictEqual(
  sendBackgroundMessage({action: "background:clearBlacklist"}),
  {ok: true}
);
assert.strictEqual(storedValues.length, writesBeforeMessageClear + 1);
assert.deepStrictEqual(plain(storedValues[storedValues.length - 1]), {blocked: []});

console.log("Background startup, request, tab lifecycle, and global unlist tests passed.");
