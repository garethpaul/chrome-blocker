const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const listeners = {};
const storedValues = [];
const context = {
  URL,
  chrome: {
    runtime: {
      getURL(resourcePath) {
        return "chrome-extension://test/" + resourcePath;
      }
    },
    storage: {
      local: {
        get(key, callback) {
          callback({blocked: ["https://example.com"]});
        },
        set(value) {
          storedValues.push(value);
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

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

vm.createContext(context);
for (const relativePath of ["js/urlRules.js", "js/background.js"]) {
  const source = fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
  vm.runInContext(source, context, {filename: relativePath});
}

assert.strictEqual(typeof listeners.onBeforeRequest, "function");
assert.deepStrictEqual(plain(storedValues[0]), {blocked: ["https://example.com"]});

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
  {
    redirectUrl: "chrome-extension://test/blockedSite.html?blocked=" +
      encodeURIComponent("https://example.com")
  }
);
assert.strictEqual(context.getTabState(7), "https://example.com");

console.log("Background request boundary tests passed.");
