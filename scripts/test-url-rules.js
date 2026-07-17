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

// The granted permission scope is a security boundary, so assert the exact
// effective set that JSON.parse (and therefore Chrome) resolves rather than the
// presence of individual spellings. Presence checks and a denylist of one
// spelling cannot see a permission that is ADDED in a different spelling:
// "<all_urls>" is strictly wider than the rejected "*://*/*" yet satisfies
// both. Comparing the parsed value also resolves duplicate "permissions" keys
// to the last-wins block that Chrome actually honors, which no text scan of
// manifest.json can observe.
function assertExactSet(actual, expected, label) {
  assert.ok(Array.isArray(actual), label + " must be an array");
  assert.deepStrictEqual([...actual].sort(), [...expected].sort(), label);
}

// Bound the manifest to a closed set of top-level keys. Enumerating only the
// fields known to be dangerous today is an open-ended denylist: "permissions"
// is not the only scope-granting channel ("optional_permissions" is grantable
// at runtime via chrome.permissions.request), so any newly introduced key must
// fail here and be reviewed deliberately rather than pass unseen.
assertExactSet(
  Object.keys(manifest),
  [
    "name",
    "version",
    "manifest_version",
    "description",
    "icons",
    "browser_action",
    "background",
    "content_scripts",
    "web_accessible_resources",
    "permissions",
    "incognito"
  ],
  "manifest top-level keys"
);

assertExactSet(
  manifest.permissions,
  [
    "http://*/*",
    "https://*/*",
    "tabs",
    "storage",
    "webRequest",
    "webRequestBlocking",
    "webNavigation"
  ],
  "manifest.permissions"
);
assertExactSet(manifest.web_accessible_resources, ["blockedSite.html"], "manifest.web_accessible_resources");
assert.strictEqual(manifest.manifest_version, 2);
assert.strictEqual(manifest.incognito, "split");
assert.strictEqual(manifest.content_scripts.length, 1);
assertExactSet(
  manifest.content_scripts[0].matches,
  ["http://*/*", "https://*/*"],
  "manifest.content_scripts[0].matches"
);
assert.deepStrictEqual(manifest.content_scripts[0].js, ["js/urlRules.js", "js/contentScript.js"]);
assert.deepStrictEqual(manifest.background.scripts, ["js/urlRules.js", "js/background.js"]);

assert.strictEqual(
  normalizeBlockedOrigin("https://Example.com/some/page?x=1"),
  "https://example.com"
);
assert.strictEqual(normalizeBlockedOrigin("http://example.com:8080/a"), "http://example.com:8080");
assert.strictEqual(normalizeBlockedOrigin("javascript:alert(1)"), "");
assert.strictEqual(normalizeBlockedOrigin("file:///tmp/index.html"), "");
assert.strictEqual(normalizeBlockedOrigin("https://user:pass@example.com/path"), "");
assert.strictEqual(normalizeBlockedOrigin("https://user@example.com/path"), "");
assert.strictEqual(normalizeBlockedOrigin("not a url"), "");

assert.deepStrictEqual(
  normalizeBlockedList([
    "https://Example.com/path",
    "https://example.com/other",
    "https://user:pass@example.com/private",
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
  requestMatchesBlockedSite("https://user:pass@example.com/", "https://example.com/"),
  false
);

assert.strictEqual(
  getBlockedOriginFromSearch("?blocked=" + encodeURIComponent("https://Example.com/path")),
  "https://example.com"
);
assert.strictEqual(getBlockedOriginFromSearch("?blocked=javascript%3Aalert(1)"), "");
assert.strictEqual(
  getBlockedOriginFromSearch("?blocked=" + encodeURIComponent("https://user:pass@example.com/path")),
  ""
);

console.log("URL rule and manifest permission tests passed.");
