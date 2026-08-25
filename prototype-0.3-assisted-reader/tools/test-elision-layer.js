const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const prototypeDir = path.resolve(__dirname, "..");
const projectDir = path.resolve(prototypeDir, "..");

const elementStub = {
  innerHTML: "",
  hidden: false,
  textContent: "",
  style: { setProperty() {} },
  classList: { add() {}, remove() {} },
  addEventListener() {},
  querySelector() { return elementStub; },
  querySelectorAll() { return []; },
  removeAttribute() {},
  setAttribute() {},
  getBoundingClientRect() {
    return { top: 0, right: 900, bottom: 700, left: 200, width: 700, height: 700 };
  }
};

const storage = new Map();
const context = vm.createContext({
  console,
  document: { querySelector() { return elementStub; } },
  localStorage: {
    getItem(key) { return storage.get(key) ?? null; },
    setItem(key, value) { storage.set(key, String(value)); }
  },
  window: {
    addEventListener() {},
    innerHeight: 800,
    innerWidth: 1280,
    scrollX: 0,
    scrollY: 0
  }
});

context.window.window = context.window;
context.window.document = context.document;
context.window.localStorage = context.localStorage;

const scripts = [
  path.join(projectDir, "src", "books.js"),
  path.join(projectDir, "prototype-0.2-lexical-coverage", "lexicon.js"),
  path.join(prototypeDir, "paisa-frequency.js"),
  path.join(prototypeDir, "learner-enrichment.js"),
  path.join(prototypeDir, "dictionary-overflow.js"),
  path.join(prototypeDir, "context-markers.js"),
  path.join(prototypeDir, "accent-rules.js"),
  path.join(prototypeDir, "elision-rules.js"),
  path.join(projectDir, "prototype-0.2-lexical-coverage", "core-dictionary.js"),
  path.join(prototypeDir, "app.js")
];

for (const script of scripts) {
  vm.runInContext(fs.readFileSync(script, "utf8"), context, { filename: script });
}

const samples = vm.runInContext(`
  ["l'albero", "dell'amico", "c'\u00e8", "dov'\u00e8", "un'altra", "parola"].map((token) => {
    const result = resolveLemma(token);
    return {
      token,
      lemma: result.lemma,
      method: result.method,
      elision: result.elision || null
    };
  });
`, context);

const byToken = new Map(samples.map((sample) => [sample.token, sample]));

assert.equal(byToken.get("l'albero").lemma, "albero");
assert.equal(byToken.get("dell'amico").lemma, "amico");
assert.equal(byToken.get("c'\u00e8").lemma, "essere");
assert.equal(byToken.get("dov'\u00e8").lemma, "essere");
assert.equal(byToken.get("un'altra").lemma, "altro");
assert.equal(byToken.get("parola").elision, null);

for (const token of ["l'albero", "dell'amico", "c'\u00e8", "dov'\u00e8", "un'altra"]) {
  assert.match(byToken.get(token).method, /^elision-/);
}

console.table(samples.map(({ token, lemma, method, elision }) => ({
  token,
  lemma,
  method,
  expansion: elision?.expansion || "-"
})));
