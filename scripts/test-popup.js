const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const buttonState = {clicks: [], text: ""};
const runtimeMessages = [];
const tabMessages = [];
let mutationResponse = {ok: true};

function jquery(selector) {
  assert.strictEqual(selector, "#blacklistButton");
  return {
    click(callback) {
      buttonState.clicks.push(callback);
    },
    text(value) {
      buttonState.text = value;
    }
  };
}

const context = {
  URL,
  $: jquery,
  chrome: {
    runtime: {
      lastError: null,
      sendMessage(message, callback) {
        runtimeMessages.push(JSON.parse(JSON.stringify(message)));
        if (callback) {
          callback(message.action === "background:getTabState" ?
            {ok: true, tabState: 0} : mutationResponse);
        }
      }
    },
    storage: {
      local: {
        get(key, callback) {
          assert.strictEqual(key, "blocked");
          callback({blocked: []});
        }
      }
    },
    tabs: {
      query(options, callback) {
        assert.deepStrictEqual(
          JSON.parse(JSON.stringify(options)),
          {active: true, currentWindow: true}
        );
        callback([{id: 7}]);
      },
      sendMessage(tabId, message, callback) {
        tabMessages.push({tabId, message: JSON.parse(JSON.stringify(message))});
        if (callback) {
          if (message.action === "geturl") {
            callback({URL: "https://Example.com/private"});
          }
        }
      }
    }
  },
  console
};

vm.createContext(context);
for (const relativePath of ["js/urlRules.js", "js/popup.js"]) {
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8"),
    context,
    {filename: relativePath}
  );
}

for (const tab of [null, {}, {id: -1}, {id: 1.5}, {id: Infinity}]) {
  assert.strictEqual(context.hasValidTabId(tab), false);
}
assert.strictEqual(context.hasValidTabId({id: 0}), true);

assert.deepStrictEqual(runtimeMessages.shift(), {
  action: "background:getTabState",
  tabId: 7
});
assert.strictEqual(buttonState.text, "Blacklist site");
assert.strictEqual(buttonState.clicks.length, 1);

buttonState.clicks[0]();
assert.deepStrictEqual(runtimeMessages.shift(), {
  action: "background:addBlockedSite",
  tabId: 7,
  blockedSite: "https://example.com"
});
assert.deepStrictEqual(tabMessages, [
  {tabId: 7, message: {action: "geturl"}},
  {
    tabId: 7,
    message: {action: "redirect", blockedSite: "https://example.com"}
  }
]);
assert.strictEqual(runtimeMessages.length, 0);

tabMessages.length = 0;
mutationResponse = {ok: false};
buttonState.clicks[0]();
assert.deepStrictEqual(runtimeMessages.shift(), {
  action: "background:addBlockedSite",
  tabId: 7,
  blockedSite: "https://example.com"
});
assert.deepStrictEqual(tabMessages, [
  {tabId: 7, message: {action: "geturl"}}
]);

context.tabState = "https://example.com";
context.unlist();
assert.deepStrictEqual(runtimeMessages.shift(), {
  action: "beginUnlist",
  tabId: 7,
  blockedSite: "https://example.com"
});

context.clearBlacklist();
assert.deepStrictEqual(runtimeMessages.shift(), {
  action: "background:clearBlacklist"
});
assert.strictEqual(runtimeMessages.length, 0);
assert.strictEqual(context.tabState, "https://example.com");

mutationResponse = {ok: true};
context.clearBlacklist();
assert.deepStrictEqual(runtimeMessages.shift(), {
  action: "background:clearBlacklist"
});
assert.strictEqual(context.tabState, 0);

console.log("Popup runtime message boundary tests passed.");
