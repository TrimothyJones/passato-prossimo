const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const prototypeDir = path.resolve(__dirname, "..");
const projectDir = path.resolve(prototypeDir, "..");
const spoken = [];
const calls = { pause: 0, resume: 0, cancel: 0 };

class FakeUtterance {
  constructor(text) {
    this.text = text;
    this.lang = "";
    this.rate = 1;
    this.voice = null;
    this.onend = null;
    this.onerror = null;
  }
}

const speechSynthesis = {
  getVoices() {
    return [
      { name: "English", lang: "en-US", voiceURI: "english", localService: true },
      { name: "Italian Local", lang: "it-IT", voiceURI: "italian-local", localService: true }
    ];
  },
  speak(utterance) { spoken.push(utterance); },
  pause() { calls.pause += 1; },
  resume() { calls.resume += 1; },
  cancel() { calls.cancel += 1; },
  addEventListener() {}
};

const elementStub = {
  innerHTML: "",
  hidden: false,
  textContent: "",
  value: "",
  title: "",
  disabled: false,
  style: { setProperty() {} },
  classList: { add() {}, remove() {} },
  addEventListener() {},
  querySelector() { return elementStub; },
  querySelectorAll() { return []; },
  removeAttribute() {},
  setAttribute() {},
  scrollIntoView() {},
  getBoundingClientRect() {
    return { top: 0, right: 900, bottom: 700, left: 200, width: 700, height: 700 };
  }
};

const storage = new Map();
const windowStub = {
  addEventListener() {},
  innerHeight: 800,
  innerWidth: 1280,
  scrollX: 0,
  scrollY: 0,
  speechSynthesis,
  SpeechSynthesisUtterance: FakeUtterance
};
const context = vm.createContext({
  console,
  document: { querySelector() { return elementStub; } },
  localStorage: {
    getItem(key) { return storage.get(key) ?? null; },
    setItem(key, value) { storage.set(key, String(value)); }
  },
  window: windowStub
});

windowStub.window = windowStub;
windowStub.document = context.document;
windowStub.localStorage = context.localStorage;

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

spoken.length = 0;
calls.pause = 0;
calls.resume = 0;
calls.cancel = 0;

vm.runInContext(`
  activeBook = { id: "audio-test", title: "Audio test" };
  activeSectionIndex = 0;
  activeAnalysis = {
    sentences: [
      { index: 0, text: "Questa e la prima frase." },
      { index: 1, text: "Questa e la seconda frase." }
    ]
  };
  speechState.sentenceIndex = 0;
  toggleSpeechReader();
`, context);

assert.equal(spoken.length, 1);
assert.equal(spoken[0].text, "Questa e la prima frase.");
assert.equal(spoken[0].lang, "it-IT");
assert.equal(spoken[0].voice.name, "Italian Local");
assert.equal(spoken[0].rate, 0.92);
assert.equal(JSON.parse(storage.get("prototype03ReadingPositions"))["audio-test"].sentenceIndex, 0);

vm.runInContext("toggleSpeechReader(); toggleSpeechReader();", context);
assert.equal(calls.pause, 1);
assert.equal(calls.resume, 1);

spoken[0].onend();
assert.equal(spoken.length, 2);
assert.equal(spoken[1].text, "Questa e la seconda frase.");
assert.equal(JSON.parse(storage.get("prototype03ReadingPositions"))["audio-test"].sentenceIndex, 1);

spoken[1].onend();
assert.equal(vm.runInContext("speechState.status", context), "idle");

console.table(spoken.map((utterance, index) => ({
  sentence: index + 1,
  text: utterance.text,
  voice: utterance.voice?.name,
  lang: utterance.lang,
  rate: utterance.rate
})));
