const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const elementState = {};
let messageListener;
let intervalStarts = 0;
let intervalClears = 0;
let currentTabLookups = 0;
const sentMessages = [];
let messageResponse = {ok: false};
const extensionRoot = "chrome-extension://chrome-blocker/";
const popupSender = {
  id: "chrome-blocker",
  url: extensionRoot + "popup.html"
};

function element(selector) {
  if (!elementState[selector]) {
    elementState[selector] = {
      clicks: [],
      events: {},
      modals: [],
      textValue: ""
    };
  }

  const state = elementState[selector];
  return {
    click(callback) {
      state.clicks.push(callback);
    },
    modal(action) {
      state.modals.push(action);
    },
    on(eventName, callback) {
      state.events[eventName] = callback;
    },
    text(value) {
      if (typeof value === "undefined") {
        return state.textValue;
      }
      state.textValue = value;
    }
  };
}

const context = {
  URL,
  chrome: {
    runtime: {
      id: "chrome-blocker",
      lastError: null,
      getURL(pathname) {
        return extensionRoot + pathname;
      },
      onMessage: {
        addListener(listener) {
          messageListener = listener;
        }
      },
      sendMessage(message, callback) {
        sentMessages.push(JSON.parse(JSON.stringify(message)));
        callback(messageResponse);
      }
    },
    tabs: {
      getCurrent(callback) {
        currentTabLookups += 1;
        callback({id: 7});
      }
    }
  },
  clearInterval() {
    intervalClears += 1;
  },
  console,
  setInterval() {
    intervalStarts += 1;
    return intervalStarts;
  },
  window: {
    location: {
      href: "",
      search: "?blocked=" + encodeURIComponent("https://Example.com/path")
    }
  },
  $: element
};
context.window.top = context.window;

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, "..", "js", "urlRules.js"), "utf8"),
  context,
  {filename: "urlRules.js"}
);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, "..", "js", "blockedSite.js"), "utf8"),
  context,
  {filename: "blockedSite.js"}
);

assert.strictEqual(typeof messageListener, "function");
assert.strictEqual(elementState["#blockMessage"].textValue, "https://example.com has been blacklisted.");
for (const tab of [null, {}, {id: -1}, {id: 1.5}, {id: Infinity}]) {
  assert.strictEqual(context.hasValidTabId(tab), false);
}
assert.strictEqual(context.hasValidTabId({id: 0}), true);

const rejectedMessages = [
  7,
  null,
  {},
  {action: "redirect", tabId: 7, blockedSite: "https://example.com"},
  {action: "beginUnlist", tabId: "7", blockedSite: "https://example.com"},
  {action: "beginUnlist", tabId: 8, blockedSite: "https://example.com"},
  {action: "beginUnlist", tabId: 7, blockedSite: "https://other.test"},
  {action: "beginUnlist", tabId: 7, blockedSite: "https://user@example.com"}
];

for (const message of rejectedMessages) {
  messageListener(message, popupSender, function() {});
}

const rejectedSenders = [
  undefined,
  {},
  {id: "other-extension", url: extensionRoot + "popup.html"},
  {id: "chrome-blocker", url: "https://example.com/popup.html"},
  {id: "chrome-blocker", url: extensionRoot + "background.html"},
  {id: "chrome-blocker", url: extensionRoot + "popup.html/extra"},
  {id: "chrome-blocker", url: extensionRoot + "popup.html?source=other"}
];
const lookupsBeforeRejectedSenders = currentTabLookups;

for (const sender of rejectedSenders) {
  messageListener({
    action: "beginUnlist",
    tabId: 7,
    blockedSite: "https://example.com"
  }, sender, function() {});
}

assert.strictEqual(currentTabLookups, lookupsBeforeRejectedSenders);

context.window.top = {};
messageListener({
  action: "beginUnlist",
  tabId: 7,
  blockedSite: "https://example.com"
}, popupSender, function() {});
assert.strictEqual(currentTabLookups, lookupsBeforeRejectedSenders);
context.window.top = context.window;

assert.deepStrictEqual(elementState["#unlistModal"].modals, []);
assert.strictEqual(intervalStarts, 0);
assert.strictEqual(intervalClears, 0);

messageListener({
  action: "beginUnlist",
  tabId: 7,
  blockedSite: "https://EXAMPLE.com/another/path"
}, popupSender, function() {});

assert.deepStrictEqual(elementState["#unlistModal"].modals, ["show"]);
assert.strictEqual(intervalStarts, 1);
assert.strictEqual(intervalClears, 0);
assert.strictEqual(
  elementState["#countdown"].textValue,
  "Unlisting https://example.com in 15 seconds..."
);

messageListener({
  action: "beginUnlist",
  tabId: 7,
  blockedSite: "https://example.com"
}, popupSender, function() {});

assert.deepStrictEqual(elementState["#unlistModal"].modals, ["show", "show"]);
assert.strictEqual(intervalStarts, 2);
assert.strictEqual(intervalClears, 1);

context.i = 1;
context.updateCountdown();
assert.strictEqual(context.window.location.href, "");

messageResponse = {ok: true};
context.i = 1;
context.updateCountdown();
assert.deepStrictEqual(sentMessages, [{
  action: "background:unlistSite",
  tabId: 7,
  blockedSite: "https://example.com"
}, {
  action: "background:unlistSite",
  tabId: 7,
  blockedSite: "https://example.com"
}]);
assert.strictEqual(context.window.location.href, "https://example.com");

console.log("Blocked-page unlist message contract tests passed.");
