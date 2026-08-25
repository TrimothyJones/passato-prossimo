const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const prototypeDir = path.resolve(__dirname, "..");
const projectDir = path.resolve(prototypeDir, "..");
const languageDir = path.join(projectDir, "prototype-0.3-assisted-reader");

const elementStub = {
  innerHTML: "",
  hidden: false,
  textContent: "",
  value: "",
  style: { setProperty() {} },
  classList: { add() {}, remove() {}, toggle() {} },
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
  speechSynthesis: { getVoices() { return []; }, addEventListener() {}, cancel() {} },
  SpeechSynthesisUtterance: class {}
};
const context = vm.createContext({
  console,
  URL,
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
  path.join(languageDir, "paisa-frequency.js"),
  path.join(languageDir, "learner-enrichment.js"),
  path.join(languageDir, "dictionary-overflow.js"),
  path.join(languageDir, "context-markers.js"),
  path.join(languageDir, "accent-rules.js"),
  path.join(languageDir, "elision-rules.js"),
  path.join(projectDir, "prototype-0.2-lexical-coverage", "core-dictionary.js"),
  path.join(prototypeDir, "app.js")
];

for (const script of scripts) {
  vm.runInContext(fs.readFileSync(script, "utf8"), context, { filename: script });
}

const result = vm.runInContext(`
  activeAnalysis = analyzeSection("Vabbè, non ne vale la pena. Che schifo!");
  ({
    phrase: phrasesForSentence(0)[0],
    friction: prioritizedFrictionForSentence(0).map((row) => row.lemma),
    emotion: activeAnalysis.sentences[1].emotion,
    sentenceCount: activeAnalysis.sentences.length
  });
`, context);

assert.equal(result.sentenceCount, 2);
assert.equal(result.phrase.phrase, "ne vale la pena");
assert.match(result.phrase.english, /worth it/);
assert.equal(result.emotion.label, "Disgust / annoyance");
assert.equal(new Set(result.friction).size, result.friction.length);

const teacherExperiment = vm.runInContext(`
  (() => {
    const sentence = activeAnalysis.sentences[1];
    const request = buildTeacherRequest({
      scope: "sentence",
      row: null,
      sentence,
      sentenceIndex: 1,
      phrases: phrasesForSentence(1),
      emotion: sentence.emotion,
      wordEvidence: null
    });
    const note = simulateTeacherResponse(request);
    teacherNotes = {};
    cacheTeacherNote(request, note);
    return {
      request,
      note,
      cached: cachedTeacherNote(request),
      markup: renderTeacherNote(note, false)
    };
  })();
`, context);
assert.equal(teacherExperiment.request.contractVersion, 1);
assert.equal(teacherExperiment.request.sentence, "Che schifo!");
assert.equal(teacherExperiment.request.targetLanguage, "it");
assert.equal(teacherExperiment.request.supportLanguage, "en");
assert.equal("bookText" in teacherExperiment.request, false);
assert.match(teacherExperiment.note.english, /disgust/);
assert.equal(teacherExperiment.note.providerKind, "simulation");
assert.equal(teacherExperiment.cached.providerId, "simulated-italian-teacher-v1");
assert.match(teacherExperiment.markup, /Simulated Italian teacher/);
assert.match(teacherExperiment.markup, /controlled simulated response/);
assert.ok(storage.get("prototype04TeacherNotes"));

assert.equal(vm.runInContext("loadBreakdownMode()", context), true);
vm.runInContext("breakdownMode = false; saveBreakdownMode();", context);
assert.equal(storage.get("prototype04BreakdownMode"), "off");

const browserBook = vm.runInContext(`
  createBrowserBookFromPreview({
    sourceUrl: "https://example.com/articolo",
    hostname: "example.com"
  }, {
    title: "Pagina controllata",
    author: "Autrice",
    text: "La lettura in italiano aiuta a capire il contesto e le parole. ".repeat(6)
  });
`, context);
assert.equal(browserBook.title, "Pagina controllata");
assert.equal(browserBook.author, "Autrice");
assert.equal(browserBook.sourceUrl, "https://example.com/articolo");
assert.match(browserBook.importedAt, /^\d{4}-\d{2}-\d{2}T/);
assert.match(browserBook.note, /Italian signal/);

const sourceMarkup = vm.runInContext(`renderSourceStrip({
  sourceUrl: "https://www.example.com/articolo",
  author: "Autrice",
  importedAt: "2026-08-17T12:00:00.000Z"
});`, context);
assert.match(sourceMarkup, /example.com/);
assert.match(sourceMarkup, /Autrice/);
assert.match(sourceMarkup, /Open original/);

const previewMarkup = vm.runInContext(`
  renderUrlPreview({
    title: "Titolo & prova",
    author: "Autrice",
    hostname: "example.com",
    sourceUrl: "https://example.com/articolo",
    italianSignal: "strong",
    extractionConfidence: "medium",
    characterCount: 640,
    wordCount: 112,
    excerpt: "La lettura italiana.",
    text: "La lettura italiana. ".repeat(30)
  });
`, context);
assert.match(previewMarkup, /URL Door preview/);
assert.match(previewMarkup, /Looks usable/);
assert.match(previewMarkup, /Strong Italian signal/);
assert.match(previewMarkup, /Titolo &amp; prova/);
assert.match(previewMarkup, /Add to shelf/);

console.table([{
  phrase: result.phrase.phrase,
  meaning: result.phrase.english,
  friction: result.friction.join(", "),
  nextSentenceTone: result.emotion.label
}]);
