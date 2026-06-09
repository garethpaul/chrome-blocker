const assert = require("assert");
const fs = require("fs");
const path = require("path");

const {
  getBlockedOriginFromSearch,
  normalizeBlockedList,
  normalizeBlockedOrigin,
  requestMatchesBlockedSite
} = require("../js/urlRules");

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "manifest.json"), "utf8"));
assert.ok(!manifest.permissions.includes("*://*/*"));
assert.ok(manifest.permissions.includes("http://*/*"));
assert.ok(manifest.permissions.includes("https://*/*"));

assert.strictEqual(
  normalizeBlockedOrigin("https://Example.com/some/page?x=1"),
  "https://example.com"
);
assert.strictEqual(normalizeBlockedOrigin("http://example.com:8080/a"), "http://example.com:8080");
assert.strictEqual(normalizeBlockedOrigin("javascript:alert(1)"), "");
assert.strictEqual(normalizeBlockedOrigin("file:///tmp/index.html"), "");
assert.strictEqual(normalizeBlockedOrigin("not a url"), "");

assert.deepStrictEqual(
  normalizeBlockedList([
    "https://Example.com/path",
    "https://example.com/other",
    "javascript:alert(1)",
    "",
    "http://example.com/"
  ]),
  ["https://example.com", "http://example.com"]
);

assert.strictEqual(
  requestMatchesBlockedSite("https://example.com/next", "https://example.com/"),
  true
);
assert.strictEqual(
  requestMatchesBlockedSite("https://example.com.evil.test/?next=https://example.com", "https://example.com/"),
  false
);
assert.strictEqual(
  requestMatchesBlockedSite("https://notexample.com/?q=https://example.com", "https://example.com/"),
  false
);
assert.strictEqual(
  requestMatchesBlockedSite("http://example.com/", "https://example.com/"),
  false
);

assert.strictEqual(
  getBlockedOriginFromSearch("?blocked=" + encodeURIComponent("https://Example.com/path")),
  "https://example.com"
);
assert.strictEqual(getBlockedOriginFromSearch("?blocked=javascript%3Aalert(1)"), "");

console.log("URL rule and manifest permission tests passed.");
