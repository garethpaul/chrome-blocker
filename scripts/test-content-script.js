const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

let listener;
const runtimeMessages = [];
let reservationResponse = {ok: true};
const currentLocation = {href: "https://example.com/private"};
const context = {
  URL,
  chrome: {
    runtime: {
      id: "test-extension",
      getURL(resource) {
        return "chrome-extension://test/" + resource;
      },
      lastError: null,
      sendMessage(message, callback) {
        runtimeMessages.push(JSON.parse(JSON.stringify(message)));
        callback(reservationResponse);
      },
      onMessage: {
        addListener(callback) {
          listener = callback;
        }
      }
    }
  },
  document: {location: currentLocation},
  window: {location: currentLocation}
};

vm.createContext(context);
for (const relativePath of ["js/urlRules.js", "js/contentScript.js"]) {
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8"),
    context,
    {filename: relativePath}
  );
}

const popupSender = {
  id: "test-extension",
  url: "chrome-extension://test/popup.html"
};

function send(message, sender) {
  if (arguments.length < 2) {
    sender = popupSender;
  }
  let response;
  listener(message, sender, function(value) {
    response = JSON.parse(JSON.stringify(value));
  });
  return response;
}

assert.deepStrictEqual(send({action: "geturl"}), {
  URL: "https://example.com/private"
});

for (const sender of [
  undefined,
  {id: "other-extension", url: popupSender.url},
  {id: popupSender.id, url: "chrome-extension://test/background.html"},
  {id: popupSender.id, url: popupSender.url + "?forged=1"}
]) {
  assert.strictEqual(send({action: "geturl"}, sender), undefined);
}

for (const message of [undefined, null, "geturl", {}, {action: "unknown"}]) {
  context.window.location = "unchanged";
  assert.strictEqual(send(message), undefined);
  assert.strictEqual(context.window.location, "unchanged");
}

context.window.location = currentLocation;
assert.deepStrictEqual(
  send({action: "redirect", blockedSite: "https://example.com"}),
  {ok: true}
);
assert.deepStrictEqual(runtimeMessages.shift(), {
  action: "background:reserveBlockedSite",
  blockedSite: "https://example.com"
});
assert.strictEqual(
  context.window.location,
  "chrome-extension://test/blockedSite.html?blocked=https%3A%2F%2Fexample.com"
);

context.window.location = "unchanged";
currentLocation.href = "https://different.example/private";
assert.deepStrictEqual(
  send({action: "redirect", blockedSite: "https://example.com"}),
  {ok: false}
);
assert.strictEqual(context.window.location, "unchanged");
assert.strictEqual(runtimeMessages.length, 0);

context.window.location = currentLocation;
currentLocation.href = "https://example.com/private";
reservationResponse = {ok: false};
assert.deepStrictEqual(
  send({action: "redirect", blockedSite: "https://example.com"}),
  {ok: false}
);
assert.strictEqual(context.window.location, currentLocation);
reservationResponse = {ok: true};

for (const blockedSite of [undefined, "", "javascript:alert(1)"]) {
  context.window.location = "unchanged";
  assert.deepStrictEqual(send({action: "redirect", blockedSite}), {ok: false});
  assert.strictEqual(context.window.location, "unchanged");
}

context.window.location = "unchanged";
send(
  {action: "redirect", blockedSite: "https://different.example"},
  {id: "other-extension", url: popupSender.url}
);
assert.strictEqual(context.window.location, "unchanged");

console.log("Content-script sender and document ownership tests passed.");
