const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { compile, render, contentHash } = require("./build-italian-foundation");
const { exactKey, createSelector } = require("../prototype-0.5-media-shell/lexical-provider");
const { createLabServer } = require("./serve-foundation-lab");
const root = path.resolve(__dirname, "..");
const authored = JSON.parse(fs.readFileSync(path.join(root, "prototype-0.5-media-shell/data/italian-foundation.json"), "utf8"));
const clone = (value) => JSON.parse(JSON.stringify(value));
const envelope = (entries) => ({ schemaVersion: 1, providerId: "italian-foundation", revision: "test", entries });

// Synthetic approval metadata exists only in tests and grants no lexical sign-off.
function fixture(headword = "testword") {
  const entry = clone(authored.entries[0]);
  Object.assign(entry, { id: `${headword}-test`, headword, definition: { text: "synthetic test gloss", language: "en" }, confidence: "high", register: "neutral" });
  entry.source = { kind: "original", author: "test fixture", references: [{ locator: "test:fixture", senseLocator: "synthetic", relation: "evidence" }], attribution: "Test only" };
  entry.license = { status: "verified", expression: "LicenseRef-TestOnly", evidence: "test:fixture" };
  entry.review = { status: "approved", reviewer: "test fixture", reviewedAt: "2026-09-24T12:00:00Z", note: "Synthetic approval for tests only", contentHash: null };
  entry.review.contentHash = contentHash(entry);
  return entry;
}

assert.equal(compile(authored).entries.length, 0, "Drafts must not publish");
const approved = fixture();
const secondary = { ...fixture(), id: "testword-secondary", preferred: false };
secondary.review = { ...secondary.review, contentHash: contentHash(secondary) };
assert.equal(compile(envelope([approved, secondary])).entries.length, 2);
assert.equal(compile(envelope([secondary])).entries.length, 0, "Groups need a reviewed default");
assert.equal(render(envelope([secondary, approved])), render(envelope([approved, secondary])), "Build order is deterministic");
assert.equal(contentHash(approved), contentHash(Object.fromEntries(Object.entries(approved).reverse())));
const changed = clone(approved);
changed.definition.text = "changed after review";
assert.throws(() => compile(envelope([changed])), /renew review/);
const conflicting = { ...clone(approved), id: "conflict" };
conflicting.review.contentHash = contentHash(conflicting);
assert.throws(() => compile(envelope([approved, conflicting])), /conflicting approved defaults/);
assert.throws(() => compile(envelope([approved, approved])), /unique ID/);
for (const [field, value] of [["confidence", "unassessed"], ["register", "unknown"], ["source", null], ["license", { status: "pending", expression: null, evidence: null }]]) {
  const invalid = clone(approved);
  invalid[field] = value;
  assert.throws(() => compile(envelope([invalid])), Error);
}
for (const status of ["draft", "in-review", "rejected"]) {
  const entry = clone(approved);
  entry.review.status = status;
  assert.equal(compile(envelope([entry])).entries.length, 0);
}
const built = render(authored);
assert.equal(fs.readFileSync(path.join(root, "prototype-0.5-media-shell/italian-foundation.js"), "utf8"), built, "Generated file is current");
const browser = { window: {} };
vm.runInNewContext(built, browser);
vm.runInNewContext(fs.readFileSync(path.join(root, "prototype-0.5-media-shell/lexical-provider.js"), "utf8"), browser);
assert.equal(typeof browser.window.PASSATO_LEXICAL.createSelector, "function");
assert.equal(browser.window.ITALIAN_FOUNDATION.entries.length, 0);

const legacy = [
  { id: "core", providerId: "core-dictionary", definition: { text: "old narrow gloss", language: "en" }, pos: "noun" },
  { id: "learner", providerId: "learner-enrichment", definition: { text: "learner gloss", language: "en" }, pos: "verb" },
  { id: "overflow", providerId: "dictionary-overflow", definition: { text: "Italian text", language: "it" } },
  { id: "unknown", definition: { text: "unknown language", language: null } }
];
const before = JSON.stringify({ approved, secondary, legacy });
const select = createSelector(compile(envelope([approved, secondary])));
const result = select({ token: "TESTWORD", legacy });
assert.equal(result.preferred.id, approved.id);
assert.deepEqual(result.alternatives.map((sense) => sense.id), [secondary.id, "core", "learner"]);
assert.equal(result.alternatives[1].pos, "noun", "Legacy POS remains attached to legacy sense");
assert.equal(result.italianDefinitions.length, 1);
assert.equal(result.unknownDefinitions.length, 1);
assert.equal(JSON.stringify({ approved, secondary, legacy }), before, "Selection does not mutate input");
assert.equal(select({ token: "inflected", lemma: "testword", lemmaMethod: "ending-guess", legacy }).preferred.id, "learner");
assert.equal(select({ token: "inflected", lemma: "testword", lemmaMethod: "known-exact-form", legacy }).preferred.id, approved.id);
assert.equal(createSelector()({ token: "testword", legacy }).preferred.id, "learner");
assert.equal(createSelector(authored)({ token: "di", legacy: [] }).preferred, null);
assert.equal(createSelector()({ token: "other", legacy: legacy.slice(2) }).preferred, null);
assert.equal(exactKey("D’"), "d'");
assert.equal(exactKey("e\u0300"), "è");
for (const [plain, accented] of [["e", "è"], ["da", "dà"], ["casino", "casinò"]]) {
  const lookup = createSelector(envelope([fixture(plain), fixture(accented)]));
  assert.equal(lookup({ token: plain }).preferred.headword, plain);
  assert.equal(lookup({ token: accented }).preferred.headword, accented);
  assert.equal(createSelector(envelope([fixture(plain)]))({ token: accented }).preferred, null);
}

async function run() {
  const server = createLabServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const response = await fetch(base);
    assert.equal(response.status, 200);
    const html = await response.text();
    for (const [, src] of html.matchAll(/src="([^"]+)"/g)) {
      assert.equal((await fetch(`${base}${src}`)).status, 200, src);
    }
    assert.equal((await fetch(`${base}/prototype-0.5-media-shell/data/italian-foundation.json`)).status, 200);
    assert.equal((await fetch(`${base}/package.json`)).status, 404);
    assert.equal((await fetch(`${base}/forge.config.js`)).status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
  console.log("Foundation validation, export, selector, and isolated server: PASS");
}
run().catch((error) => { console.error(error); process.exitCode = 1; });
