const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const elementState = {};
let messageListener;
let intervalStarts = 0;
let intervalClears = 0;

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
    extension: {
      getBackgroundPage() {
        throw new Error("Countdown completion is outside this message-boundary test.");
      }
    },
    runtime: {
      onMessage: {
        addListener(listener) {
          messageListener = listener;
        }
      }
    },
    tabs: {
      getCurrent(callback) {
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
  messageListener(message, {}, function() {});
}

assert.deepStrictEqual(elementState["#unlistModal"].modals, []);
assert.strictEqual(intervalStarts, 0);
assert.strictEqual(intervalClears, 0);

messageListener({
  action: "beginUnlist",
  tabId: 7,
  blockedSite: "https://EXAMPLE.com/another/path"
}, {}, function() {});

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
}, {}, function() {});

assert.deepStrictEqual(elementState["#unlistModal"].modals, ["show", "show"]);
assert.strictEqual(intervalStarts, 2);
assert.strictEqual(intervalClears, 1);

console.log("Blocked-page unlist message contract tests passed.");
