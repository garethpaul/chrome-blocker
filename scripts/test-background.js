const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function createBackgroundHarness(options) {
  options = options || {};
  const listeners = {};
  const storedValues = [];
  const pendingStorageWrites = [];
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
          set(value, callback) {
            storedValues.push(plain(value));
            if (!callback) {
              return;
            }
            if (options.deferStorageWrites) {
              pendingStorageWrites.push(callback);
            } else {
              callback();
            }
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
    pendingStorageWrites,
    storedValues,
    finishStorageRead(items, error) {
      runtime.lastError = error || null;
      storageGetCallback(items);
      runtime.lastError = null;
    },
    finishStorageWrite(error) {
      assert.ok(pendingStorageWrites.length > 0, "expected a pending storage write");
      const callback = pendingStorageWrites.shift();
      runtime.lastError = error || null;
      callback();
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

const queuedMutationHarness = createBackgroundHarness({deferStorageWrites: true});
let queuedMutationResult;
queuedMutationHarness.context.addBlockedSite(5, "https://queued.test/path", function(success) {
  queuedMutationResult = success;
});
assert.strictEqual(queuedMutationHarness.context.pendingBlockedListMutations.length, 1);
assert.strictEqual(queuedMutationHarness.storedValues.length, 0);
assert.strictEqual(queuedMutationHarness.context.getTabState(5), 0);
queuedMutationHarness.finishStorageRead({blocked: ["https://existing.test"]});
assert.strictEqual(queuedMutationHarness.context.blockedSitesReady, false);
assert.strictEqual(queuedMutationHarness.pendingStorageWrites.length, 1);
assert.strictEqual(queuedMutationResult, undefined);
queuedMutationHarness.finishStorageWrite();
assert.strictEqual(queuedMutationHarness.context.blockedSitesReady, true);
assert.strictEqual(queuedMutationHarness.context.pendingBlockedListMutations.length, 0);
assert.strictEqual(queuedMutationHarness.pendingStorageWrites.length, 1);
assert.strictEqual(queuedMutationResult, undefined);
assert.deepStrictEqual(plain(queuedMutationHarness.storedValues), [
  {blocked: ["https://existing.test"]},
  {blocked: ["https://existing.test", "https://queued.test"]}
]);
queuedMutationHarness.finishStorageWrite();
assert.strictEqual(queuedMutationResult, true);
assert.strictEqual(
  queuedMutationHarness.context.getTabState(5),
  "https://queued.test"
);

const hydrationWriteFailureHarness = createBackgroundHarness({deferStorageWrites: true});
let hydrationWriteFailureResponse;
assert.strictEqual(hydrationWriteFailureHarness.listeners.onMessage({
  action: "background:clearBlacklist"
}, {
  id: "test-extension",
  url: "chrome-extension://test/popup.html"
}, function(response) {
  hydrationWriteFailureResponse = plain(response);
}), true);
hydrationWriteFailureHarness.finishStorageRead({blocked: ["https://example.com"]});
assert.strictEqual(hydrationWriteFailureHarness.context.blockedSitesReady, false);
assert.strictEqual(hydrationWriteFailureResponse, undefined);
hydrationWriteFailureHarness.finishStorageWrite({message: "write unavailable"});
assert.deepStrictEqual(hydrationWriteFailureResponse, {ok: false});
assert.strictEqual(hydrationWriteFailureHarness.context.blockedSitesReady, false);
assert.strictEqual(hydrationWriteFailureHarness.context.blockedSitesHydrationFailed, true);
assert.deepStrictEqual(plain(hydrationWriteFailureHarness.context.blockedSites), []);

const failedWriteHarness = createBackgroundHarness({deferStorageWrites: true});
failedWriteHarness.finishStorageRead({blocked: []});
failedWriteHarness.finishStorageWrite();
let failedWriteResponse;
assert.strictEqual(failedWriteHarness.listeners.onMessage({
  action: "background:addBlockedSite",
  tabId: 21,
  blockedSite: "https://write-failure.test"
}, {
  id: "test-extension",
  url: "chrome-extension://test/popup.html"
}, function(response) {
  failedWriteResponse = plain(response);
}), true);
assert.strictEqual(failedWriteResponse, undefined);
failedWriteHarness.finishStorageWrite({message: "write unavailable"});
assert.deepStrictEqual(failedWriteResponse, {ok: false});
assert.deepStrictEqual(plain(failedWriteHarness.context.blockedSites), []);
assert.strictEqual(failedWriteHarness.context.getTabState(21), 0);

const hydrationMessageHarness = createBackgroundHarness({deferStorageWrites: true});
let hydrationMessageResponse;
assert.strictEqual(hydrationMessageHarness.listeners.onMessage({
  action: "background:clearBlacklist"
}, {
  id: "test-extension",
  url: "chrome-extension://test/popup.html"
}, function(response) {
  hydrationMessageResponse = plain(response);
}), true);
assert.strictEqual(hydrationMessageResponse, undefined);
hydrationMessageHarness.finishStorageRead(
  {blocked: ["https://example.com"]},
  {message: "storage unavailable"}
);
assert.deepStrictEqual(hydrationMessageResponse, {ok: false});

const serializedHarness = createBackgroundHarness({deferStorageWrites: true});
serializedHarness.finishStorageRead({blocked: []});
serializedHarness.finishStorageWrite();
const serializedResponses = [];
function sendSerializedAdd(tabId, blockedSite) {
  assert.strictEqual(serializedHarness.listeners.onMessage({
    action: "background:addBlockedSite",
    tabId,
    blockedSite
  }, {
    id: "test-extension",
    url: "chrome-extension://test/popup.html"
  }, function(response) {
    serializedResponses.push(plain(response));
  }), true);
}
sendSerializedAdd(31, "https://first.test");
sendSerializedAdd(32, "https://second.test");
assert.strictEqual(serializedHarness.pendingStorageWrites.length, 1);
assert.strictEqual(serializedHarness.context.pendingBlockedListMutations.length, 1);
serializedHarness.finishStorageWrite();
assert.deepStrictEqual(serializedResponses, [{ok: true}]);
assert.strictEqual(serializedHarness.pendingStorageWrites.length, 1);
serializedHarness.finishStorageWrite();
assert.deepStrictEqual(serializedResponses, [{ok: true}, {ok: true}]);
assert.deepStrictEqual(plain(serializedHarness.context.blockedSites), [
  "https://first.test",
  "https://second.test"
]);

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
  sendBackgroundMessage(
    {action: "background:getTabState", tabId: 7}, undefined,
    "chrome-extension://test/blockedSite.html?blocked=https%3A%2F%2Fexample.com"
  ),
  undefined
);
assert.strictEqual(
  sendBackgroundMessage({action: "background:addBlockedSite", tabId: -2,
    blockedSite: "https://invalid.test"}),
  undefined
);
assert.strictEqual(
  sendBackgroundMessage({action: "background:addBlockedSite", tabId: 1.5,
    blockedSite: "https://fractional.test"}),
  undefined
);
assert.strictEqual(
  sendBackgroundMessage({action: "background:getTabState", tabId: Infinity}),
  undefined
);
context.setTabBlockingState(2.5, "https://fractional.test");
context.setTabBlockingState(Infinity, "https://infinite.test");
assert.strictEqual(context.getTabState(2.5), 0);
assert.strictEqual(context.getTabState(Infinity), 0);
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
assert.strictEqual(
  sendBackgroundMessage({action: "background:unlistSite", tabId: 14,
    blockedSite: "https://message.test/other"}),
  undefined
);
assert.strictEqual(context.getTabState(14), "https://message.test");
assert.strictEqual(
  sendBackgroundMessage({action: "background:unlistSite", tabId: 14,
    blockedSite: "https://message.test/other"}, undefined,
    "chrome-extension://test/blockedSite.html?blocked=" +
      encodeURIComponent("https://other.test")),
  undefined
);
assert.strictEqual(context.getTabState(14), "https://message.test");
assert.deepStrictEqual(
  sendBackgroundMessage({action: "background:unlistSite", tabId: 14,
    blockedSite: "https://message.test/other"}, undefined,
    "chrome-extension://test/blockedSite.html?blocked=" +
      encodeURIComponent("https://message.test")),
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
assert.strictEqual(
  sendBackgroundMessage(
    {action: "background:clearBlacklist"}, undefined,
    "chrome-extension://test/blockedSite.html?blocked=https%3A%2F%2Fother.test"
  ),
  undefined
);
assert.strictEqual(storedValues.length, writesBeforeMessageClear);
assert.deepStrictEqual(
  sendBackgroundMessage({action: "background:clearBlacklist"}),
  {ok: true}
);
assert.strictEqual(storedValues.length, writesBeforeMessageClear + 1);
assert.deepStrictEqual(plain(storedValues[storedValues.length - 1]), {blocked: []});

console.log("Background startup, request, tab lifecycle, and global unlist tests passed.");
