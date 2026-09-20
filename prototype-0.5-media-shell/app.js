const appEl = document.querySelector("#app");
const platform = window.PASSATO_PLATFORM;
const builtinBooks = window.IMMERSION_BOOKS || [];
let customBooks = [];
const dictionary = new Map((window.CORE_ITALIAN_DICTIONARY || []).map((entry) => [entry.lemma, entry]));
const frequency = new Map(window.ITALIAN_FREQUENCY_LEMMAS || []);
const frequencyDetails = new Map();
const learnerEntriesExact = new Map();
const learnerEntriesNormalized = new Map();
const dictionaryOverflowExact = new Map();
const dictionaryOverflowNormalized = new Map();
const contextMarkers = new Map();
const contextPhraseEntries = [];
const accentRulesExact = new Map();
const accentRulesNormalized = new Map();
const elisionRules = (window.ITALIAN_ELISION_RULES || [])
  .map(([prefix, expansion, label, meaning, note]) => ({
    prefix,
    normalizedPrefix: String(prefix || "").replace(/\u2019/g, "'").toLowerCase(),
    expansion,
    label,
    meaning,
    note
  }))
  .sort((a, b) => b.normalizedPrefix.length - a.normalizedPrefix.length);

for (const [lemma, zipf] of window.ITALIAN_FREQUENCY_LEMMAS || []) {
  frequencyDetails.set(lemma, {
    zipf,
    source: "prototype-seed",
    rank: 0,
    corpusFrequency: 0
  });
}

for (const [lemma, zipf, corpusFrequency, rank] of window.PAISA_FREQUENCY_LEMMAS || []) {
  if (!frequency.has(lemma) || zipf > frequency.get(lemma)) {
    frequency.set(lemma, zipf);
  }
  frequencyDetails.set(lemma, {
    zipf,
    source: "paisa",
    rank,
    corpusFrequency
  });
}

for (const entry of window.CORE_ITALIAN_DICTIONARY || []) {
  if (entry.zipf > 0 && (!frequency.has(entry.lemma) || entry.zipf > frequency.get(entry.lemma))) {
    frequency.set(entry.lemma, entry.zipf);
  }
  if (!frequencyDetails.has(entry.lemma) || entry.corpusFrequency > (frequencyDetails.get(entry.lemma).corpusFrequency || 0)) {
    frequencyDetails.set(entry.lemma, {
      zipf: entry.zipf || frequency.get(entry.lemma) || 0,
      source: (entry.frequencySources || []).join(", ") || entry.source || "core-dictionary",
      rank: entry.targetRank,
      corpusFrequency: entry.corpusFrequency || 0
    });
  }
}

for (const [word, translation, italianExample, englishExample, cefr, pos, frequencyRank] of window.LEARNER_ITALIAN_ENTRIES || []) {
  const record = {
    word,
    translation,
    italianExample,
    englishExample,
    cefr,
    pos,
    frequencyRank
  };
  const exactKey = String(word || "").toLowerCase();
  const normalizedKey = normalizeItalian(word);
  if (exactKey) learnerEntriesExact.set(exactKey, record);
  if (normalizedKey && !hasItalianAccent(word) && !learnerEntriesNormalized.has(normalizedKey)) {
    learnerEntriesNormalized.set(normalizedKey, record);
  }
}

for (const [word, definition, heading, frequencyRank, corpusFrequency] of window.DICTIONARY_OVERFLOW_ENTRIES || []) {
  const record = {
    word,
    definition,
    heading,
    frequencyRank,
    corpusFrequency
  };
  const exactKey = String(word || "").toLowerCase();
  const normalizedKey = normalizeItalian(word);
  if (exactKey) dictionaryOverflowExact.set(exactKey, record);
  if (normalizedKey && !hasItalianAccent(word) && !dictionaryOverflowNormalized.has(normalizedKey)) {
    dictionaryOverflowNormalized.set(normalizedKey, record);
  }
}

for (const rawEntry of [
  ...(window.ITALIAN_CONTEXT_MARKERS || []),
  ...(window.ITALIAN_CONTEXT_CLUSTERS || [])
]) {
  const [phrase, normalizedPhrase, register, position, englishEquivalents, pragmaticFunction, instruction, example, components] = rawEntry;
  const record = {
    phrase,
    normalizedPhrase,
    register,
    position,
    englishEquivalents,
    pragmaticFunction,
    instruction,
    example,
    components: components?.length ? components : normalizeItalian(phrase).split(" ").filter(Boolean),
    isCluster: Boolean((components || []).length > 1)
  };
  contextPhraseEntries.push(record);
  if (record.components.length === 1 && !contextMarkers.has(record.components[0])) {
    contextMarkers.set(record.components[0], record);
  }
}

contextPhraseEntries.sort((a, b) => b.components.length - a.components.length);

for (const [accented, unaccented, normalizedAccented, normalizedUnaccented, accentedMeaning, unaccentedMeaning, note, example] of window.ITALIAN_ACCENT_RULES || []) {
  const record = {
    accented,
    unaccented,
    normalizedAccented,
    normalizedUnaccented,
    accentedMeaning,
    unaccentedMeaning,
    note,
    example
  };
  accentRulesExact.set(exactItalianKey(accented), { ...record, matchedForm: "accented" });
  accentRulesExact.set(exactItalianKey(unaccented), { ...record, matchedForm: "unaccented" });
  if (normalizedAccented && !accentRulesNormalized.has(normalizedAccented)) {
    accentRulesNormalized.set(normalizedAccented, { ...record, matchedForm: "accented" });
  }
  if (normalizedUnaccented && !hasItalianAccent(unaccented) && !accentRulesNormalized.has(normalizedUnaccented)) {
    accentRulesNormalized.set(normalizedUnaccented, { ...record, matchedForm: "unaccented" });
  }
}

const defaultKnown = new Set([
  "di", "e", "il", "essere", "a", "un", "in", "che", "avere", "per",
  "non", "con", "si", "da", "come", "io", "ma", "questo", "fare", "dire"
]);

const commonFormLemmas = new Map([
  ["sono", "essere"], ["sei", "essere"], ["è", "essere"], ["siamo", "essere"],
  ["siete", "essere"], ["era", "essere"], ["erano", "essere"], ["stato", "essere"],
  ["stata", "essere"], ["stati", "essere"], ["state", "essere"], ["sara", "essere"],
  ["ho", "avere"], ["hai", "avere"], ["ha", "avere"], ["hanno", "avere"],
  ["avevo", "avere"], ["aveva", "avere"], ["avevano", "avere"], ["avuto", "avere"],
  ["faccio", "fare"], ["fai", "fare"], ["fa", "fare"], ["fanno", "fare"],
  ["fatto", "fare"], ["fatta", "fare"], ["fece", "fare"],
  ["dico", "dire"], ["dice", "dire"], ["dicono", "dire"], ["detto", "dire"],
  ["posso", "potere"], ["puoi", "potere"], ["puo", "potere"], ["possono", "potere"],
  ["poteva", "potere"], ["potuto", "potere"],
  ["voglio", "volere"], ["vuoi", "volere"], ["vuole", "volere"], ["vogliono", "volere"],
  ["voleva", "volere"], ["voluto", "volere"],
  ["vado", "andare"], ["vai", "andare"], ["va", "andare"], ["vanno", "andare"],
  ["andato", "andare"], ["andata", "andare"],
  ["vedo", "vedere"], ["vede", "vedere"], ["vedono", "vedere"], ["visto", "vedere"],
  ["so", "sapere"], ["sai", "sapere"], ["sa", "sapere"], ["sanno", "sapere"],
  ["devo", "dovere"], ["deve", "dovere"], ["devono", "dovere"], ["dovuto", "dovere"],
  ["sto", "stare"], ["sta", "stare"], ["stanno", "stare"],
  ["vengo", "venire"], ["vieni", "venire"], ["viene", "venire"], ["vengono", "venire"],
  ["venuto", "venire"], ["venuta", "venire"],
  ["uomini", "uomo"], ["donne", "donna"], ["bambini", "bambino"], ["parole", "parola"],
  ["occhi", "occhio"], ["mani", "mano"], ["giorni", "giorno"], ["case", "casa"],
  ["cose", "cosa"], ["strade", "strada"], ["libri", "libro"], ["anni", "anno"],
  ["altra", "altro"], ["altri", "altro"], ["altre", "altro"]
]);

const articles = new Set(["il", "lo", "la", "l'", "un", "una", "uno", "i", "gli", "le"]);
const auxiliaries = new Set(["ho", "hai", "ha", "abbiamo", "avete", "hanno", "sono", "sei", "e", "siamo", "siete"]);
const prepositions = new Set(["a", "ad", "di", "da", "in", "con", "su", "per", "tra", "fra", "del", "della", "dei", "delle"]);
const pronouns = new Set(["mi", "ti", "si", "ci", "vi", "lo", "la", "li", "le", "ne"]);
const ambiguousLemmas = new Map([
  ["porta", {
    roles: ["noun: door/gate", "verb: carries/brings"],
    nounClues: ["article-before", "preposition-before"],
    verbClues: ["article-after", "pronoun-before"],
    note: "This form can point to a thing or an action, so nearby words matter."
  }],
  ["parte", {
    roles: ["noun: part/side", "verb: leaves/starts"],
    nounClues: ["article-before", "preposition-before"],
    verbClues: ["article-after"],
    note: "This form can behave like a noun or a verb depending on the phrase."
  }],
  ["fine", {
    roles: ["noun: end", "adjective: fine/subtle"],
    nounClues: ["article-before", "preposition-before"],
    verbClues: [],
    note: "This word can describe quality or name the end of something."
  }],
  ["stato", {
    roles: ["noun: state", "participle/adjective: been"],
    nounClues: ["article-before", "preposition-before"],
    verbClues: ["auxiliary-before"],
    note: "This form can be a noun or a form connected to essere."
  }],
  ["volta", {
    roles: ["noun: time/turn", "verb: turns"],
    nounClues: ["article-before", "preposition-before"],
    verbClues: ["pronoun-before"],
    note: "This form often means an occurrence, but can also point to turning."
  }]
]);

const breakdownPhrases = [
  {
    phrase: "ne vale la pena",
    variants: ["ne vale la pena", "non ne vale la pena"],
    english: "it is worth it / it is not worth it",
    italian: "Questa espressione valuta se qualcosa merita tempo, fatica o attenzione.",
    structure: "The pronoun ne points back to the thing being evaluated; the phrase works as one unit."
  },
  {
    phrase: "avere voglia di",
    variants: ["ho voglia di", "hai voglia di", "ha voglia di", "abbiamo voglia di", "avete voglia di", "hanno voglia di"],
    english: "to feel like / to want to do something",
    italian: "Esprime il desiderio o la disposizione a fare qualcosa.",
    structure: "A form of avere combines with voglia di; translating each word separately can hide the intended meaning."
  },
  {
    phrase: "rendersi conto",
    variants: ["mi rendo conto", "ti rendi conto", "si rende conto", "ci rendiamo conto", "vi rendete conto", "si rendono conto"],
    english: "to realize / to become aware",
    italian: "Indica il momento in cui una persona capisce o riconosce qualcosa.",
    structure: "The reflexive pronoun and rendere combine with conto to form a fixed expression."
  },
  {
    phrase: "non vedere l'ora",
    variants: ["non vedo l'ora", "non vedi l'ora", "non vede l'ora", "non vediamo l'ora", "non vedete l'ora", "non vedono l'ora"],
    english: "to really look forward to something",
    italian: "Esprime impazienza positiva e un forte desiderio che qualcosa accada presto.",
    structure: "Its conversational meaning is stronger than the literal image of not seeing the hour."
  },
  {
    phrase: "andare d'accordo",
    variants: ["vado d'accordo", "vai d'accordo", "va d'accordo", "andiamo d'accordo", "andate d'accordo", "vanno d'accordo"],
    english: "to get along / to agree",
    italian: "Descrive un rapporto armonioso oppure un accordo tra persone.",
    structure: "The form of andare and d'accordo should be read together as a relationship expression."
  },
  {
    phrase: "avere bisogno di",
    variants: ["ho bisogno di", "hai bisogno di", "ha bisogno di", "abbiamo bisogno di", "avete bisogno di", "hanno bisogno di"],
    english: "to need",
    italian: "Esprime una necessità concreta o astratta.",
    structure: "Avere bisogno di behaves as a unit followed by the needed person, thing, or action."
  },
  {
    phrase: "stare per",
    variants: ["sto per", "stai per", "sta per", "stiamo per", "state per", "stanno per"],
    english: "to be about to",
    italian: "Indica che un'azione sta per accadere molto presto.",
    structure: "A form of stare plus per introduces an imminent action."
  },
  {
    phrase: "farcela",
    variants: ["ce la faccio", "ce la fai", "ce la fa", "ce la facciamo", "ce la fate", "ce la fanno", "non ce la faccio"],
    english: "to manage / to succeed / to be able to cope",
    italian: "Indica la capacità di riuscire in qualcosa o di sopportare una situazione.",
    structure: "Ce, la, and fare form a pronominal expression whose meaning is not the sum of the separate words."
  }
].map((entry) => ({
  ...entry,
  normalizedVariants: entry.variants.map((variant) => normalizeItalian(variant))
}));

const simulatedTeacherProvider = {
  id: "simulated-italian-teacher-v1",
  label: "Simulated Italian teacher",
  kind: "simulation",
  explain(request) {
    return simulateTeacherResponse(request);
  }
};

const teacherProviders = new Map([[simulatedTeacherProvider.id, simulatedTeacherProvider]]);
const activeTeacherProviderId = simulatedTeacherProvider.id;

const chunkSize = 6200;
let activeBook = null;
let activeSectionIndex = 0;
let activeSectionText = "";
let activeAnalysis = null;
let activeLensRowIndex = null;
let activeLensAnchored = false;
let activeEmojiSentenceIndex = null;
let activeEmojiLensAnchored = false;
let readerSettings = loadReaderSettings();
let lemmaModel = loadLemmaModel();
let speechSettings = loadSpeechSettings();
let readingPositions = loadReadingPositions();
let breakdownMode = loadBreakdownMode();
let activeBreakdownSelection = null;
let pendingUrlPreview = null;
let teacherNotes = loadTeacherNotes();
let activeMediaObjectUrl = "";
let activeMediaFileName = "";
let activeMediaTranscript = [];
let italianSpeechVoices = [];
let restoreSavedPositionOnRender = false;
let speechState = {
  status: "idle",
  sentenceIndex: 0,
  sessionId: 0,
  utterance: null
};

function hasBookImporter() {
  return Boolean(platform?.capabilities.bookImport);
}

function hasNativeUrlPreview() {
  return Boolean(window.immersion?.previewBookFromUrl && window.immersion?.saveUrlPreview);
}

function allBooks() {
  return [...customBooks, ...builtinBooks];
}

function loadReaderSettings() {
  const fallback = { textScale: 1, lineHeight: 1.9, lensMode: "quiet" };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem("prototype03ReaderSettings")) };
  } catch {
    return fallback;
  }
}

function saveReaderSettings() {
  localStorage.setItem("prototype03ReaderSettings", JSON.stringify(readerSettings));
}

function loadSpeechSettings() {
  const fallback = { voiceURI: "", rate: 0.92 };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem("prototype03SpeechSettings")) };
  } catch {
    return fallback;
  }
}

function saveSpeechSettings() {
  localStorage.setItem("prototype03SpeechSettings", JSON.stringify(speechSettings));
}

function loadReadingPositions() {
  try {
    const saved = JSON.parse(localStorage.getItem("prototype03ReadingPositions"));
    if (saved && typeof saved === "object") return saved;
  } catch {
  }
  return {};
}

function saveReadingPositions() {
  localStorage.setItem("prototype03ReadingPositions", JSON.stringify(readingPositions));
}

function loadBreakdownMode() {
  return localStorage.getItem("prototype04BreakdownMode") !== "off";
}

function saveBreakdownMode() {
  localStorage.setItem("prototype04BreakdownMode", breakdownMode ? "on" : "off");
}

function loadTeacherNotes() {
  try {
    const notes = JSON.parse(localStorage.getItem("prototype04TeacherNotes") || "{}");
    return notes && typeof notes === "object" ? notes : {};
  } catch {
    return {};
  }
}

function saveTeacherNotes() {
  const recentEntries = Object.entries(teacherNotes).slice(-120);
  teacherNotes = Object.fromEntries(recentEntries);
  localStorage.setItem("prototype04TeacherNotes", JSON.stringify(teacherNotes));
}

function readingPositionFor(bookId) {
  const position = readingPositions[bookId];
  if (!position || !Number.isInteger(position.sectionIndex) || !Number.isInteger(position.sentenceIndex)) return null;
  return position;
}

function loadLemmaModel() {
  try {
    const saved = JSON.parse(localStorage.getItem("prototype03LemmaModel"));
    if (saved && typeof saved === "object") return saved;
  } catch {
  }
  return Object.fromEntries([...defaultKnown].map((lemma) => [lemma, { status: "known", confidence: 1 }]));
}

function saveLemmaModel() {
  localStorage.setItem("prototype03LemmaModel", JSON.stringify(lemmaModel));
}

function logInteraction(type, details = {}) {
  const events = JSON.parse(localStorage.getItem("prototype03Interactions") || "[]");
  events.push({ type, ...details, timestamp: new Date().toISOString() });
  localStorage.setItem("prototype03Interactions", JSON.stringify(events.slice(-400)));
  window.immersion?.logInteraction?.({ type, ...details }).catch(() => {});
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeItalian(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z'\s]/g, " ")
    .trim();
}

function exactItalianKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function hasItalianAccent(value) {
  return /[àèéìòóù]/i.test(String(value || ""));
}

function accentRuleFor(token, lemma = "") {
  const exactToken = exactItalianKey(token);
  const exactLemma = exactItalianKey(lemma);
  return accentRulesExact.get(exactToken)
    || accentRulesExact.get(exactLemma)
    || null;
}

function lemmaForAccentRule(rule) {
  if (!rule) return "";
  const accented = exactItalianKey(rule.accented);
  if (accented === "è") return "essere";
  if (accented === "dà") return "dare";
  return rule.matchedForm === "unaccented" ? exactItalianKey(rule.unaccented) : exactItalianKey(rule.accented);
}

function accentRuleMeaning(rule) {
  if (!rule) return "";
  return rule.matchedForm === "unaccented" ? rule.unaccentedMeaning : rule.accentedMeaning;
}

function elisionInfoFor(token) {
  const exactToken = exactItalianKey(token).replace(/\u2019/g, "'");
  if (!exactToken.includes("'")) return null;

  const rule = elisionRules.find((candidate) => exactToken.startsWith(candidate.normalizedPrefix));
  if (!rule) return null;

  const remainder = exactToken.slice(rule.normalizedPrefix.length);
  if (!remainder || !/[a-z\u00e0-\u00ff]/i.test(remainder)) return null;

  return {
    ...rule,
    surface: token,
    remainder
  };
}

function splitIntoChunks(text) {
  if (text.length <= chunkSize) return [text.trim()];
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);
    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf("\n\n", end);
      const sentenceBreak = Math.max(
        text.lastIndexOf(". ", end),
        text.lastIndexOf("? ", end),
        text.lastIndexOf("! ", end)
      );
      const bestBreak = Math.max(paragraphBreak, sentenceBreak);
      if (bestBreak > start + chunkSize * 0.55) end = bestBreak + 1;
    }
    chunks.push(text.slice(start, end).trim());
    start = end;
  }

  return chunks.filter(Boolean);
}

function sectionsFor(book) {
  if (book?.importedContent) {
    return importedSectionRefs(book);
  }
  return splitIntoChunks(book.text || "");
}

function importedSectionRefs(book) {
  const chapters = book.chapterSummaries || [];
  const refs = [];

  for (const [chapterIndex, chapter] of chapters.entries()) {
    const sectionCount = Math.max(1, chapter.sectionCount || 1);
    for (let sectionIndex = 0; sectionIndex < sectionCount; sectionIndex += 1) {
      refs.push({
        chapterIndex,
        sectionIndex,
        label: chapters.length > 1
          ? `${chapter.title || `Chapter ${chapterIndex + 1}`} / ${sectionIndex + 1}`
          : String(sectionIndex + 1)
      });
    }
  }

  return refs.length ? refs : [{ chapterIndex: 0, sectionIndex: 0, label: "1" }];
}

function resolveLemma(token) {
  const exactWord = exactItalianKey(token);
  const word = normalizeItalian(token);
  if (!word) {
    return {
      lemma: "",
      confidence: 0,
      method: "empty",
      label: "No match",
      explanation: "The reader could not find a usable word form here."
    };
  }

  const elisionInfo = elisionInfoFor(token);
  if (elisionInfo) {
    const contentMatch = resolveLemma(elisionInfo.remainder);
    return {
      ...contentMatch,
      confidence: Math.min(0.98, contentMatch.confidence + 0.03),
      method: `elision-${contentMatch.method}`,
      label: "Elision-aware match",
      explanation: `The reader separated "${token}" into "${elisionInfo.prefix}" and "${elisionInfo.remainder}", then analyzed the content word under "${contentMatch.lemma}".`,
      elision: {
        ...elisionInfo,
        contentLemma: contentMatch.lemma,
        contentMethod: contentMatch.method
      }
    };
  }

  const accentRule = accentRuleFor(token);
  if (accentRule && hasItalianAccent(token)) {
    const lemma = lemmaForAccentRule(accentRule);
    return {
      lemma,
      confidence: 0.99,
      method: "accent-sensitive",
      label: "Accent-sensitive match",
      explanation: `"${token}" keeps its accent because it changes the word's meaning.`,
      accentNote: accentRule.note
    };
  }

  if (commonFormLemmas.has(exactWord)) {
    const lemma = commonFormLemmas.get(exactWord);
    const accentSensitive = hasItalianAccent(token);
    return {
      lemma,
      confidence: 0.98,
      method: accentSensitive ? "known-accented-form" : "known-exact-form",
      label: accentSensitive ? "Known accented form" : "Known exact form",
      explanation: accentSensitive
        ? `"${token}" is an accented form in the reader's common-form map, so it is grouped under "${lemma}".`
        : `"${token}" is an exact form in the reader's common-form map, so it is grouped under "${lemma}".`,
      accentNote: accentSensitive
        ? "This form is accent-sensitive, so the reader checks it before using loose accent-stripped matching."
        : ""
    };
  }

  if (commonFormLemmas.has(word)) {
    const lemma = commonFormLemmas.get(word);
    return {
      lemma,
      confidence: 0.96,
      method: "known-form",
      label: "Known form",
      explanation: `"${token}" is in the reader's common-form map, so it is grouped under "${lemma}".`
    };
  }

  if (dictionary.has(word)) {
    return {
      lemma: word,
      confidence: 0.98,
      method: "dictionary-direct",
      label: "Direct dictionary match",
      explanation: `"${token}" already appears as a dictionary form in the core word bank.`
    };
  }

  if (frequency.has(word)) {
    return {
      lemma: word,
      confidence: 0.9,
      method: "frequency-direct",
      label: "Direct frequency match",
      explanation: `"${token}" appears directly in the frequency list, so the reader keeps it as its own form.`
    };
  }

  const suffixes = [
    ["erebbero", "ere", 0.7], ["irebbero", "ire", 0.7], ["erebbe", "ere", 0.72], ["irebbe", "ire", 0.72],
    ["avano", "are", 0.76], ["evano", "ere", 0.76], ["ivano", "ire", 0.76], ["iamo", "are", 0.68],
    ["ato", "are", 0.76], ["ata", "are", 0.74], ["ati", "are", 0.72], ["ate", "are", 0.7],
    ["uto", "ere", 0.76], ["uta", "ere", 0.74], ["uti", "ere", 0.72], ["ute", "ere", 0.7],
    ["ito", "ire", 0.76], ["ita", "ire", 0.74], ["iti", "ire", 0.72], ["ite", "ire", 0.7],
    ["ando", "are", 0.72], ["endo", "ere", 0.72], ["mente", "", 0.68],
    ["zione", "zione", 0.66], ["zioni", "zione", 0.7], ["i", "o", 0.55], ["e", "a", 0.55]
  ];

  for (const [suffix, replacement, confidence] of suffixes) {
    if (word.length > suffix.length + 2 && word.endsWith(suffix)) {
      const candidate = word.slice(0, -suffix.length) + replacement;
      if (dictionary.has(candidate) || frequency.has(candidate)) {
        return {
          lemma: candidate,
          confidence,
          method: "ending-guess",
          label: "Ending-based guess",
          explanation: `The reader changed the ending of "${token}" to test the dictionary form "${candidate}".`
        };
      }
    }
  }

  return {
    lemma: word,
    confidence: 0.42,
    method: "surface-form",
    label: "Surface form",
    explanation: `No stronger lemma match was found yet, so the reader is treating "${token}" as its own word form.`
  };
}

function confidenceLabel(confidence) {
  if (confidence >= 0.93) return "High confidence";
  if (confidence >= 0.68) return "Medium confidence";
  if (confidence >= 0.5) return "Low confidence";
  return "Unconfirmed";
}

function clampConfidence(value) {
  return Math.max(0.15, Math.min(0.99, value));
}

function tokenizeWithOffsets(text) {
  const tokens = [];
  const matcher = /[\p{L}]+(?:['’][\p{L}]+)?/gu;
  let match;
  while ((match = matcher.exec(text))) {
    tokens.push({ token: match[0], index: match.index });
  }
  return tokens;
}

function sentenceRangesFor(text) {
  const ranges = [];
  const matcher = /[^.!?]+[.!?]+(?:["'”’»]+)?|[^.!?]+$/g;
  let match;

  while ((match = matcher.exec(text))) {
    const raw = match[0];
    const leading = raw.match(/^\s*/)?.[0].length || 0;
    const trailing = raw.match(/\s*$/)?.[0].length || 0;
    const start = match.index + leading;
    const end = match.index + raw.length - trailing;
    const sentence = text.slice(start, end).trim();
    if (!sentence) continue;
    ranges.push({
      index: ranges.length,
      start,
      end,
      text: sentence,
      emotion: analyzeSentenceEmotion(sentence)
    });
  }

  return ranges;
}

function sentenceIndexForOffset(sentences, offset) {
  const sentence = sentences.find((item) => offset >= item.start && offset < item.end);
  return sentence?.index ?? -1;
}

function analyzeSentenceEmotion(sentence) {
  const normalized = normalizeItalian(sentence);
  const lower = exactItalianKey(sentence);
  const cues = [];
  let score = 0;
  let label = "Neutral / unclear";
  let emoji = "😐";
  let explanation = "No strong emotional cue stood out, so this may depend on wider context or tone.";

  const cueGroups = [
    {
      label: "Disgust / annoyance",
      emoji: "🤢",
      score: 4,
      patterns: ["che schifo", "schifo", "disgustoso", "orribile", "mi fa schifo"],
      explanation: "The sentence uses disgust or rejection language."
    },
    {
      label: "Surprise / disbelief",
      emoji: "😳",
      score: 3,
      patterns: ["ma dai", "no vabbe", "non ci credo", "davvero", "addirittura"],
      explanation: "The sentence sounds like a reaction to something unexpected."
    },
    {
      label: "Joy / approval",
      emoji: "😊",
      score: 3,
      patterns: ["che bello", "bellissimo", "fantastico", "mi piace", "perfetto"],
      explanation: "The sentence contains approval, delight, or positive evaluation."
    },
    {
      label: "Anger / frustration",
      emoji: "😠",
      score: 3,
      patterns: ["basta", "non ne posso piu", "assurdo", "mi arrabbio", "che rabbia"],
      explanation: "The sentence contains irritation or frustration cues."
    },
    {
      label: "Doubt / hesitation",
      emoji: "🤔",
      score: 2,
      patterns: ["mah", "boh", "forse", "non so", "chissa"],
      explanation: "The sentence contains uncertainty, hesitation, or doubt."
    },
    {
      label: "Resignation / acceptance",
      emoji: "😮‍💨",
      score: 2,
      patterns: ["vabbe", "pazienza", "ormai", "alla fine"],
      explanation: "The sentence suggests acceptance, resignation, or moving on."
    }
  ];

  for (const group of cueGroups) {
    const hit = group.patterns.find((pattern) => normalized.includes(pattern));
    if (!hit) continue;
    cues.push(hit);
    if (group.score > score) {
      score = group.score;
      label = group.label;
      emoji = group.emoji;
      explanation = group.explanation;
    }
  }

  if (/[!?]{2,}|!/.test(sentence)) {
    cues.push("exclamation");
    if (score < 2) {
      score = 2;
      label = "Emphatic / expressive";
      emoji = "❗";
      explanation = "The punctuation makes the sentence feel more emotionally marked.";
    }
  }

  if (/\?/.test(sentence) && score < 2) {
    cues.push("question");
    label = "Question / uncertainty";
    emoji = "❓";
    explanation = "The sentence is framed as a question, so intent may depend on tone.";
  }

  if (/\b(molto|troppo|proprio|davvero|veramente)\b/i.test(lower)) {
    cues.push("intensifier");
  }

  return {
    label,
    emoji,
    confidence: score >= 4 ? "strong" : score >= 2 ? "medium" : "low",
    explanation,
    cues
  };
}

function readContextClues(tokens, index, text) {
  const current = tokens[index];
  const previous = tokens[index - 1];
  const next = tokens[index + 1];
  const word = normalizeItalian(current?.token);
  const previousWord = normalizeItalian(previous?.token);
  const nextWord = normalizeItalian(next?.token);
  const sentenceStart = isSentenceStart(text, current?.index || 0);
  const capitalized = /^[A-ZÀ-ÖØ-Þ]/.test(current?.token || "");
  const clues = [];

  if (capitalized && !sentenceStart) {
    clues.push({
      type: "proper-noun",
      weight: -0.24,
      label: "Possible name",
      text: `"${current.token}" is capitalized inside the sentence, so the reader treats the lemma guess more carefully.`
    });
  }

  if (articles.has(previousWord)) {
    clues.push({
      type: "article-before",
      weight: 0.08,
      label: "Article before it",
      text: `"${previous.token}" before this word makes a noun reading more likely.`
    });
  }

  if (auxiliaries.has(previousWord) && /(?:ato|ata|ati|ate|uto|uta|uti|ute|ito|ita|iti|ite)$/i.test(word)) {
    clues.push({
      type: "auxiliary-before",
      weight: 0.12,
      label: "Auxiliary before it",
      text: `"${previous.token}" before this word supports a verb-participle reading.`
    });
  }

  if (pronouns.has(previousWord)) {
    clues.push({
      type: "pronoun-before",
      weight: 0.07,
      label: "Pronoun before it",
      text: `"${previous.token}" before this word may point toward a verb or pronoun-linked phrase.`
    });
  }

  if (prepositions.has(previousWord)) {
    clues.push({
      type: "preposition-before",
      weight: 0.05,
      label: "Preposition before it",
      text: `"${previous.token}" gives the reader a small phrase clue.`
    });
  }

  if (articles.has(nextWord)) {
    clues.push({
      type: "article-after",
      weight: 0.05,
      label: "Article after it",
      text: `"${next.token}" after this word may signal a verb leading into a noun phrase.`
    });
  }

  return clues;
}

function isSentenceStart(text, index) {
  const before = text.slice(Math.max(0, index - 80), index);
  const trimmed = before.trimEnd();
  return !trimmed || /[.!?]\s*$/.test(trimmed);
}

function applyContextToLemma(lemmaMatch, contextClues) {
  const contextWeight = contextClues.reduce((sum, clue) => sum + clue.weight, 0);
  const confidence = clampConfidence(lemmaMatch.confidence + contextWeight);
  const strongestClue = [...contextClues].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))[0];
  const ambiguity = ambiguityForLemma(lemmaMatch.lemma, contextClues);

  return {
    ...lemmaMatch,
    confidence,
    baseConfidence: lemmaMatch.confidence,
    contextClues,
    contextLabel: strongestClue?.label || "No strong local clue",
    contextExplanation: strongestClue?.text || "Nearby words did not strongly change this lemma guess.",
    ambiguity
  };
}

function ambiguityForLemma(lemma, contextClues) {
  const entry = ambiguousLemmas.get(lemma);
  if (!entry) {
    return {
      isAmbiguous: false,
      roles: [],
      label: "No known ambiguity",
      explanation: "This word is not in the reader's starter ambiguity list yet."
    };
  }

  const clueTypes = new Set(contextClues.map((clue) => clue.type));
  const nounVotes = entry.nounClues.filter((clue) => clueTypes.has(clue)).length;
  const verbVotes = entry.verbClues.filter((clue) => clueTypes.has(clue)).length;
  let label = "Ambiguous form";
  let explanation = entry.note;

  if (nounVotes > verbVotes) {
    label = "Possible noun reading";
    explanation = `${entry.note} Local clues lean noun-like here.`;
  } else if (verbVotes > nounVotes) {
    label = "Possible verb reading";
    explanation = `${entry.note} Local clues lean verb-like here.`;
  }

  return {
    isAmbiguous: true,
    roles: entry.roles,
    label,
    explanation,
    nounVotes,
    verbVotes
  };
}

function zipfFor(lemma) {
  if (frequency.has(lemma)) return frequency.get(lemma);
  if (lemma.length <= 3) return 3.5;
  if (lemma.endsWith("zione") || lemma.endsWith("mente")) return 3.1;
  return 2.5;
}

function frequencyInfoFor(lemma) {
  return frequencyDetails.get(lemma) || {
    zipf: zipfFor(lemma),
    source: "heuristic",
    rank: "unranked",
    corpusFrequency: 0
  };
}

function accentEntryFor(token, lemma) {
  const rule = accentRuleFor(token, lemma);
  if (!rule) return null;
  return {
    lemma: lemmaForAccentRule(rule),
    meaning: accentRuleMeaning(rule),
    example: rule.example,
    note: rule.note,
    pos: "accent-sensitive form",
    targetRank: "accent-rule",
    corpusFrequency: 0,
    frequencySources: ["accent-rules"]
  };
}

function learnerInfoFor(token, lemma) {
  const exactToken = exactItalianKey(token);
  const exactLemma = exactItalianKey(lemma);
  const exactHit = learnerEntriesExact.get(exactToken)
    || learnerEntriesExact.get(exactLemma)
    || null;
  if (exactHit || hasItalianAccent(token) || hasItalianAccent(lemma)) return exactHit;
  return learnerEntriesNormalized.get(normalizeItalian(token))
    || learnerEntriesNormalized.get(normalizeItalian(lemma))
    || null;
}

function overflowInfoFor(token, lemma) {
  const exactToken = exactItalianKey(token);
  const exactLemma = exactItalianKey(lemma);
  const exactHit = dictionaryOverflowExact.get(exactToken)
    || dictionaryOverflowExact.get(exactLemma)
    || null;
  if (exactHit || hasItalianAccent(token) || hasItalianAccent(lemma)) return exactHit;
  return dictionaryOverflowNormalized.get(normalizeItalian(token))
    || dictionaryOverflowNormalized.get(normalizeItalian(lemma))
    || null;
}

function contextMarkerFor(tokens, index) {
  const normalizedToken = normalizeItalian(tokens[index]?.token);
  if (!normalizedToken) return null;

  for (const entry of contextPhraseEntries) {
    const length = entry.components.length;
    if (!length) continue;
    const firstStart = Math.max(0, index - length + 1);
    for (let start = firstStart; start <= index; start += 1) {
      if (start + length > tokens.length) continue;
      const phrase = tokens.slice(start, start + length).map((item) => normalizeItalian(item.token));
      if (entry.components.every((part, offset) => part === phrase[offset])) {
        return {
          ...entry,
          startIndex: start,
          endIndex: start + length - 1
        };
      }
    }
  }

  return contextMarkers.get(normalizedToken) || null;
}

function contextLiteralMeaning(contextInfo) {
  if (!contextInfo) return "";
  if (contextInfo.englishEquivalents?.length) return contextInfo.englishEquivalents.join(", ");
  return "Mostly conversational; the literal meaning is weaker than the social signal here.";
}

function contextConversationJob(contextInfo) {
  if (!contextInfo) return "";
  return contextInfo.pragmaticFunction || "This phrase helps manage the conversation more than it adds a concrete dictionary meaning.";
}

const wordLensProviders = [
  {
    id: "elision-contraction",
    label: "Elision and contraction layer",
    getNotes(row, sources) {
      const info = sources.elisionInfo;
      if (!info) return [];
      return [
        {
          providerId: this.id,
          title: "Expanded form",
          body: `${info.prefix} = ${info.expansion}; content word: ${info.remainder}`,
          tone: "elision"
        },
        {
          providerId: this.id,
          title: "Grammar job",
          body: `${info.label}: ${info.meaning}. ${info.note}`,
          tone: "elision"
        },
        {
          providerId: this.id,
          title: "Content lemma",
          body: `${info.remainder} is analyzed under ${info.contentLemma}.`,
          tone: "elision"
        }
      ];
    }
  },
  {
    id: "accent-sensitive",
    label: "Accent-sensitive layer",
    getNotes(row, sources) {
      const rule = sources.accentRule;
      if (!rule) return [];
      return [
        {
          providerId: this.id,
          title: "Accent-sensitive form",
          body: `${rule.accented} = ${rule.accentedMeaning}; ${rule.unaccented} = ${rule.unaccentedMeaning}`,
          tone: "accent"
        },
        {
          providerId: this.id,
          title: "Accent job",
          body: rule.note,
          tone: "accent"
        },
        rule.example
          ? {
              providerId: this.id,
              title: "Accent example",
              body: rule.example,
              tone: "accent"
            }
          : null
      ].filter(Boolean);
    }
  },
  {
    id: "local-context",
    label: "Local context layer",
    getNotes(row, sources) {
      const contextInfo = sources.contextInfo;
      if (!contextInfo) return [];
      return [
        {
          providerId: this.id,
          title: "Context marker",
          body: `${contextInfo.phrase}${contextInfo.isCluster ? " / clustered phrase" : ""}`,
          tone: "context"
        },
        {
          providerId: this.id,
          title: "Literal meaning",
          body: contextLiteralMeaning(contextInfo),
          tone: "context"
        },
        {
          providerId: this.id,
          title: "Conversation job",
          body: contextConversationJob(contextInfo),
          tone: "context"
        },
        contextInfo.example
          ? {
              providerId: this.id,
              title: "Context example",
              body: contextInfo.example,
              tone: "context"
            }
          : null
      ].filter(Boolean);
    }
  }
];

function wordLensProviderNotes(row, sources) {
  return wordLensProviders.flatMap((provider) => provider.getNotes(row, sources));
}

function renderProviderNote(note) {
  return `
    <div class="provider-note provider-note-${escapeHtml(note.tone || "default")}" data-provider="${escapeHtml(note.providerId)}">
      <dt>${escapeHtml(note.title)}</dt>
      <dd>${escapeHtml(note.body)}</dd>
    </div>
  `;
}

function lemmaStatus(lemma) {
  return lemmaModel[lemma]?.status || "auto";
}

function isKnown(lemma) {
  const status = lemmaStatus(lemma);
  if (status === "known" || status === "ignored") return true;
  if (status === "unknown") return false;
  if (status === "shaky") return zipfFor(lemma) >= 5.7;
  return defaultKnown.has(lemma) || zipfFor(lemma) >= 5.45;
}

function analyzeSection(text) {
  const tokens = tokenizeWithOffsets(text);
  const sentences = sentenceRangesFor(text);
  const rows = tokens.map((item, index) => {
    const baseLemmaMatch = resolveLemma(item.token);
    const contextClues = readContextClues(tokens, index, text);
    const lemmaMatch = applyContextToLemma(baseLemmaMatch, contextClues);
    const likelyProperNoun = contextClues.some((clue) => clue.type === "proper-noun");
    const known = isKnown(lemmaMatch.lemma);
    const entry = dictionary.get(lemmaMatch.lemma) || accentEntryFor(item.token, lemmaMatch.lemma);
    const contextMarker = contextMarkerFor(tokens, index);
    const sentenceIndex = sentenceIndexForOffset(sentences, item.index);
    return {
      ...item,
      lemma: lemmaMatch.lemma,
      lemmaMatch,
      contextMarker,
      elisionInfo: lemmaMatch.elision || null,
      sentenceIndex,
      likelyProperNoun,
      known,
      zipf: zipfFor(lemmaMatch.lemma),
      status: lemmaStatus(lemmaMatch.lemma),
      dictionaryHit: Boolean(entry),
      entry
    };
  });

  const knownTokens = rows.filter((row) => row.known).length;
  const coverage = rows.length ? knownTokens / rows.length : 0;
  const friction = summarizeFriction(rows);

  return {
    rows,
    knownTokens,
    coverage,
    friction,
    sentences,
    uniqueLemmas: new Set(rows.map((row) => row.lemma)).size,
    dictionaryHits: rows.filter((row) => row.dictionaryHit).length
  };
}

function summarizeFriction(rows) {
  const byLemma = new Map();
  for (const row of rows) {
    if (row.known || !row.lemma) continue;
    const existing = byLemma.get(row.lemma) || {
      lemma: row.lemma,
      token: row.token,
      count: 0,
      zipf: row.zipf,
      dictionaryHit: row.dictionaryHit,
      entry: row.entry,
      lemmaMatch: row.lemmaMatch,
      likelyProperNoun: row.likelyProperNoun,
      score: 0
    };
    existing.count += 1;
    existing.likelyProperNoun = existing.likelyProperNoun || row.likelyProperNoun;
    existing.score =
      existing.count * 1.2 +
      (existing.dictionaryHit ? 1.4 : 0) +
      (6 - Math.min(existing.zipf, 6)) * 0.6 +
      (existing.lemmaMatch?.confidence || 0) * 0.7 -
      (row.likelyProperNoun ? 1.8 : 0);
    byLemma.set(row.lemma, existing);
  }

  return [...byLemma.values()]
    .sort((a, b) => b.score - a.score || b.count - a.count || a.zipf - b.zipf)
    .slice(0, 10);
}

function coverageMood(coverage) {
  const percent = Math.round(coverage * 100);
  if (percent >= 96) return { label: "Comfortable", detail: "This section should mostly stay in flow." };
  if (percent >= 90) return { label: "Stretching", detail: "Readable, with a few places that may ask for the Word Lens." };
  if (percent >= 80) return { label: "Dense", detail: "Good for slower reading with support nearby." };
  return { label: "Exploratory", detail: "This may feel more like guided exploration than smooth reading." };
}

function supportsSpeechReader() {
  return Boolean(window.speechSynthesis && typeof window.SpeechSynthesisUtterance === "function");
}

function refreshItalianSpeechVoices() {
  if (!supportsSpeechReader()) return;
  italianSpeechVoices = window.speechSynthesis.getVoices()
    .filter((voice) => /^it(?:-|_)/i.test(voice.lang || ""))
    .sort((a, b) => Number(b.localService) - Number(a.localService) || a.name.localeCompare(b.name));

  if (speechSettings.voiceURI && !italianSpeechVoices.some((voice) => voice.voiceURI === speechSettings.voiceURI)) {
    speechSettings.voiceURI = "";
    saveSpeechSettings();
  }

  const voiceSelect = appEl.querySelector("#speechVoiceSelect");
  if (voiceSelect) {
    voiceSelect.innerHTML = renderSpeechVoiceOptions();
    voiceSelect.value = speechSettings.voiceURI;
  }
  updateSpeechControls();
}

function renderSpeechVoiceOptions() {
  if (!supportsSpeechReader()) return '<option value="">Speech unavailable</option>';
  if (!italianSpeechVoices.length) return '<option value="">Italian system voice</option>';
  return [
    '<option value="">Automatic Italian voice</option>',
    ...italianSpeechVoices.map((voice) => {
      const localNote = voice.localService ? " / Local" : "";
      return `<option value="${escapeHtml(voice.voiceURI)}" ${voice.voiceURI === speechSettings.voiceURI ? "selected" : ""}>${escapeHtml(`${voice.name} / ${voice.lang}${localNote}`)}</option>`;
    })
  ].join("");
}

function selectedItalianSpeechVoice() {
  return italianSpeechVoices.find((voice) => voice.voiceURI === speechSettings.voiceURI)
    || italianSpeechVoices.find((voice) => voice.localService)
    || italianSpeechVoices[0]
    || null;
}

function speechStatusLabel() {
  if (!supportsSpeechReader()) return "Speech unavailable";
  if (speechState.status === "speaking") return `Reading sentence ${speechState.sentenceIndex + 1}`;
  if (speechState.status === "paused") return `Paused at sentence ${speechState.sentenceIndex + 1}`;
  return "Audio ready";
}

function updateSpeechControls() {
  const toggleButton = appEl.querySelector("#speechToggleButton");
  const stopButton = appEl.querySelector("#speechStopButton");
  const status = appEl.querySelector("#speechStatus");
  if (!toggleButton || !stopButton || !status) return;

  const supported = supportsSpeechReader();
  const paused = speechState.status === "paused";
  const speaking = speechState.status === "speaking";
  toggleButton.disabled = !supported;
  stopButton.disabled = !supported || (!paused && !speaking);
  toggleButton.innerHTML = speaking ? "&#10074;&#10074;" : "&#9654;";
  toggleButton.setAttribute("aria-label", speaking ? "Pause audio reader" : paused ? "Resume audio reader" : "Start audio reader");
  toggleButton.title = speaking ? "Pause" : paused ? "Resume" : "Read aloud";
  status.textContent = speechStatusLabel();
}

function highlightSpokenSentence(sentenceIndex, shouldScroll = false) {
  for (const sentence of appEl.querySelectorAll(".sentence-span.is-speaking")) {
    sentence.classList.remove("is-speaking");
  }
  const activeSentence = appEl.querySelector(`.sentence-span[data-sentence="${sentenceIndex}"]`);
  if (!activeSentence) return;
  activeSentence.classList.add("is-speaking");
  if (shouldScroll) activeSentence.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearSpeechHighlight() {
  for (const sentence of appEl.querySelectorAll(".sentence-span.is-speaking")) {
    sentence.classList.remove("is-speaking");
  }
}

function selectSpeechSentence(sentenceIndex) {
  if (speechState.status !== "idle") return;
  speechState.sentenceIndex = sentenceIndex;
  updateSpeechControls();
}

function speakAnalyzedSentence(sentenceIndex, sessionId) {
  if (!supportsSpeechReader() || sessionId !== speechState.sessionId) return;
  const sentence = activeAnalysis?.sentences?.[sentenceIndex];
  if (!sentence) {
    speechState.status = "idle";
    speechState.sentenceIndex = 0;
    speechState.utterance = null;
    clearSpeechHighlight();
    updateSpeechControls();
    logInteraction("audio_reader_completed", {
      bookId: activeBook?.id,
      sectionIndex: activeSectionIndex
    });
    return;
  }

  const utterance = new window.SpeechSynthesisUtterance(sentence.text);
  const voice = selectedItalianSpeechVoice();
  utterance.lang = voice?.lang || "it-IT";
  utterance.rate = speechSettings.rate;
  if (voice) utterance.voice = voice;

  speechState.status = "speaking";
  speechState.sentenceIndex = sentenceIndex;
  speechState.utterance = utterance;
  saveActiveReadingPosition(sentenceIndex, { source: "audio-progress" });
  highlightSpokenSentence(sentenceIndex, sentenceIndex > 0);
  updateSpeechControls();

  utterance.onend = () => {
    if (sessionId !== speechState.sessionId) return;
    speakAnalyzedSentence(sentenceIndex + 1, sessionId);
  };
  utterance.onerror = (event) => {
    if (sessionId !== speechState.sessionId || event.error === "canceled" || event.error === "interrupted") return;
    speechState.status = "idle";
    speechState.utterance = null;
    clearSpeechHighlight();
    updateSpeechControls();
    logInteraction("audio_reader_error", {
      bookId: activeBook?.id,
      sectionIndex: activeSectionIndex,
      error: event.error || "speech-error"
    });
  };

  window.speechSynthesis.speak(utterance);
}

function toggleSpeechReader() {
  if (!supportsSpeechReader() || !activeAnalysis?.sentences?.length) return;
  if (speechState.status === "speaking") {
    window.speechSynthesis.pause();
    speechState.status = "paused";
    updateSpeechControls();
    logInteraction("audio_reader_paused", {
      bookId: activeBook?.id,
      sectionIndex: activeSectionIndex,
      sentenceIndex: speechState.sentenceIndex
    });
    return;
  }
  if (speechState.status === "paused") {
    window.speechSynthesis.resume();
    speechState.status = "speaking";
    updateSpeechControls();
    logInteraction("audio_reader_resumed", {
      bookId: activeBook?.id,
      sectionIndex: activeSectionIndex,
      sentenceIndex: speechState.sentenceIndex
    });
    return;
  }

  speechState.sessionId += 1;
  const startIndex = Math.min(speechState.sentenceIndex, activeAnalysis.sentences.length - 1);
  logInteraction("audio_reader_started", {
    bookId: activeBook?.id,
    sectionIndex: activeSectionIndex,
    sentenceIndex: startIndex,
    voice: selectedItalianSpeechVoice()?.name || "system-default",
    rate: speechSettings.rate
  });
  speakAnalyzedSentence(startIndex, speechState.sessionId);
}

function stopSpeechReader({ resetCursor = false, log = true } = {}) {
  const wasActive = speechState.status !== "idle";
  speechState.sessionId += 1;
  if (supportsSpeechReader()) window.speechSynthesis.cancel();
  speechState.status = "idle";
  speechState.utterance = null;
  if (resetCursor) speechState.sentenceIndex = 0;
  clearSpeechHighlight();
  updateSpeechControls();
  if (wasActive && log) {
    logInteraction("audio_reader_stopped", {
      bookId: activeBook?.id,
      sectionIndex: activeSectionIndex,
      sentenceIndex: speechState.sentenceIndex
    });
  }
}

function updateSpeechVoice(event) {
  speechSettings.voiceURI = event.target.value;
  saveSpeechSettings();
}

function updateSpeechRate(event) {
  speechSettings.rate = Number(event.target.value);
  saveSpeechSettings();
  const output = appEl.querySelector("#speechRateOutput");
  if (output) output.textContent = `${speechSettings.rate.toFixed(2)}x`;
}

function savedPlaceLabel(position) {
  if (!position) return "No saved place";
  return `Section ${position.sectionIndex + 1} / sentence ${position.sentenceIndex + 1}`;
}

function updateSavedPlaceUI(position = readingPositionFor(activeBook?.id)) {
  for (const sentence of appEl.querySelectorAll(".sentence-span.is-bookmarked")) {
    sentence.classList.remove("is-bookmarked");
  }

  const button = appEl.querySelector("#savePlaceButton");
  const status = appEl.querySelector("#savedPlaceStatus");
  const isCurrentSection = position?.sectionIndex === activeSectionIndex;
  const sentence = isCurrentSection
    ? appEl.querySelector(`.sentence-span[data-sentence="${position.sentenceIndex}"]`)
    : null;

  sentence?.classList.add("is-bookmarked");
  if (button) button.title = position ? `Saved at ${savedPlaceLabel(position)}` : "Save reading place";
  if (status) status.textContent = position ? savedPlaceLabel(position) : "Place not saved";
}

function saveActiveReadingPosition(sentenceIndex = speechState.sentenceIndex, { announce = false, source = "manual" } = {}) {
  if (!activeBook || !activeAnalysis?.sentences?.length) return;
  const safeSentenceIndex = Math.max(0, Math.min(sentenceIndex, activeAnalysis.sentences.length - 1));
  const position = {
    sectionIndex: activeSectionIndex,
    sentenceIndex: safeSentenceIndex,
    updatedAt: new Date().toISOString()
  };
  readingPositions[activeBook.id] = position;
  saveReadingPositions();
  updateSavedPlaceUI(position);

  if (announce) {
    const status = appEl.querySelector("#savedPlaceStatus");
    if (status) status.textContent = `Saved: ${savedPlaceLabel(position)}`;
  }
  logInteraction("reading_place_saved", {
    bookId: activeBook.id,
    sectionIndex: position.sectionIndex,
    sentenceIndex: position.sentenceIndex,
    source
  });
}

function restoreActiveReadingPosition() {
  const position = readingPositionFor(activeBook?.id);
  if (!position || position.sectionIndex !== activeSectionIndex || !activeAnalysis?.sentences?.length) {
    saveActiveReadingPosition(0, { source: "section-opened" });
    return;
  }

  const sentenceIndex = Math.max(0, Math.min(position.sentenceIndex, activeAnalysis.sentences.length - 1));
  speechState.sentenceIndex = sentenceIndex;
  updateSavedPlaceUI({ ...position, sentenceIndex });
  if (restoreSavedPositionOnRender) {
    appEl.querySelector(`.sentence-span[data-sentence="${sentenceIndex}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  restoreSavedPositionOnRender = false;
  updateSpeechControls();
}

function initializeSpeechReader() {
  if (!supportsSpeechReader()) return;
  refreshItalianSpeechVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", refreshItalianSpeechVoices);
}

function formatMediaTime(value) {
  const seconds = Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function buildMockTranscript(duration) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 60;
  const lines = [
    [0.04, "Oggi proviamo ad ascoltare senza tradurre ogni parola."],
    [0.22, "Prima cerchiamo il senso generale della frase."],
    [0.43, "Poi possiamo fermarci su un'espressione interessante."],
    [0.66, "Il contesto ci aiuta a capire il tono e l'intenzione."],
    [0.84, "Alla fine, riascoltiamo tutto con un po' più di fiducia."]
  ];
  return lines.map(([ratio, text], index) => ({
    id: `mock-cue-${index + 1}`,
    start: Math.min(Math.max(0, safeDuration - 0.25), safeDuration * ratio),
    text
  }));
}

function activeTranscriptCue(cues, currentTime) {
  let active = null;
  for (const cue of cues || []) {
    if (cue.start > currentTime) break;
    active = cue;
  }
  return active;
}

function renderMediaTranscript(cues) {
  if (!cues.length) return `<p class="media-transcript-empty">Connect media to prepare mock timing markers.</p>`;
  return cues.map((cue) => `
    <button class="media-transcript-cue" type="button" data-cue-id="${escapeHtml(cue.id)}" data-start="${cue.start}">
      <time>${formatMediaTime(cue.start)}</time>
      <span lang="it">${escapeHtml(cue.text)}</span>
    </button>
  `).join("");
}

const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_STANDARD_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"]);
const YOUTUBE_SHORT_HOSTS = new Set(["youtu.be", "www.youtu.be"]);
const YOUTUBE_PRIVACY_HOSTS = new Set(["youtube-nocookie.com", "www.youtube-nocookie.com"]);
const YOUTUBE_DESKTOP_CLIENT_REFERER = "https://com.passatoprossimo.immersion/";
let youtubeIframeApiPromise = null;

function isYouTubeHostname(hostname) {
  const normalized = String(hostname || "").toLowerCase();
  return YOUTUBE_STANDARD_HOSTS.has(normalized)
    || YOUTUBE_SHORT_HOSTS.has(normalized)
    || YOUTUBE_PRIVACY_HOSTS.has(normalized);
}

function parseYouTubeVideoUrl(rawUrl) {
  let url;
  try {
    url = new URL(String(rawUrl || "").trim());
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(url.protocol) || !isYouTubeHostname(url.hostname)) return null;
  if (url.username || url.password) throw new Error("YouTube links cannot include a username or password.");

  const pathParts = url.pathname.split("/").filter(Boolean);
  let videoId = "";
  let format = "";

  if (YOUTUBE_SHORT_HOSTS.has(url.hostname.toLowerCase())) {
    videoId = pathParts[0] || "";
    format = "short-link";
  } else if (url.pathname === "/watch" || url.pathname === "/watch/") {
    videoId = url.searchParams.get("v") || "";
    format = "watch";
  } else if (["shorts", "embed", "live", "v"].includes(pathParts[0])) {
    videoId = pathParts[1] || "";
    format = pathParts[0];
  }

  if (!videoId) {
    throw new Error("This is a YouTube link, but it does not point to one video.");
  }
  if (!YOUTUBE_VIDEO_ID_PATTERN.test(videoId)) {
    throw new Error("The YouTube video ID is malformed or incomplete.");
  }

  return Object.freeze({
    provider: "youtube",
    videoId,
    format,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`
  });
}

function normalizeYouTubePlayerError(rawCode) {
  const code = Number(rawCode);
  const knownErrors = {
    2: {
      kind: "invalid-request",
      message: "YouTube could not understand this video request. Check the video link."
    },
    5: {
      kind: "playback-failed",
      message: "YouTube could not play this video in the desktop player."
    },
    100: {
      kind: "video-unavailable",
      message: "This YouTube video is unavailable, private, or has been removed."
    },
    101: {
      kind: "embedding-blocked",
      message: "The video's owner does not allow playback inside other apps."
    },
    150: {
      kind: "embedding-blocked",
      message: "The video's owner does not allow playback inside other apps."
    },
    153: {
      kind: "client-identity-missing",
      message: "YouTube could not verify this desktop app's playback identity."
    }
  };
  const normalized = knownErrors[code] || {
    kind: "unknown-player-error",
    message: "The YouTube player reported an unexpected playback error."
  };
  return Object.freeze({
    provider: "youtube",
    code: Number.isFinite(code) ? code : "unknown",
    ...normalized
  });
}

function buildYouTubeRestingSource(parsedSource) {
  if (!parsedSource || parsedSource.provider !== "youtube" || !YOUTUBE_VIDEO_ID_PATTERN.test(parsedSource.videoId)) {
    throw new Error("A valid parsed YouTube source is required.");
  }
  return Object.freeze({
    provider: "youtube",
    videoId: parsedSource.videoId,
    format: parsedSource.format,
    canonicalUrl: parsedSource.canonicalUrl,
    title: "YouTube video",
    metadata: `Video ID ${parsedSource.videoId} / ${parsedSource.format} link`,
    thumbnailUrl: `https://i.ytimg.com/vi/${parsedSource.videoId}/hqdefault.jpg`
  });
}

function normalizeYouTubePlayerState(rawState) {
  const states = {
    0: "ended",
    1: "playing",
    2: "paused",
    3: "buffering",
    5: "paused",
    "-1": "paused"
  };
  return states[Number(rawState)] || null;
}

function loadYouTubeIframeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeIframeApiPromise) return youtubeIframeApiPromise;

  youtubeIframeApiPromise = new Promise((resolve, reject) => {
    const previousReadyHandler = window.onYouTubeIframeAPIReady;
    const timeoutId = window.setTimeout(() => {
      youtubeIframeApiPromise = null;
      reject(new Error("The YouTube player took too long to load."));
    }, 15000);

    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeoutId);
      previousReadyHandler?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("The YouTube player API loaded without a player."));
    };

    let script = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!script) {
      script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.append(script);
    }
    script.addEventListener("error", () => {
      window.clearTimeout(timeoutId);
      youtubeIframeApiPromise = null;
      reject(new Error("The YouTube player API could not be reached."));
    }, { once: true });
  });
  return youtubeIframeApiPromise;
}

function createYouTubeMediaProvider({ mount, stage, videoId, youtubeApi = window.YT }) {
  if (!youtubeApi?.Player) throw new Error("The YouTube player API is not ready.");
  if (!YOUTUBE_VIDEO_ID_PATTERN.test(String(videoId || ""))) throw new Error("A valid YouTube video ID is required.");

  const subscribers = new Map();
  let player = null;
  let ready = false;
  let destroyed = false;
  let playbackState = "paused";
  let clockId = null;

  function emit(eventName, detail = {}) {
    if (destroyed) return;
    for (const handler of subscribers.get(eventName) || []) handler(detail);
  }

  function safelyRead(methodName, fallback = 0) {
    if (!ready || typeof player?.[methodName] !== "function") return fallback;
    try {
      const value = player[methodName]();
      return Number.isFinite(value) ? value : fallback;
    } catch {
      return fallback;
    }
  }

  function playbackSnapshot() {
    return {
      currentTime: safelyRead("getCurrentTime"),
      duration: safelyRead("getDuration")
    };
  }

  function startClock() {
    if (clockId !== null) return;
    clockId = window.setInterval(() => emit("time", playbackSnapshot()), 250);
  }

  player = new youtubeApi.Player(mount, {
    width: "100%",
    height: "100%",
    videoId,
    playerVars: {
      controls: 1,
      playsinline: 1,
      rel: 0,
      hl: "it",
      cc_lang_pref: "it",
      enablejsapi: 1,
      widget_referrer: YOUTUBE_DESKTOP_CLIENT_REFERER
    },
    events: {
      onReady(event) {
        if (destroyed) return;
        player = event.target;
        ready = true;
        startClock();
        emit("ready", playbackSnapshot());
        emit("state", { state: "paused" });
      },
      onStateChange(event) {
        if (destroyed) return;
        const state = normalizeYouTubePlayerState(event.data);
        if (!state) return;
        playbackState = state;
        emit("state", { state });
        emit("time", playbackSnapshot());
      },
      onError(event) {
        if (destroyed) return;
        emit("error", normalizeYouTubePlayerError(event.data));
      },
      onAutoplayBlocked() {
        if (destroyed) return;
        playbackState = "paused";
        emit("state", { state: "paused" });
        emit("error", {
          provider: "youtube",
          code: "autoplay-blocked",
          kind: "autoplay-blocked",
          message: "Playback needs a direct click before YouTube can start this video."
        });
      }
    }
  });

  return {
    id: "youtube-iframe-v1",
    kind: "youtube-video",
    contractVersion: 2,
    capabilities: Object.freeze({
      volume: true,
      playbackRate: true,
      fullscreen: true,
      surfaceInteraction: false,
      playbackRates: Object.freeze([0.75, 1, 1.25, 1.5])
    }),
    on(eventName, handler) {
      if (!subscribers.has(eventName)) subscribers.set(eventName, new Set());
      subscribers.get(eventName).add(handler);
      return () => subscribers.get(eventName)?.delete(handler);
    },
    load(source) {
      const nextVideoId = typeof source === "string" ? source : source?.videoId;
      if (!YOUTUBE_VIDEO_ID_PATTERN.test(String(nextVideoId || ""))) throw new Error("A valid YouTube video ID is required.");
      if (ready) player.cueVideoById(nextVideoId);
    },
    play() {
      if (ready) player.playVideo();
      return Promise.resolve();
    },
    pause() {
      if (ready) player.pauseVideo();
    },
    seekTo(seconds) {
      if (!ready) return;
      const duration = safelyRead("getDuration");
      const target = Math.max(0, Math.min(Number(seconds) || 0, duration));
      player.seekTo(target, true);
      emit("time", playbackSnapshot());
    },
    setVolume(value) {
      if (ready) player.setVolume(Math.round(Math.max(0, Math.min(Number(value) || 0, 1)) * 100));
    },
    setPlaybackRate(value) {
      if (ready) player.setPlaybackRate(Math.max(0.25, Math.min(Number(value) || 1, 2)));
    },
    currentTime() {
      return safelyRead("getCurrentTime");
    },
    duration() {
      return safelyRead("getDuration");
    },
    isPaused() {
      return playbackState !== "playing";
    },
    requestFullscreen() {
      return stage.requestFullscreen?.();
    },
    unload() {
      if (ready) player.stopVideo();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (clockId !== null) window.clearInterval(clockId);
      clockId = null;
      try {
        player?.destroy?.();
      } catch {
      }
      player = null;
      subscribers.clear();
    }
  };
}

function validateDirectMediaUrl(rawUrl) {
  let url;
  try {
    url = new URL(String(rawUrl || "").trim());
  } catch {
    throw new Error("Enter a complete direct http or https media URL.");
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only direct http and https media URLs are supported here.");
  }
  const hostname = url.hostname.toLowerCase();
  if (isYouTubeHostname(hostname)) {
    throw new Error("This YouTube link must be opened through the YouTube provider.");
  }
  const privateIpv4 = /^(0\.|10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(hostname);
  const privateIpv6 = /^\[?(::|::1|f[cd][0-9a-f:]*|fe[89ab][0-9a-f:]*)\]?$/i.test(hostname);
  if (url.username || url.password || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || privateIpv4 || privateIpv6) {
    throw new Error("Local and private-network media URLs are not supported.");
  }
  url.hash = "";
  return url;
}

function mediaNameFromUrl(url) {
  const rawPart = url.pathname.split("/").filter(Boolean).pop() || "";
  let finalPart = rawPart;
  try {
    finalPart = decodeURIComponent(rawPart);
  } catch {
  }
  return finalPart || url.hostname;
}

function looksLikeAudioSource(nameOrType) {
  return /(^audio\/|\.(mp3|m4a|aac|wav|ogg|opus|flac)(?:$|[?#]))/i.test(String(nameOrType || ""));
}

function releaseMediaObjectUrl() {
  if (activeMediaObjectUrl) URL.revokeObjectURL?.(activeMediaObjectUrl);
  activeMediaObjectUrl = "";
  activeMediaFileName = "";
  activeMediaTranscript = [];
}

function createHtmlMediaProvider(media, stage) {
  const subscribers = new Map();
  const nativeListeners = [];

  function emit(eventName, detail = {}) {
    for (const handler of subscribers.get(eventName) || []) handler(detail);
  }

  function listen(eventName, handler) {
    media.addEventListener(eventName, handler);
    nativeListeners.push([eventName, handler]);
  }

  function playbackSnapshot() {
    return {
      currentTime: Number.isFinite(media.currentTime) ? media.currentTime : 0,
      duration: Number.isFinite(media.duration) ? media.duration : 0
    };
  }

  listen("loadedmetadata", () => emit("ready", playbackSnapshot()));
  listen("timeupdate", () => emit("time", playbackSnapshot()));
  listen("play", () => emit("state", { state: "playing" }));
  listen("pause", () => emit("state", { state: "paused" }));
  listen("waiting", () => emit("state", { state: "buffering" }));
  listen("ended", () => emit("state", { state: "ended" }));
  listen("error", () => emit("error", {
    code: media.error?.code || "html-media-error",
    message: media.error?.message || "This media source could not be opened or streamed"
  }));
  listen("click", () => emit("surface-interaction", { action: "toggle-playback" }));

  return {
    id: "html-media-v1",
    kind: "direct-or-local-media",
    contractVersion: 2,
    capabilities: Object.freeze({
      volume: true,
      playbackRate: true,
      fullscreen: Boolean(stage.requestFullscreen),
      surfaceInteraction: true,
      playbackRates: Object.freeze([0.75, 1, 1.25, 1.5])
    }),
    on(eventName, handler) {
      if (!subscribers.has(eventName)) subscribers.set(eventName, new Set());
      subscribers.get(eventName).add(handler);
      return () => subscribers.get(eventName)?.delete(handler);
    },
    load(sourceUrl) {
      media.src = sourceUrl;
      media.load();
    },
    play() {
      return media.play();
    },
    pause() {
      media.pause();
    },
    seekTo(seconds) {
      const duration = Number.isFinite(media.duration) ? media.duration : 0;
      media.currentTime = Math.max(0, Math.min(Number(seconds) || 0, duration));
    },
    setVolume(value) {
      media.volume = Math.max(0, Math.min(Number(value) || 0, 1));
    },
    setPlaybackRate(value) {
      media.playbackRate = Math.max(0.5, Math.min(Number(value) || 1, 2));
    },
    currentTime() {
      return Number.isFinite(media.currentTime) ? media.currentTime : 0;
    },
    duration() {
      return Number.isFinite(media.duration) ? media.duration : 0;
    },
    isPaused() {
      return media.paused;
    },
    requestFullscreen() {
      return stage.requestFullscreen?.();
    },
    unload() {
      media.pause();
      media.removeAttribute("src");
      media.load();
    },
    destroy() {
      for (const [eventName, handler] of nativeListeners) {
        media.removeEventListener(eventName, handler);
      }
      nativeListeners.length = 0;
      subscribers.clear();
    }
  };
}

function renderMediaShell() {
  stopSpeechReader({ resetCursor: true, log: false });
  activeBook = null;
  activeAnalysis = null;
  appEl.innerHTML = `
    <section class="media-lab">
      <header class="media-lab-bar">
        <button class="ghost-button" id="mediaBackButton" type="button">Shelf</button>
        <div>
          <p class="eyebrow">Passato Prossimo / 0.6 Public Alpha</p>
          <h1>Media Shell</h1>
        </div>
        <span class="media-provider-status" id="mediaProviderStatus">No source connected</span>
      </header>

      <main class="media-workspace">
        <section class="media-player-column">
          <div class="media-stage is-resting" id="mediaStage">
            <video id="mediaElement" preload="metadata" playsinline aria-label="Active media surface"></video>
            <img class="media-resting-thumbnail" id="mediaRestingThumbnail" alt="" hidden />
            <div class="youtube-player-host" id="youtubePlayerHost" aria-label="YouTube player"></div>
            <div class="media-audio-visual" aria-hidden="true">
              <strong>Audio</strong>
              <div><span></span><span></span><span></span><span></span><span></span></div>
            </div>
            <button class="media-fullscreen-exit" id="mediaFullscreenExit" type="button">Exit fullscreen <span aria-hidden="true">&#8595;</span></button>
            <div class="media-resting-cover" id="mediaRestingCover">
              <span>Resting media object</span>
              <h2 id="mediaObjectTitle">No media selected</h2>
              <p id="mediaObjectMeta">Choose local audio/video or connect a direct media URL.</p>
              <div>
                <button class="media-primary-button" id="chooseMediaButton" type="button">Choose local media</button>
                <button class="ghost-button" id="activateMediaButton" type="button" hidden>Activate player</button>
                <button class="ghost-button" id="openYouTubeSourceButton" type="button" hidden>Open on YouTube <span aria-hidden="true">&#8599;</span></button>
              </div>
            </div>
          </div>

          <form class="media-direct-url" id="mediaDirectUrlForm">
            <label for="mediaDirectUrlInput">Media or YouTube URL</label>
            <div>
              <input id="mediaDirectUrlInput" type="url" inputmode="url" placeholder="https://example.com/audio.mp3" required />
              <button class="ghost-button" type="submit">Connect</button>
            </div>
            <small>Connect browser-playable media or prepare a YouTube video.</small>
          </form>

          <div class="media-caption-band" id="mediaCaptionBand" lang="it">Mock transcript cues will appear here.</div>

          <div class="media-bubble-toolbar" aria-label="Media controls">
            <button class="media-icon-button" id="mediaBackTen" type="button" aria-label="Back 10 seconds" title="Back 10 seconds" disabled>&#8630;</button>
            <button class="media-play-button" id="mediaPlayButton" type="button" aria-label="Play" title="Play" disabled>&#9654;</button>
            <button class="media-icon-button" id="mediaForwardTen" type="button" aria-label="Forward 10 seconds" title="Forward 10 seconds" disabled>&#8631;</button>
            <label class="media-seek-label">
              <span class="sr-only">Playback position</span>
              <input id="mediaSeekInput" type="range" min="0" max="1000" value="0" disabled />
            </label>
            <output class="media-time-output" id="mediaTimeOutput">0:00 / 0:00</output>
            <label class="media-volume-label" title="Volume">
              <span aria-hidden="true">Vol</span>
              <input id="mediaVolumeInput" type="range" min="0" max="1" step="0.05" value="1" disabled />
            </label>
            <label class="media-rate-label">
              <span class="sr-only">Playback speed</span>
              <select id="mediaRateSelect" aria-label="Playback speed" disabled>
                <option value="0.75">0.75x</option>
                <option value="1" selected>1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
              </select>
            </label>
            <button class="media-icon-button" id="mediaFullscreenButton" type="button" aria-label="Fullscreen" title="Fullscreen" disabled>&#x26F6;</button>
            <button class="media-rest-button" id="restMediaButton" type="button" disabled>Rest media</button>
          </div>
          <input id="localMediaInput" type="file" accept="audio/*,video/*" hidden />
        </section>

        <aside class="media-transcript-rail" aria-labelledby="mediaTranscriptTitle">
          <header>
            <span>Transcript provider</span>
            <h2 id="mediaTranscriptTitle">Mock transcript</h2>
            <p>Timing is generated from video duration. The Italian lines are placeholders for synchronization testing.</p>
          </header>
          <div class="media-transcript-list" id="mediaTranscriptList">
            ${renderMediaTranscript([])}
          </div>
        </aside>
      </main>
    </section>
  `;

  const media = appEl.querySelector("#mediaElement");
  const stage = appEl.querySelector("#mediaStage");
  const fileInput = appEl.querySelector("#localMediaInput");
  const chooseButton = appEl.querySelector("#chooseMediaButton");
  const activateButton = appEl.querySelector("#activateMediaButton");
  const playButton = appEl.querySelector("#mediaPlayButton");
  const seekInput = appEl.querySelector("#mediaSeekInput");
  const volumeInput = appEl.querySelector("#mediaVolumeInput");
  const rateSelect = appEl.querySelector("#mediaRateSelect");
  const restingThumbnail = appEl.querySelector("#mediaRestingThumbnail");
  const openYouTubeButton = appEl.querySelector("#openYouTubeSourceButton");
  const youtubePlayerHost = appEl.querySelector("#youtubePlayerHost");
  let mediaProvider = createHtmlMediaProvider(media, stage);
  let providerUnsubscribers = [];
  let connectedSourceKind = "none";
  let connectedYouTubeSource = null;
  const basicControlIds = ["mediaBackTen", "mediaPlayButton", "mediaForwardTen", "mediaSeekInput", "restMediaButton"];

  function setControlsEnabled(enabled) {
    for (const id of basicControlIds) {
      const control = appEl.querySelector(`#${id}`);
      if (control) control.disabled = !enabled;
    }
    volumeInput.disabled = !enabled || !mediaProvider.capabilities.volume;
    rateSelect.disabled = !enabled || !mediaProvider.capabilities.playbackRate;
    appEl.querySelector("#mediaFullscreenButton").disabled = !enabled || !mediaProvider.capabilities.fullscreen;
  }

  function sourceLabel() {
    if (connectedSourceKind === "direct-url") return "Direct URL";
    if (connectedSourceKind === "youtube") return "YouTube";
    return "Local media";
  }

  function replaceMediaProvider(nextProvider) {
    for (const unsubscribe of providerUnsubscribers) unsubscribe();
    providerUnsubscribers = [];
    mediaProvider.destroy?.();
    mediaProvider = nextProvider;
    bindMediaProviderEvents();
  }

  function ensureHtmlMediaProvider() {
    if (mediaProvider.id === "html-media-v1") return;
    replaceMediaProvider(createHtmlMediaProvider(media, stage));
    youtubePlayerHost.innerHTML = "";
  }

  function setAwake(awake) {
    if (connectedSourceKind === "none") return;
    stage.classList.toggle("is-resting", !awake);
    stage.classList.toggle("is-awake", awake);
    setControlsEnabled(awake);
    appEl.querySelector("#mediaProviderStatus").textContent = awake ? `${sourceLabel()} / active` : `${sourceLabel()} / resting`;
    if (!awake) {
      mediaProvider.pause();
      playButton.innerHTML = "&#9654;";
      playButton.setAttribute("aria-label", "Play");
    }
  }

  function connectMediaSource({ sourceUrl, label, meta, sourceKind, isAudio }) {
    ensureHtmlMediaProvider();
    connectedSourceKind = sourceKind;
    connectedYouTubeSource = null;
    activeMediaFileName = label;
    stage.classList.toggle("is-audio", Boolean(isAudio));
    stage.classList.remove("is-youtube");
    stage.classList.add("has-media", "is-resting");
    stage.classList.remove("is-awake");
    appEl.querySelector("#mediaObjectTitle").textContent = label;
    appEl.querySelector("#mediaObjectMeta").textContent = meta;
    appEl.querySelector("#mediaProviderStatus").textContent = "Reading media metadata...";
    chooseButton.textContent = "Choose another local file";
    activateButton.textContent = "Activate player";
    activateButton.hidden = false;
    openYouTubeButton.hidden = true;
    restingThumbnail.hidden = true;
    restingThumbnail.removeAttribute("src");
    setControlsEnabled(false);
    mediaProvider.load(sourceUrl);
  }

  function connectYouTubeRestingSource(parsedSource) {
    const source = buildYouTubeRestingSource(parsedSource);
    releaseMediaObjectUrl();
    ensureHtmlMediaProvider();
    mediaProvider.unload();
    connectedSourceKind = "youtube";
    connectedYouTubeSource = source;
    activeMediaFileName = source.videoId;
    activeMediaTranscript = [];
    stage.classList.add("has-media", "is-resting", "is-youtube");
    stage.classList.remove("is-awake", "is-audio");
    restingThumbnail.src = source.thumbnailUrl;
    restingThumbnail.alt = "YouTube video thumbnail";
    restingThumbnail.hidden = false;
    appEl.querySelector("#mediaObjectTitle").textContent = source.title;
    appEl.querySelector("#mediaObjectMeta").textContent = source.metadata;
    appEl.querySelector("#mediaProviderStatus").textContent = "YouTube / resting";
    chooseButton.textContent = "Choose local media";
    activateButton.textContent = "Activate YouTube player";
    activateButton.hidden = false;
    activateButton.disabled = false;
    openYouTubeButton.hidden = false;
    appEl.querySelector("#mediaCaptionBand").textContent = "Transcript source not connected.";
    appEl.querySelector("#mediaTranscriptList").innerHTML = renderMediaTranscript([]);
    setControlsEnabled(false);
    logInteraction("youtube_resting_source_prepared", {
      videoId: source.videoId,
      format: source.format
    });
  }

  async function activateYouTubeSource() {
    const source = connectedYouTubeSource;
    if (!source) return;
    activateButton.disabled = true;
    appEl.querySelector("#mediaProviderStatus").textContent = "Loading YouTube player...";
    try {
      const youtubeApi = await loadYouTubeIframeApi();
      if (connectedYouTubeSource !== source) return;
      youtubePlayerHost.innerHTML = '<div class="youtube-player-mount"></div>';
      const provider = createYouTubeMediaProvider({
        mount: youtubePlayerHost.querySelector(".youtube-player-mount"),
        stage,
        videoId: source.videoId,
        youtubeApi
      });
      replaceMediaProvider(provider);
      stage.classList.remove("is-resting");
      stage.classList.add("is-awake", "is-youtube");
      setControlsEnabled(false);
      appEl.querySelector("#mediaProviderStatus").textContent = "YouTube / connecting";
      logInteraction("youtube_player_activated", {
        videoId: source.videoId,
        provider: provider.id
      });
    } catch (error) {
      youtubePlayerHost.innerHTML = "";
      stage.classList.add("is-resting");
      stage.classList.remove("is-awake");
      activateButton.disabled = false;
      appEl.querySelector("#mediaProviderStatus").textContent = error.message || "The YouTube player could not be loaded.";
    }
  }

  function restActiveMedia() {
    if (connectedSourceKind === "youtube" && mediaProvider.id === "youtube-iframe-v1") {
      replaceMediaProvider(createHtmlMediaProvider(media, stage));
      youtubePlayerHost.innerHTML = "";
      restingThumbnail.hidden = false;
      activateButton.disabled = false;
      activeMediaTranscript = [];
      appEl.querySelector("#mediaTranscriptList").innerHTML = renderMediaTranscript([]);
      appEl.querySelector("#mediaCaptionBand").textContent = "Transcript source not connected.";
    }
    setAwake(false);
  }

  function leaveMediaShell() {
    for (const unsubscribe of providerUnsubscribers) unsubscribe();
    providerUnsubscribers = [];
    mediaProvider.destroy?.();
    youtubePlayerHost.innerHTML = "";
    renderLibrary();
  }

  function updatePlaybackUI() {
    const duration = mediaProvider.duration();
    const currentTime = mediaProvider.currentTime();
    seekInput.value = duration ? String(Math.round((currentTime / duration) * 1000)) : "0";
    appEl.querySelector("#mediaTimeOutput").textContent = `${formatMediaTime(currentTime)} / ${formatMediaTime(duration)}`;
    const activeCue = activeTranscriptCue(activeMediaTranscript, currentTime);
    appEl.querySelector("#mediaCaptionBand").textContent = activeCue?.text || "Listening for the next mock transcript cue...";
    for (const cueButton of appEl.querySelectorAll(".media-transcript-cue")) {
      cueButton.classList.toggle("is-current", cueButton.dataset.cueId === activeCue?.id);
    }
  }

  function bindTranscriptCues() {
    for (const cueButton of appEl.querySelectorAll(".media-transcript-cue")) {
      cueButton.addEventListener("click", () => {
        setAwake(true);
        mediaProvider.seekTo(Number(cueButton.dataset.start) || 0);
        mediaProvider.play().catch(() => {});
      });
    }
  }

  appEl.querySelector("#mediaBackButton").addEventListener("click", leaveMediaShell);
  chooseButton.addEventListener("click", () => fileInput.click());
  activateButton.addEventListener("click", () => {
    if (connectedSourceKind === "youtube") activateYouTubeSource();
    else setAwake(true);
  });
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    releaseMediaObjectUrl();
    activeMediaObjectUrl = URL.createObjectURL(file);
    connectMediaSource({
      sourceUrl: activeMediaObjectUrl,
      label: file.name,
      meta: `${file.type || "Local media"} / ${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      sourceKind: "local-file",
      isAudio: file.type.startsWith("audio/") || looksLikeAudioSource(file.name)
    });
  });

  appEl.querySelector("#mediaDirectUrlForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = appEl.querySelector("#mediaDirectUrlInput");
    try {
      const youtubeSource = parseYouTubeVideoUrl(input.value);
      if (youtubeSource) {
        connectYouTubeRestingSource(youtubeSource);
        return;
      }
      const url = validateDirectMediaUrl(input.value);
      const label = mediaNameFromUrl(url);
      releaseMediaObjectUrl();
      connectMediaSource({
        sourceUrl: url.toString(),
        label,
        meta: `${url.hostname} / direct remote media`,
        sourceKind: "direct-url",
        isAudio: looksLikeAudioSource(label)
      });
    } catch (error) {
      appEl.querySelector("#mediaProviderStatus").textContent = error.message;
    }
  });
  restingThumbnail.addEventListener("error", () => {
    restingThumbnail.hidden = true;
    if (connectedSourceKind === "youtube") {
      appEl.querySelector("#mediaProviderStatus").textContent = "YouTube / resting / thumbnail unavailable";
    }
  });
  openYouTubeButton.addEventListener("click", async () => {
    if (!connectedYouTubeSource) return;
    logInteraction("youtube_original_opened", { videoId: connectedYouTubeSource.videoId });
    if (window.immersion?.openExternal) {
      await window.immersion.openExternal(connectedYouTubeSource.canonicalUrl).catch(() => {});
      return;
    }
    window.open(connectedYouTubeSource.canonicalUrl, "_blank", "noopener,noreferrer");
  });

  function bindMediaProviderEvents() {
    providerUnsubscribers.push(mediaProvider.on("ready", ({ duration }) => {
      activeMediaTranscript = buildMockTranscript(duration);
      appEl.querySelector("#mediaTranscriptList").innerHTML = renderMediaTranscript(activeMediaTranscript);
      bindTranscriptCues();
      const awake = stage.classList.contains("is-awake");
      appEl.querySelector("#mediaProviderStatus").textContent = `${sourceLabel()} / ${awake ? "active" : "resting"}`;
      setControlsEnabled(awake);
      updatePlaybackUI();
      logInteraction("media_source_loaded", {
        filename: activeMediaFileName,
        sourceKind: connectedSourceKind,
        provider: mediaProvider.id,
        duration,
        transcriptCueCount: activeMediaTranscript.length
      });
    }));
    providerUnsubscribers.push(mediaProvider.on("time", updatePlaybackUI));
    providerUnsubscribers.push(mediaProvider.on("state", ({ state }) => {
      const playing = state === "playing";
      playButton.innerHTML = playing ? "&#10074;&#10074;" : "&#9654;";
      playButton.setAttribute("aria-label", playing ? "Pause" : "Play");
      if (state === "buffering") appEl.querySelector("#mediaProviderStatus").textContent = `${sourceLabel()} / buffering`;
      else if (stage.classList.contains("is-awake")) appEl.querySelector("#mediaProviderStatus").textContent = `${sourceLabel()} / active`;
    }));
    providerUnsubscribers.push(mediaProvider.on("error", ({ message, code, kind }) => {
      appEl.querySelector("#mediaProviderStatus").textContent = message;
      logInteraction("media_provider_error", {
        provider: mediaProvider.id,
        code: code || "unknown",
        kind: kind || "unknown"
      });
    }));
    providerUnsubscribers.push(mediaProvider.on("surface-interaction", ({ action }) => {
      if (action !== "toggle-playback") return;
      if (!stage.classList.contains("is-awake")) return;
      if (mediaProvider.isPaused()) mediaProvider.play().catch(() => {});
      else mediaProvider.pause();
    }));
  }

  bindMediaProviderEvents();
  playButton.addEventListener("click", () => mediaProvider.isPaused() ? mediaProvider.play().catch(() => {}) : mediaProvider.pause());
  appEl.querySelector("#mediaBackTen").addEventListener("click", () => mediaProvider.seekTo(mediaProvider.currentTime() - 10));
  appEl.querySelector("#mediaForwardTen").addEventListener("click", () => mediaProvider.seekTo(mediaProvider.currentTime() + 10));
  seekInput.addEventListener("input", () => {
    mediaProvider.seekTo(mediaProvider.duration() * (Number(seekInput.value) / 1000));
  });
  volumeInput.addEventListener("input", () => mediaProvider.setVolume(volumeInput.value));
  rateSelect.addEventListener("change", () => mediaProvider.setPlaybackRate(rateSelect.value));
  appEl.querySelector("#mediaFullscreenButton").addEventListener("click", () => mediaProvider.requestFullscreen());
  appEl.querySelector("#mediaFullscreenExit").addEventListener("click", () => document.exitFullscreen?.());
  appEl.querySelector("#restMediaButton").addEventListener("click", restActiveMedia);
}

function renderLibrary() {
  releaseMediaObjectUrl();
  stopSpeechReader({ resetCursor: true, log: false });
  activeBreakdownSelection = null;
  activeBook = null;
  activeAnalysis = null;
  activeSectionText = "";
  activeLensRowIndex = null;
  activeLensAnchored = false;
  activeEmojiSentenceIndex = null;
  activeEmojiLensAnchored = false;
  const bookImporter = hasBookImporter();
  appEl.innerHTML = `
    <section class="library">
      <header class="library-top">
        <p class="eyebrow">The Immersion Project / 0.6 Public Alpha</p>
        <h1>Passato Prossimo</h1>
        <p>Passato Prossimo studyware: choose a section, read first, and open the Word Lens only when the text asks for a closer look.</p>
      </header>
      <div class="library-actions">
        <button class="ghost-button media-shell-launch" id="mediaShellButton" type="button">Open Media Shell</button>
        ${
          bookImporter
            ? `<button class="ghost-button import-button" id="importButton" type="button">Import EPUB/TXT</button>
               <button class="ghost-button" id="refreshShelfButton" type="button">Refresh shelf</button>
               <button class="ghost-button" id="exportTestingReportButton" type="button">Export testing report</button>`
            : `<p class="library-note">Open this prototype in the desktop app to import EPUB or TXT books.</p>`
        }
        <button class="ghost-button" id="sourcesLicensesButton" type="button">Sources &amp; licenses</button>
      </div>
      <form class="url-import" id="urlImportForm">
        <label for="urlImportInput">Read from URL</label>
        <div>
          <input id="urlImportInput" type="url" inputmode="url" placeholder="https://..." required />
          <button class="ghost-button" id="urlImportButton" type="submit">Preview URL</button>
        </div>
      </form>
      <p class="library-message" id="libraryMessage" hidden></p>
      ${pendingUrlPreview ? renderUrlPreview(pendingUrlPreview) : ""}
      <div class="book-grid">
        ${allBooks().map(renderBookCard).join("")}
      </div>
      ${renderSourcesLicensesDialog()}
    </section>
  `;

  appEl.querySelector("#importButton")?.addEventListener("click", importBook);
  appEl.querySelector("#mediaShellButton")?.addEventListener("click", renderMediaShell);
  appEl.querySelector("#refreshShelfButton")?.addEventListener("click", loadCustomBooks);
  appEl.querySelector("#exportTestingReportButton")?.addEventListener("click", exportTestingReport);
  appEl.querySelector("#sourcesLicensesButton")?.addEventListener("click", openSourcesLicensesDialog);
  appEl.querySelector("#closeSourcesLicensesButton")?.addEventListener("click", closeSourcesLicensesDialog);
  appEl.querySelector("#sourcesLicensesDialog")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeSourcesLicensesDialog();
  });
  for (const link of appEl.querySelectorAll("[data-license-url]")) {
    link.addEventListener("click", () => openProjectSource(link.dataset.licenseUrl));
  }
  appEl.querySelector("#urlImportForm")?.addEventListener("submit", previewBookFromUrl);
  appEl.querySelector("#confirmUrlPreview")?.addEventListener("click", confirmUrlPreview);
  appEl.querySelector("#cancelUrlPreview")?.addEventListener("click", cancelUrlPreview);
  for (const card of appEl.querySelectorAll(".book-card")) {
    card.addEventListener("click", () => openBook(card.dataset.bookId));
  }
}

function renderSourcesLicensesDialog() {
  return `
    <dialog class="sources-dialog" id="sourcesLicensesDialog" aria-labelledby="sourcesLicensesTitle">
      <header class="sources-dialog-header">
        <div>
          <span>Public alpha record</span>
          <h2 id="sourcesLicensesTitle">Sources &amp; licenses</h2>
        </div>
        <button class="sources-dialog-close" id="closeSourcesLicensesButton" type="button" aria-label="Close sources and licenses">&times;</button>
      </header>
      <div class="sources-dialog-body">
        <p>Passato Prossimo combines project-created teaching rules with openly licensed language resources. The original projects and contributors listed here do not endorse this app.</p>

        <section>
          <h3>Dictionary layers</h3>
          <p><strong>Kaikki / English Wiktionary / Wiktextract</strong><br />Core entries were selected, ranked, and adapted into a compact local dictionary. CC BY-SA 4.0.</p>
          <div class="sources-dialog-links">
            <button type="button" data-license-url="https://kaikki.org/dictionary/Italian/index.html">Kaikki</button>
            <button type="button" data-license-url="https://en.wiktionary.org/wiki/Wiktionary:Copyrights">Wiktionary terms</button>
          </div>
          <p><strong>mik3ml/italian-dictionary</strong><br />The overflow layer selects and shortens definitions from this Wiktionary-derived dataset. CC BY-SA 4.0.</p>
          <div class="sources-dialog-links">
            <button type="button" data-license-url="https://huggingface.co/datasets/mik3ml/italian-dictionary">Dataset</button>
            <button type="button" data-license-url="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</button>
          </div>
        </section>

        <section>
          <h3>Frequency and learner layers</h3>
          <p><strong>PAISA Italian corpus</strong><br />The compact 25,000-lemma frequency layer adds ranks, counts, and reader-oriented Zipf values. CC BY-NC-SA 3.0; this alpha is noncommercial.</p>
          <div class="sources-dialog-links">
            <button type="button" data-license-url="https://www.corpusitaliano.it/en/contents/description.html">PAISA</button>
            <button type="button" data-license-url="https://creativecommons.org/licenses/by-nc-sa/3.0/">CC BY-NC-SA 3.0</button>
          </div>
          <p><strong>Language-Learning-decks / wordfreq</strong><br />Learner fields were selected and converted into a local lookup layer. Frequency data is CC BY-SA 4.0.</p>
          <div class="sources-dialog-links">
            <button type="button" data-license-url="https://github.com/vbvss199/Language-Learning-decks/blob/main/attributions.md">Dataset attribution</button>
            <button type="button" data-license-url="https://github.com/rspeer/wordfreq">wordfreq</button>
          </div>
          <p><strong>Word_Frequency_Lists_ITA</strong><br />ItWaC-derived lists by franfranz help rank and connect dictionary entries. MIT License.</p>
          <div class="sources-dialog-links">
            <button type="button" data-license-url="https://github.com/franfranz/Word_Frequency_Lists_ITA">Frequency lists</button>
          </div>
        </section>

        <section>
          <h3>Reading samples and software</h3>
          <p>Short public-domain excerpts from Collodi, Manzoni, and Dante are linked to their Project Gutenberg editions. Electron, Cheerio, Yauzl, and their production dependencies retain their respective open-source licenses.</p>
          <div class="sources-dialog-links">
            <button type="button" data-license-url="https://www.gutenberg.org/">Project Gutenberg</button>
            <button type="button" data-license-url="https://www.electronjs.org/">Electron</button>
          </div>
        </section>

        <p class="sources-dialog-footnote">The complete transformed-data notes, citations, package versions, copyright notices, and license texts are included with the application in <strong>THIRD-PARTY-NOTICES.txt</strong>.</p>
      </div>
    </dialog>
  `;
}

function openSourcesLicensesDialog() {
  const dialog = appEl.querySelector("#sourcesLicensesDialog");
  if (!dialog) return;
  logInteraction("sources_licenses_opened");
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closeSourcesLicensesDialog() {
  const dialog = appEl.querySelector("#sourcesLicensesDialog");
  if (!dialog) return;
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

async function openProjectSource(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
    if (url.protocol !== "https:") return;
  } catch {
    return;
  }
  if (window.immersion?.openExternal) {
    await window.immersion.openExternal(url.toString()).catch(() => {});
    return;
  }
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}

async function exportTestingReport() {
  const button = appEl.querySelector("#exportTestingReportButton");
  if (!button || !window.immersion?.exportTestingReport) return;
  button.disabled = true;
  try {
    const result = await window.immersion.exportTestingReport();
    if (result?.ok) {
      showLibraryMessage(`Sanitized report saved / ${result.eventCount} events across ${result.sessionCount} sessions.`);
    } else if (!result?.canceled) {
      showLibraryMessage("The testing report could not be saved.");
    }
  } catch {
    showLibraryMessage("The testing report could not be saved.");
  } finally {
    button.disabled = false;
  }
}

function renderUrlPreview(preview) {
  const confidenceLabels = {
    high: "Clean extraction",
    medium: "Looks usable",
    review: "Needs a quick review"
  };
  const languageLabels = {
    strong: "Strong Italian signal",
    possible: "Possible Italian",
    uncertain: "Language uncertain"
  };
  return `
    <section class="url-preview" aria-labelledby="urlPreviewTitle">
      <header class="url-preview-header">
        <div>
          <span>URL Door preview</span>
          <h2 id="urlPreviewTitle">Inspect before adding</h2>
        </div>
        <strong class="url-preview-confidence is-${escapeHtml(preview.extractionConfidence)}">${escapeHtml(confidenceLabels[preview.extractionConfidence] || confidenceLabels.review)}</strong>
      </header>
      <div class="url-preview-fields">
        <label>
          Title
          <input id="urlPreviewTitleInput" type="text" maxlength="200" value="${escapeHtml(preview.title)}" />
        </label>
        <label>
          Author
          <input id="urlPreviewAuthorInput" type="text" maxlength="160" value="${escapeHtml(preview.author)}" />
        </label>
      </div>
      <dl class="url-preview-facts">
        <div><dt>Source</dt><dd>${escapeHtml(preview.hostname)}</dd></div>
        <div><dt>Language</dt><dd>${escapeHtml(languageLabels[preview.italianSignal] || languageLabels.uncertain)}</dd></div>
        <div><dt>Length</dt><dd>${Number(preview.wordCount || 0).toLocaleString()} words / ${Number(preview.characterCount || 0).toLocaleString()} characters</dd></div>
      </dl>
      <blockquote class="url-preview-excerpt">${escapeHtml(preview.excerpt)}${preview.text.length > preview.excerpt.length ? "…" : ""}</blockquote>
      <details class="url-preview-editor">
        <summary>Edit extracted text</summary>
        <label for="urlPreviewTextInput">Remove navigation, captions, or anything the page extractor should not keep.</label>
        <textarea id="urlPreviewTextInput" spellcheck="false">${escapeHtml(preview.text)}</textarea>
      </details>
      <footer class="url-preview-actions">
        <button class="ghost-button" id="cancelUrlPreview" type="button">Cancel</button>
        <button class="ghost-button url-preview-confirm" id="confirmUrlPreview" type="button">Add to shelf</button>
      </footer>
    </section>
  `;
}

function renderBookCard(book) {
  const sectionCount = sectionsFor(book).length;
  const savedPosition = readingPositionFor(book.id);
  const characterNote = book.characterCount
    ? `${Math.round(book.characterCount / 1000)}k characters`
    : `${sectionCount} section${sectionCount === 1 ? "" : "s"}`;
  return `
    <button class="book-card" type="button" data-book-id="${escapeHtml(book.id)}">
      <span>${escapeHtml(book.source || "Sample")}</span>
      <strong>${escapeHtml(book.title)}</strong>
      <small>${escapeHtml(book.author)}</small>
      <p>${escapeHtml(book.note || "Italian reading sample.")}</p>
      <em>${escapeHtml(characterNote)}</em>
      ${savedPosition ? `<em class="saved-book-place">Continue at section ${savedPosition.sectionIndex + 1}</em>` : ""}
    </button>
  `;
}

async function openBook(bookId) {
  stopSpeechReader({ resetCursor: true, log: false });
  activeBook = allBooks().find((book) => book.id === bookId);
  const savedPosition = readingPositionFor(activeBook?.id);
  const availableSections = sectionsFor(activeBook);
  activeSectionIndex = savedPosition
    ? Math.max(0, Math.min(savedPosition.sectionIndex, availableSections.length - 1))
    : firstReadableSectionIndex(activeBook);
  speechState.sentenceIndex = savedPosition?.sentenceIndex || 0;
  restoreSavedPositionOnRender = Boolean(savedPosition);
  activeLensRowIndex = null;
  activeLensAnchored = false;
  renderLoadingReader("Preparing first section...");
  try {
    await loadActiveSectionText();
    logInteraction("book_opened", { bookId, title: activeBook?.title });
    renderReader();
  } catch (error) {
    renderReaderError(error?.message || "This book section could not be opened.");
  }
}

function firstReadableSectionIndex(book) {
  if (!book?.importedContent) return 0;
  const sections = sectionsFor(book);
  const index = sections.findIndex((section) => {
    const chapter = book.chapterSummaries?.[section.chapterIndex];
    return (chapter?.characterCount || 0) >= 1200;
  });
  return index >= 0 ? index : 0;
}

async function loadActiveSectionText() {
  if (!activeBook) {
    activeSectionText = "";
    return;
  }

  if (!activeBook.importedContent) {
    activeSectionText = sectionsFor(activeBook)[activeSectionIndex] || "";
    return;
  }

  const ref = sectionsFor(activeBook)[activeSectionIndex] || { chapterIndex: 0, sectionIndex: 0 };
  const section = await platform.library.loadSection({
    bookId: activeBook.id,
    chapterIndex: ref.chapterIndex,
    sectionIndex: ref.sectionIndex
  });
  activeSectionText = section.sectionText || "";
}

function renderLoadingReader(message) {
  if (!activeBook) return;
  appEl.innerHTML = `
    <section class="reader loading-reader">
      <header class="reader-bar">
        <button class="ghost-button" id="backButton" type="button">Shelf</button>
        <div>
          <p class="eyebrow">Passato Prossimo / ${escapeHtml(activeBook.author || "Imported book")}</p>
          <h1>${escapeHtml(activeBook.title || "Preparing reader")}</h1>
        </div>
      </header>
      <main class="loading-panel">
        <span>Loading</span>
        <strong>${escapeHtml(message)}</strong>
        <p>The reader is preparing only the visible section so the app can stay responsive.</p>
      </main>
    </section>
  `;
  appEl.querySelector("#backButton")?.addEventListener("click", renderLibrary);
}

function renderReaderError(message) {
  if (!activeBook) return;
  appEl.innerHTML = `
    <section class="reader loading-reader">
      <header class="reader-bar">
        <button class="ghost-button" id="backButton" type="button">Shelf</button>
        <div>
          <p class="eyebrow">Passato Prossimo / ${escapeHtml(activeBook.author || "Imported book")}</p>
          <h1>${escapeHtml(activeBook.title || "Reader")}</h1>
        </div>
      </header>
      <main class="loading-panel error-panel">
        <span>Reader note</span>
        <strong>Could not open this section.</strong>
        <p>${escapeHtml(message)}</p>
      </main>
    </section>
  `;
  appEl.querySelector("#backButton")?.addEventListener("click", renderLibrary);
}

function renderSourceStrip(book) {
  if (!book?.sourceUrl) return "";
  let hostname = "Original source";
  try {
    hostname = new URL(book.sourceUrl).hostname.replace(/^www\./, "");
  } catch {
  }
  let importedLabel = "Saved locally";
  if (book.importedAt) {
    const importedDate = new Date(book.importedAt);
    if (!Number.isNaN(importedDate.getTime())) {
      importedLabel = `Imported ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(importedDate)}`;
    }
  }
  return `
    <section class="source-strip" aria-label="Reading source">
      <div class="source-strip-inner">
        <div class="source-identity">
          <span>Web source</span>
          <strong>${escapeHtml(hostname)}</strong>
        </div>
        <p>${escapeHtml(book.author || "Author not listed")} / ${escapeHtml(importedLabel)}</p>
        <button class="source-open-button" id="openOriginalButton" type="button">Open original <span aria-hidden="true">&#8599;</span></button>
      </div>
    </section>
  `;
}

async function openOriginalSource() {
  if (!activeBook?.sourceUrl) return;
  let url;
  try {
    url = new URL(activeBook.sourceUrl);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported source link.");
  } catch {
    return;
  }
  logInteraction("original_source_opened", { bookId: activeBook.id, sourceUrl: url.toString() });
  if (window.immersion?.openExternal) {
    await window.immersion.openExternal(url.toString()).catch(() => {});
    return;
  }
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}

function renderReader() {
  activeBreakdownSelection = null;
  const sections = sectionsFor(activeBook);
  const sectionText = activeSectionText || "";
  activeAnalysis = analyzeSection(sectionText);
  const mood = coverageMood(activeAnalysis.coverage);
  const percent = Math.round(activeAnalysis.coverage * 100);

  appEl.innerHTML = `
    <section class="reader">
      <header class="reader-bar">
        <button class="ghost-button" id="backButton" type="button">Shelf</button>
        <div>
          <p class="eyebrow">Passato Prossimo / ${escapeHtml(activeBook.author)}</p>
          <h1>${escapeHtml(activeBook.title)}</h1>
        </div>
        <div class="compatibility" title="${escapeHtml(mood.detail)}">
          <span>${mood.label}</span>
          <strong>${percent}%</strong>
        </div>
      </header>

      ${renderSourceStrip(activeBook)}

      <section class="reader-layout">
        <article class="page" style="--reader-scale: ${readerSettings.textScale}; --reader-line-height: ${readerSettings.lineHeight}">
          ${renderSectionText(sectionText, activeAnalysis.rows, activeAnalysis.sentences)}
        </article>

        <aside class="side-rail">
          <section class="quiet-card">
            <span>Compatibility</span>
            <strong>${mood.label}</strong>
            <p>${mood.detail}</p>
          </section>

          <details class="quiet-card friction-card">
            <summary>Potential friction</summary>
            <div class="friction-list">
              ${activeAnalysis.friction.length
                ? activeAnalysis.friction.map(renderFrictionChip).join("")
                : `<p>No obvious friction words in this section.</p>`}
            </div>
          </details>

          <section id="wordLens" class="word-lens is-idle" hidden>
            <div class="lens-sign">
              <span>Passato Prossimo</span>
              <strong>Word Lens</strong>
            </div>
            <p>Select a word in the passage.</p>
            <div class="lens-accent"></div>
          </section>

          <section id="emojiLens" class="emoji-lens is-idle" hidden>
            <div class="lens-sign">
              <span>Passato Prossimo</span>
              <strong>Emoji Lens</strong>
            </div>
            <p>Select a sentence in the passage.</p>
            <div class="lens-accent"></div>
          </section>

          <section id="breakdownPanel" class="breakdown-panel is-idle" hidden>
            <div class="lens-sign">
              <span>Passato Prossimo</span>
              <strong>Breakdown</strong>
            </div>
            <p>Select a word or sentence.</p>
            <div class="lens-accent"></div>
          </section>
        </aside>
      </section>

      <footer class="reader-tools">
        <nav class="page-navigation-controls" aria-label="Page navigation">
          <button class="page-nav-button" id="previousButton" type="button" aria-label="Previous page" title="Previous page" ${activeSectionIndex === 0 ? "disabled" : ""}>&#8592;</button>
          <label class="page-select-label">
            <span>Page</span>
            <select id="pageSelect" aria-label="Choose page">
              ${sections.map((section, index) => `<option value="${index}" ${index === activeSectionIndex ? "selected" : ""}>${index + 1}</option>`).join("")}
            </select>
            <small>of ${sections.length}</small>
          </label>
          <button class="page-nav-button" id="nextButton" type="button" aria-label="Next page" title="Next page" ${activeSectionIndex >= sections.length - 1 ? "disabled" : ""}>&#8594;</button>
        </nav>
        <button class="breakdown-toggle ${breakdownMode ? "is-active" : ""}" id="breakdownToggle" type="button" aria-pressed="${breakdownMode}">Breakdown</button>
        <div class="audio-reader-controls" aria-label="Italian audio reader">
          <button class="audio-icon-button" id="speechToggleButton" type="button" aria-label="Start audio reader" title="Read aloud">&#9654;</button>
          <button class="audio-icon-button" id="speechStopButton" type="button" aria-label="Stop audio reader" title="Stop">&#9632;</button>
          <button class="save-place-button" id="savePlaceButton" type="button" title="Save reading place">Save place</button>
          <label class="speech-voice-label">
            <span>Voice</span>
            <select id="speechVoiceSelect" ${supportsSpeechReader() ? "" : "disabled"}>
              ${renderSpeechVoiceOptions()}
            </select>
          </label>
          <label class="speech-rate-label">
            <span>Speed</span>
            <input id="speechRateInput" type="range" min="0.65" max="1.25" step="0.05" value="${speechSettings.rate}" />
            <output id="speechRateOutput">${speechSettings.rate.toFixed(2)}x</output>
          </label>
          <span class="speech-status" id="speechStatus" aria-live="polite">${speechStatusLabel()}</span>
          <span class="saved-place-status" id="savedPlaceStatus">Place not saved</span>
        </div>
        <div class="reader-display-controls">
          <label>
            <span>Text</span>
            <input id="textScaleInput" type="range" min="0.9" max="1.22" step="0.04" value="${readerSettings.textScale}" />
          </label>
          <label>
            <span>Spacing</span>
            <input id="lineHeightInput" type="range" min="1.65" max="2.25" step="0.05" value="${readerSettings.lineHeight}" />
          </label>
        </div>
      </footer>
    </section>
  `;

  appEl.querySelector("#backButton").addEventListener("click", renderLibrary);
  appEl.querySelector("#openOriginalButton")?.addEventListener("click", openOriginalSource);
  appEl.querySelector("#previousButton").addEventListener("click", () => setSection(activeSectionIndex - 1));
  appEl.querySelector("#nextButton").addEventListener("click", () => setSection(activeSectionIndex + 1));
  appEl.querySelector("#pageSelect").addEventListener("change", (event) => setSection(Number(event.target.value)));
  appEl.querySelector("#breakdownToggle").addEventListener("click", toggleBreakdownMode);
  appEl.querySelector("#textScaleInput").addEventListener("input", updateTextScale);
  appEl.querySelector("#lineHeightInput").addEventListener("input", updateLineHeight);
  appEl.querySelector("#speechToggleButton").addEventListener("click", toggleSpeechReader);
  appEl.querySelector("#speechStopButton").addEventListener("click", () => stopSpeechReader({ resetCursor: false }));
  appEl.querySelector("#speechVoiceSelect").addEventListener("change", updateSpeechVoice);
  appEl.querySelector("#speechRateInput").addEventListener("input", updateSpeechRate);
  appEl.querySelector("#savePlaceButton").addEventListener("click", () => {
    saveActiveReadingPosition(speechState.sentenceIndex, { announce: true, source: "save-button" });
  });
  updateSpeechControls();

  for (const token of appEl.querySelectorAll(".word-token")) {
    token.addEventListener("click", (event) => {
      event.stopPropagation();
      const rowIndex = Number(token.dataset.row);
      const sentenceIndex = activeAnalysis.rows[rowIndex]?.sentenceIndex;
      if (Number.isInteger(sentenceIndex)) {
        selectSpeechSentence(sentenceIndex);
        saveActiveReadingPosition(sentenceIndex, { source: "word-selected" });
      }
      if (breakdownMode) showBreakdown("word", rowIndex, token);
      else showWordLens(rowIndex, token);
    });
  }
  for (const chip of appEl.querySelectorAll(".friction-chip")) {
    chip.addEventListener("click", () => {
      const rowIndex = Number(chip.dataset.row);
      if (breakdownMode) showBreakdown("word", rowIndex);
      else showWordLens(rowIndex);
    });
  }
  for (const sentence of appEl.querySelectorAll(".sentence-span")) {
    sentence.addEventListener("click", () => {
      const sentenceIndex = Number(sentence.dataset.sentence);
      selectSpeechSentence(sentenceIndex);
      saveActiveReadingPosition(sentenceIndex, { source: "sentence-selected" });
      if (breakdownMode) showBreakdown("sentence", sentenceIndex, sentence);
      else showEmojiLens(sentenceIndex, sentence);
    });
    sentence.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      const sentenceIndex = Number(sentence.dataset.sentence);
      selectSpeechSentence(sentenceIndex);
      saveActiveReadingPosition(sentenceIndex, { source: "sentence-selected" });
      if (breakdownMode) showBreakdown("sentence", sentenceIndex, sentence);
      else showEmojiLens(sentenceIndex, sentence);
    });
  }

  restoreActiveReadingPosition();

}

function renderSectionText(text, rows, sentences = []) {
  let html = "";
  let cursor = 0;
  let activeSentence = -1;

  function openSentence(sentenceIndex) {
    if (sentenceIndex === activeSentence || sentenceIndex < 0) return;
    closeSentence();
    activeSentence = sentenceIndex;
    html += `<span class="sentence-span" role="button" tabindex="0" data-sentence="${sentenceIndex}">`;
  }

  function closeSentence() {
    if (activeSentence < 0) return;
    html += "</span>";
    activeSentence = -1;
  }

  rows.forEach((row, index) => {
    openSentence(row.sentenceIndex);
    html += escapeHtml(text.slice(cursor, row.index));
    const className = [
      "word-token",
      row.known ? "" : "is-friction",
      row.contextMarker ? "is-context-marker" : ""
    ].filter(Boolean).join(" ");
    html += `<button class="${className}" type="button" data-row="${index}">${escapeHtml(row.token)}</button>`;
    cursor = row.index + row.token.length;
    const sentence = sentences[row.sentenceIndex];
    const nextRow = rows[index + 1];
    if (sentence && (!nextRow || nextRow.index >= sentence.end)) {
      html += escapeHtml(text.slice(cursor, sentence.end));
      cursor = sentence.end;
      closeSentence();
    }
  });
  closeSentence();
  html += escapeHtml(text.slice(cursor));
  return html.replace(/\n{2,}/g, "<br /><br />").replace(/\n/g, "<br />");
}

function renderFrictionChip(row) {
  const rowIndex = activeAnalysis.rows.findIndex((item) => item.lemma === row.lemma);
  const note = row.likelyProperNoun
    ? `${row.count}x / possible name`
    : row.dictionaryHit
      ? `${row.count}x / lens ready`
      : `${row.count}x / needs source`;
  return `
    <button class="friction-chip" type="button" data-row="${rowIndex}">
      ${escapeHtml(row.lemma)}
      <small>${escapeHtml(note)}</small>
    </button>
  `;
}

function wordEvidenceForBreakdown(row) {
  const frequencyInfo = frequencyInfoFor(row.lemma);
  const learnerInfo = learnerInfoFor(row.token, row.lemma);
  const overflowInfo = overflowInfoFor(row.token, row.lemma);
  const contextInfo = row.contextMarker;
  const accentRule = accentRuleFor(row.token, row.lemma);
  const elisionInfo = row.elisionInfo;
  const entry = row.entry || {
    meaning: learnerInfo?.translation || overflowInfo?.definition || "No definition in the current local stack.",
    example: learnerInfo?.italianExample || "",
    pos: learnerInfo?.pos || overflowInfo?.heading || "unknown"
  };
  const providerNotes = wordLensProviderNotes(row, {
    contextInfo,
    entry,
    frequencyInfo,
    learnerInfo,
    overflowInfo,
    accentRule,
    elisionInfo
  });
  return {
    row,
    entry,
    frequencyInfo,
    learnerInfo,
    overflowInfo,
    contextInfo,
    accentRule,
    elisionInfo,
    providerNotes,
    englishMeaning: learnerInfo?.translation || entry.meaning || overflowInfo?.definition || "Meaning not available yet.",
    italianExplanation: overflowInfo?.definition && overflowInfo.definition !== entry.meaning
      ? overflowInfo.definition
      : `La forma “${row.token}” viene collegata al lemma “${row.lemma}”${entry.pos && entry.pos !== "unknown" ? `, con funzione ${entry.pos}` : ""}.`
  };
}

function rowsForSentence(sentenceIndex) {
  return activeAnalysis?.rows?.filter((row) => row.sentenceIndex === sentenceIndex) || [];
}

function phrasesForSentence(sentenceIndex) {
  const normalizedSentence = rowsForSentence(sentenceIndex)
    .map((row) => normalizeItalian(row.token))
    .filter(Boolean)
    .join(" ");
  if (!normalizedSentence) return [];
  return breakdownPhrases.filter((entry) => entry.normalizedVariants.some((variant) => normalizedSentence.includes(variant)));
}

function prioritizedFrictionForSentence(sentenceIndex) {
  const seen = new Set();
  return rowsForSentence(sentenceIndex)
    .filter((row) => !row.known && !row.likelyProperNoun && row.lemma)
    .filter((row) => {
      const form = normalizeItalian(row.token);
      return row.elisionInfo || !articles.has(form) && !auxiliaries.has(form) && !prepositions.has(form) && !pronouns.has(form);
    })
    .filter((row) => {
      if (seen.has(row.lemma)) return false;
      seen.add(row.lemma);
      return true;
    })
    .sort((a, b) => Number(Boolean(b.contextMarker || b.elisionInfo)) - Number(Boolean(a.contextMarker || a.elisionInfo)) || a.zipf - b.zipf)
    .slice(0, 5);
}

function italianEmotionExplanation(emotion) {
  const explanations = {
    "Disgust / annoyance": "La frase comunica probabilmente disgusto, rifiuto o fastidio.",
    "Surprise / disbelief": "La frase sembra reagire a qualcosa di inatteso o difficile da credere.",
    "Joy / approval": "La frase comunica approvazione, piacere o entusiasmo.",
    "Anger / frustration": "La frase contiene segnali di rabbia, irritazione o frustrazione.",
    "Doubt / hesitation": "La frase segnala dubbio, esitazione o incertezza.",
    "Resignation / acceptance": "La frase suggerisce accettazione o rassegnazione, forse non del tutto felice.",
    "Emphatic / expressive": "La frase è marcata e particolarmente espressiva.",
    "Question / uncertainty": "La frase pone una domanda; l'intenzione precisa può dipendere dal tono."
  };
  return explanations[emotion.label] || "La frase non presenta ancora un segnale emotivo abbastanza forte; il contesto più ampio resta importante.";
}

function renderBreakdownPhrase(phrase) {
  return `
    <div class="breakdown-phrase">
      <strong>${escapeHtml(phrase.phrase)}</strong>
      <p>${escapeHtml(phrase.english)}</p>
      <small>${escapeHtml(phrase.structure)}</small>
    </div>
  `;
}

function renderBreakdownWord(row) {
  const evidence = wordEvidenceForBreakdown(row);
  return `
    <div class="breakdown-word-row">
      <strong>${escapeHtml(row.token)}</strong>
      <span>${escapeHtml(evidence.englishMeaning)}</span>
      <small>${escapeHtml(row.lemma)} / ${escapeHtml(confidenceLabel(row.lemmaMatch.confidence))}</small>
    </div>
  `;
}

function buildTeacherRequest({ scope, row, sentence, sentenceIndex, phrases, emotion, wordEvidence }) {
  return {
    contractVersion: 1,
    targetLanguage: "it",
    supportLanguage: "en",
    scope,
    selection: scope === "word" ? row.token : sentence.text,
    sentence: sentence.text,
    lemma: row?.lemma || "",
    learnerStatus: row ? lemmaStatus(row.lemma) : "sentence",
    localEvidence: {
      meaning: wordEvidence?.englishMeaning || "",
      phrases: phrases.map((phrase) => ({
        phrase: phrase.phrase,
        english: phrase.english,
        italian: phrase.italian,
        structure: phrase.structure
      })),
      tone: {
        label: emotion.label,
        confidence: emotion.confidence,
        explanation: emotion.explanation
      },
      languageClues: (wordEvidence?.providerNotes || []).map((note) => ({
        providerId: note.providerId,
        title: note.title,
        body: note.body
      }))
    }
  };
}

function simulateTeacherResponse(request) {
  const phrase = request.localEvidence.phrases[0];
  const tone = request.localEvidence.tone;
  let english;
  let italian;
  let focus;

  if (phrase) {
    english = `Read “${phrase.phrase}” as one connected expression: ${phrase.english}. Translating each word separately would hide the job the phrase is doing.`;
    italian = `${phrase.italian} Conviene leggere “${phrase.phrase}” come un blocco unico.`;
    focus = phrase.structure;
  } else if (request.scope === "word") {
    const meaning = request.localEvidence.meaning || "the local stack does not have a dependable meaning yet";
    english = `In this sentence, “${request.selection}” is most likely connected to “${request.lemma}”: ${meaning}`;
    italian = `In questa frase, “${request.selection}” viene probabilmente collegato al lemma “${request.lemma}”.`;
    focus = request.localEvidence.languageClues[0]?.body || "Compare this word with the rest of the sentence before treating the gloss as a complete translation.";
  } else if (tone.label !== "Neutral / unclear") {
    english = `The literal wording is only part of the message. The sentence likely carries ${tone.label.toLowerCase()}, which changes how a listener may receive it.`;
    italian = italianEmotionExplanation(tone);
    focus = "Punctuation and wording provide clues, but a speaker’s voice and the wider conversation could change this reading.";
  } else {
    english = "The local clues do not point to one unusually difficult expression. Try reading the sentence as a whole before opening individual words.";
    italian = "Gli indizi locali non mostrano ancora un’espressione particolarmente difficile. Prova prima a leggere la frase come un insieme.";
    focus = "A wider sentence or paragraph may be more useful than another word-by-word explanation here.";
  }

  return {
    contractVersion: 1,
    providerId: simulatedTeacherProvider.id,
    providerLabel: simulatedTeacherProvider.label,
    providerKind: simulatedTeacherProvider.kind,
    english,
    italian,
    focus,
    confidence: phrase ? "medium" : tone.confidence || "exploratory",
    caution: "This is a controlled simulated response for testing the teacher-provider workflow, not an AI-generated judgment.",
    createdAt: new Date().toISOString()
  };
}

function teacherCacheKey(request, providerId = activeTeacherProviderId) {
  return `${providerId}:${stableTextHash(JSON.stringify(request))}`;
}

function cachedTeacherNote(request) {
  return teacherNotes[teacherCacheKey(request)] || null;
}

function cacheTeacherNote(request, note) {
  teacherNotes[teacherCacheKey(request, note.providerId)] = note;
  saveTeacherNotes();
}

async function requestTeacherNote(request) {
  const cached = cachedTeacherNote(request);
  if (cached) return { note: cached, fromCache: true };
  const provider = teacherProviders.get(activeTeacherProviderId);
  if (!provider) throw new Error("No teacher provider is available.");
  const note = await Promise.resolve(provider.explain(request));
  cacheTeacherNote(request, note);
  return { note, fromCache: false };
}

function renderTeacherNote(note, fromCache = false) {
  return `
    <div class="teacher-note">
      <div class="teacher-note-meta">
        <strong>${escapeHtml(note.providerLabel)}</strong>
        <span>${fromCache ? "Local cache" : "New local response"}</span>
      </div>
      <p>${escapeHtml(note.english)}</p>
      <p lang="it" class="teacher-note-italian">${escapeHtml(note.italian)}</p>
      <small>${escapeHtml(note.focus)}</small>
      <small class="teacher-note-caution">${escapeHtml(note.caution)}</small>
    </div>
  `;
}

function showBreakdown(scope, index, anchorEl = null) {
  const panel = appEl.querySelector("#breakdownPanel");
  if (!panel) return;
  const isWord = scope === "word";
  const row = isWord ? activeAnalysis?.rows?.[index] : null;
  const sentenceIndex = isWord ? row?.sentenceIndex : index;
  const sentence = activeAnalysis?.sentences?.[sentenceIndex];
  if (!sentence || (isWord && !row)) return;

  hideWordLens();
  hideEmojiLens();
  activeBreakdownSelection = { scope, index, anchored: Boolean(anchorEl) };
  const phrases = phrasesForSentence(sentenceIndex);
  const frictionRows = prioritizedFrictionForSentence(sentenceIndex);
  const emotion = sentence.emotion;
  const wordEvidence = row ? wordEvidenceForBreakdown(row) : null;
  const leadEnglish = wordEvidence
    ? `${row.token} is grouped under ${row.lemma}. Here it most likely means: ${wordEvidence.englishMeaning}`
    : phrases.length
      ? `${phrases[0].phrase} works as a connected expression: ${phrases[0].english}`
      : emotion.label !== "Neutral / unclear"
        ? `This sentence likely carries ${emotion.label.toLowerCase()}. ${emotion.explanation}`
        : frictionRows.length
          ? `${frictionRows.length} part${frictionRows.length === 1 ? "" : "s"} may be doing most of the work in this sentence.`
          : "This sentence looks locally comfortable; wider passage context may matter more than individual words.";
  const leadItalian = wordEvidence
    ? wordEvidence.italianExplanation
    : phrases.length
      ? phrases.map((phrase) => phrase.italian).join(" ")
      : italianEmotionExplanation(emotion);
  const providerNotes = wordEvidence?.providerNotes || frictionRows.flatMap((frictionRow) => wordEvidenceForBreakdown(frictionRow).providerNotes);
  const uniqueProviderNotes = providerNotes.filter((note, noteIndex, notes) =>
    notes.findIndex((candidate) => candidate.title === note.title && candidate.body === note.body) === noteIndex
  ).slice(0, 8);
  const teacherRequest = buildTeacherRequest({ scope, row, sentence, sentenceIndex, phrases, emotion, wordEvidence });
  const hasSavedTeacherNote = Boolean(cachedTeacherNote(teacherRequest));

  panel.hidden = false;
  panel.classList.remove("is-idle", "is-floating", "is-sheet");
  panel.removeAttribute("style");
  panel.innerHTML = `
    <div class="lens-sign">
      <div>
        <span>Prototype 0.4</span>
        <strong>Breakdown</strong>
      </div>
      <button class="lens-close" type="button" aria-label="Close Breakdown">&times;</button>
    </div>
    <div class="breakdown-selection">
      <p>${isWord ? "Word in context" : "Sentence in context"}</p>
      <h2>${escapeHtml(isWord ? row.token : sentence.text)}</h2>
    </div>
    <section class="breakdown-lead">
      <span>English support</span>
      <p>${escapeHtml(leadEnglish)}</p>
    </section>
    <section class="breakdown-lead is-italian">
      <span>In italiano</span>
      <p lang="it">${escapeHtml(leadItalian)}</p>
    </section>
    <section class="teacher-experiment">
      <div class="teacher-experiment-heading">
        <div>
          <span>Teacher provider experiment</span>
          <strong>Optional second explanation</strong>
        </div>
        <small>Simulated / local</small>
      </div>
      <p>Test whether a teacher-shaped response adds useful context beyond the local layers.</p>
      <button class="teacher-request-button" id="askTeacherButton" type="button">${hasSavedTeacherNote ? "Open saved teacher note" : "Ask Italian teacher"}</button>
      <div id="teacherResponse" aria-live="polite" hidden></div>
    </section>
    ${phrases.length ? `
      <section class="breakdown-section">
        <h3>Connected phrase${phrases.length === 1 ? "" : "s"}</h3>
        ${phrases.map(renderBreakdownPhrase).join("")}
      </section>
    ` : ""}
    ${frictionRows.length ? `
      <details class="breakdown-details" open>
        <summary>Words carrying the load</summary>
        <div class="breakdown-word-list">${frictionRows.map(renderBreakdownWord).join("")}</div>
      </details>
    ` : ""}
    ${uniqueProviderNotes.length ? `
      <details class="breakdown-details">
        <summary>Language clues</summary>
        <dl>${uniqueProviderNotes.map(renderProviderNote).join("")}</dl>
      </details>
    ` : ""}
    <details class="breakdown-details">
      <summary>Tone and confidence</summary>
      <p>${escapeHtml(emotion.emoji)} ${escapeHtml(emotion.label)} / ${escapeHtml(emotion.confidence)} local estimate.</p>
      <p>${escapeHtml(row ? row.lemmaMatch.explanation : "Sentence-level intent remains an estimate based on local wording and punctuation.")}</p>
    </details>
    ${isWord ? `
      <div class="breakdown-actions">
        <button type="button" data-breakdown-status="known">Know</button>
        <button type="button" data-breakdown-status="shaky">Still learning</button>
        <button type="button" data-breakdown-status="unknown">Not yet</button>
      </div>
    ` : ""}
    <div class="lens-accent"></div>
  `;

  panel.querySelector(".lens-close")?.addEventListener("click", hideBreakdown);
  panel.querySelector("#askTeacherButton")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const responseEl = panel.querySelector("#teacherResponse");
    button.disabled = true;
    button.textContent = "Preparing teacher note...";
    try {
      const result = await requestTeacherNote(teacherRequest);
      responseEl.innerHTML = renderTeacherNote(result.note, result.fromCache);
      responseEl.hidden = false;
      button.textContent = result.fromCache ? "Teacher note opened" : "Teacher note added";
      logInteraction("teacher_provider_used", {
        bookId: activeBook.id,
        sectionIndex: activeSectionIndex,
        sentenceIndex,
        scope,
        providerId: result.note.providerId,
        fromCache: result.fromCache,
        sentCharacterCount: teacherRequest.sentence.length
      });
      positionActiveBreakdown();
    } catch (error) {
      responseEl.textContent = error?.message || "The teacher provider could not respond.";
      responseEl.hidden = false;
      button.disabled = false;
      button.textContent = "Try teacher again";
    }
  });
  for (const button of panel.querySelectorAll("[data-breakdown-status]")) {
    button.addEventListener("click", () => {
      lemmaModel[row.lemma] = {
        status: button.dataset.breakdownStatus,
        confidence: button.dataset.breakdownStatus === "known" ? 1 : button.dataset.breakdownStatus === "shaky" ? 0.55 : 0
      };
      saveLemmaModel();
      logInteraction("breakdown_word_marked", {
        bookId: activeBook.id,
        sectionIndex: activeSectionIndex,
        token: row.token,
        lemma: row.lemma,
        status: button.dataset.breakdownStatus
      });
      renderReader();
    });
  }
  if (anchorEl) positionWordLens(panel, anchorEl);
  logInteraction("breakdown_opened", {
    bookId: activeBook.id,
    sectionIndex: activeSectionIndex,
    scope,
    token: row?.token || "",
    sentenceIndex,
    phraseHits: phrases.map((phrase) => phrase.phrase),
    frictionCount: frictionRows.length,
    providerCount: uniqueProviderNotes.length
  });
}

function hideBreakdown() {
  const panel = appEl.querySelector("#breakdownPanel");
  activeBreakdownSelection = null;
  if (!panel) return;
  panel.hidden = true;
  panel.classList.remove("is-floating", "is-sheet");
  panel.removeAttribute("style");
}

function toggleBreakdownMode() {
  breakdownMode = !breakdownMode;
  saveBreakdownMode();
  hideBreakdown();
  hideWordLens();
  hideEmojiLens();
  const button = appEl.querySelector("#breakdownToggle");
  button?.classList.toggle("is-active", breakdownMode);
  button?.setAttribute("aria-pressed", String(breakdownMode));
  logInteraction("breakdown_mode_changed", { enabled: breakdownMode });
}

function showWordLens(rowIndex, anchorEl = null) {
  hideBreakdown();
  const row = activeAnalysis.rows[rowIndex];
  if (!row) return;
  activeLensRowIndex = rowIndex;
  activeLensAnchored = Boolean(anchorEl);
  const frequencyInfo = frequencyInfoFor(row.lemma);
  const learnerInfo = learnerInfoFor(row.token, row.lemma);
  const overflowInfo = overflowInfoFor(row.token, row.lemma);
  const contextInfo = row.contextMarker;
  const accentRule = accentRuleFor(row.token, row.lemma);
  const elisionInfo = row.elisionInfo;
  const entry = row.entry || {
    meaning: learnerInfo?.translation
      || overflowInfo?.definition
      || "No dictionary entry in the current core 5,000.",
    example: learnerInfo?.italianExample || "",
    note: learnerInfo
      ? "This learner layer adds a friendly gloss and example from the local FQ source."
      : frequencyInfo.source === "paisa"
        ? "This word is not enriched yet, but PAISA gives it a corpus frequency signal."
        : "The word can still inform the learner model.",
    pos: learnerInfo?.pos || overflowInfo?.heading || "unknown",
    targetRank: learnerInfo?.frequencyRank || overflowInfo?.frequencyRank || frequencyInfo.rank || "unranked",
    corpusFrequency: overflowInfo?.corpusFrequency || frequencyInfo.corpusFrequency || 0,
    frequencySources: [
      learnerInfo ? "learner-enrichment" : "",
      overflowInfo ? "dictionary-overflow" : "",
      frequencyInfo.source
    ].filter(Boolean)
  };
  const learnerNote = learnerInfo
    ? `${learnerInfo.translation}${learnerInfo.cefr ? ` / ${learnerInfo.cefr}` : ""}${learnerInfo.pos ? ` / ${learnerInfo.pos}` : ""}`
    : "";
  const overflowNote = overflowInfo && (!row.entry || overflowInfo.definition !== entry.meaning)
    ? `${overflowInfo.heading ? `${overflowInfo.heading}: ` : ""}${overflowInfo.definition}`
    : "";
  const providerNotes = wordLensProviderNotes(row, {
    contextInfo,
    entry,
    frequencyInfo,
    learnerInfo,
    overflowInfo,
    accentRule,
    elisionInfo
  });
  const lens = appEl.querySelector("#wordLens");
  const knownState = contextInfo ? "Context marker" : row.known ? "Likely familiar" : "Potential friction";
  const matchState = `${row.lemmaMatch.label} / ${confidenceLabel(row.lemmaMatch.confidence)}`;
  lens.hidden = false;
  lens.classList.remove("is-idle", "is-floating", "is-sheet");
  lens.removeAttribute("style");
  lens.innerHTML = `
    <div class="lens-sign">
      <div>
        <span>Passato Prossimo</span>
        <strong>Word Lens</strong>
      </div>
      <button class="lens-close" type="button" aria-label="Close Word Lens">&times;</button>
    </div>
    <div class="lens-word">
      <p>${knownState}</p>
      <h2>${escapeHtml(row.token)}</h2>
    </div>
    <dl>
      <div><dt>Dictionary form</dt><dd>${escapeHtml(row.lemma)}</dd></div>
      <div><dt>Meaning</dt><dd>${escapeHtml(entry.meaning)}</dd></div>
      ${learnerNote ? `<div><dt>Learner gloss</dt><dd>${escapeHtml(learnerNote)}</dd></div>` : ""}
      ${entry.example ? `<div><dt>Example</dt><dd>${escapeHtml(entry.example)}</dd></div>` : ""}
      ${learnerInfo?.englishExample ? `<div><dt>Example meaning</dt><dd>${escapeHtml(learnerInfo.englishExample)}</dd></div>` : ""}
      ${overflowNote ? `<div><dt>Overflow note</dt><dd>${escapeHtml(overflowNote)}</dd></div>` : ""}
      ${providerNotes.map(renderProviderNote).join("")}
      <div><dt>Reading signal</dt><dd>${knownState}. Zipf ${row.zipf.toFixed(1)}.</dd></div>
      <div><dt>Frequency source</dt><dd>${escapeHtml(frequencyInfo.source)}${frequencyInfo.rank ? ` / rank ${escapeHtml(frequencyInfo.rank)}` : ""}</dd></div>
      <div><dt>Lemma match</dt><dd>${escapeHtml(matchState)}</dd></div>
      <div><dt>Local clue</dt><dd>${escapeHtml(row.lemmaMatch.contextExplanation)}</dd></div>
      ${row.likelyProperNoun ? `<div><dt>Name check</dt><dd>This looks like it may be a name or title, so it should not count like ordinary unknown vocabulary.</dd></div>` : ""}
      ${row.lemmaMatch.ambiguity.isAmbiguous ? `<div><dt>Ambiguity</dt><dd>${escapeHtml(row.lemmaMatch.ambiguity.label)}. ${escapeHtml(row.lemmaMatch.ambiguity.explanation)}</dd></div>` : ""}
      <div><dt>Why grouped?</dt><dd>${escapeHtml(row.lemmaMatch.explanation)} Related forms share one dictionary form so repeated encounters can support the same word family.</dd></div>
    </dl>
    <div class="lens-evidence">
      <span>${escapeHtml(row.lemmaMatch.method)}</span>
      <meter min="0" max="1" value="${row.lemmaMatch.confidence}"></meter>
    </div>
    <div class="lens-actions">
      <button type="button" data-status="known">Know</button>
      <button type="button" data-status="shaky">Still learning</button>
      <button type="button" data-status="unknown">Not yet</button>
    </div>
    <details class="debug-drawer">
      <summary>Debug</summary>
      <p>POS: ${escapeHtml(entry.pos)} / rank: ${escapeHtml(entry.targetRank)} / corpus: ${Math.round(entry.corpusFrequency || 0).toLocaleString()}</p>
      <p>${escapeHtml((entry.frequencySources || []).join(", ") || "No frequency source")}</p>
      <p>Lemma method: ${escapeHtml(row.lemmaMatch.method)} / confidence: ${row.lemmaMatch.confidence.toFixed(2)}</p>
      <p>Base confidence: ${row.lemmaMatch.baseConfidence.toFixed(2)} / local clues: ${escapeHtml(row.lemmaMatch.contextClues.map((clue) => clue.type).join(", ") || "none")}</p>
      <p>Accent note: ${escapeHtml(row.lemmaMatch.accentNote || "none")}</p>
      <p>Ambiguity: ${escapeHtml(row.lemmaMatch.ambiguity.roles.join(" / ") || "none")}</p>
      <p>Frequency layer: ${escapeHtml(frequencyInfo.source)} / rank ${escapeHtml(frequencyInfo.rank)} / count ${Math.round(frequencyInfo.corpusFrequency || 0).toLocaleString()}</p>
      <p>Learner layer: ${escapeHtml(learnerInfo ? `${learnerInfo.word} / ${learnerInfo.cefr || "unleveled"} / rank ${learnerInfo.frequencyRank || "unranked"}` : "no hit")}</p>
      <p>Overflow layer: ${escapeHtml(overflowInfo ? `${overflowInfo.word} / rank ${overflowInfo.frequencyRank || "unranked"}` : "no hit")}</p>
      <p>Context layer: ${escapeHtml(contextInfo ? `${contextInfo.phrase} / ${contextInfo.register} / ${contextInfo.position}` : "no hit")}</p>
      <p>Accent layer: ${escapeHtml(accentRule ? `${accentRule.accented} / ${accentRule.unaccented}` : "no hit")}</p>
      <p>Elision layer: ${escapeHtml(elisionInfo ? `${elisionInfo.prefix} / ${elisionInfo.remainder} / ${elisionInfo.contentLemma}` : "no hit")}</p>
      <p>Providers: ${escapeHtml(providerNotes.map((note) => note.providerId).filter((value, index, all) => all.indexOf(value) === index).join(", ") || "none")}</p>
    </details>
    <div class="lens-accent"></div>
  `;

  lens.querySelector(".lens-close")?.addEventListener("click", hideWordLens);

  for (const button of lens.querySelectorAll(".lens-actions button")) {
    button.addEventListener("click", () => {
      lemmaModel[row.lemma] = {
        status: button.dataset.status,
        confidence: button.dataset.status === "known" ? 1 : button.dataset.status === "shaky" ? 0.55 : 0
      };
      saveLemmaModel();
      activeLensRowIndex = null;
      stopSpeechReader({ resetCursor: false });
      logInteraction("word_lens_marked", {
        bookId: activeBook.id,
        sectionIndex: activeSectionIndex,
        token: row.token,
        lemma: row.lemma,
        status: button.dataset.status
      });
      renderReader();
    });
  }

  if (anchorEl) {
    positionWordLens(lens, anchorEl);
  }

  logInteraction("word_lens_opened", {
    bookId: activeBook.id,
    sectionIndex: activeSectionIndex,
    token: row.token,
    lemma: row.lemma,
    dictionaryHit: row.dictionaryHit,
    lemmaMethod: row.lemmaMatch.method,
    lemmaConfidence: row.lemmaMatch.confidence,
    localClues: row.lemmaMatch.contextClues.map((clue) => clue.type),
    likelyProperNoun: row.likelyProperNoun,
    ambiguity: row.lemmaMatch.ambiguity.label,
    frequencySource: frequencyInfo.source,
    frequencyRank: frequencyInfo.rank,
    learnerHit: Boolean(learnerInfo),
    overflowHit: Boolean(overflowInfo),
    contextHit: Boolean(contextInfo),
    contextPhrase: contextInfo?.phrase || "",
    accentRuleHit: Boolean(accentRule),
    elisionRuleHit: Boolean(elisionInfo),
    providers: providerNotes.map((note) => note.providerId).filter((value, index, all) => all.indexOf(value) === index)
  });
}

function showEmojiLens(sentenceIndex, anchorEl = null) {
  hideBreakdown();
  const sentence = activeAnalysis?.sentences?.[sentenceIndex];
  if (!sentence) return;
  activeEmojiSentenceIndex = sentenceIndex;
  activeEmojiLensAnchored = Boolean(anchorEl);

  const lens = appEl.querySelector("#emojiLens");
  if (!lens) return;

  const emotion = sentence.emotion;
  lens.hidden = false;
  lens.classList.remove("is-idle", "is-floating-left", "is-sheet");
  lens.removeAttribute("style");
  lens.innerHTML = `
    <div class="lens-sign">
      <div>
        <span>Passato Prossimo</span>
        <strong>Emoji Lens</strong>
      </div>
      <button class="lens-close" type="button" aria-label="Close Emoji Lens">&times;</button>
    </div>
    <div class="emoji-face" aria-hidden="true">${emotion.emoji}</div>
    <dl>
      <div><dt>Likely emotional signal</dt><dd>${escapeHtml(emotion.label)}</dd></div>
      <div><dt>Intent reading</dt><dd>${escapeHtml(emotion.explanation)}</dd></div>
      <div><dt>Confidence</dt><dd>${escapeHtml(emotion.confidence)} estimate from local cues.</dd></div>
      <div><dt>Sentence</dt><dd>${escapeHtml(sentence.text)}</dd></div>
      ${emotion.cues.length ? `<div><dt>Cues noticed</dt><dd>${escapeHtml(emotion.cues.join(", "))}</dd></div>` : ""}
    </dl>
    <details class="debug-drawer">
      <summary>Debug</summary>
      <p>Sentence index: ${sentence.index + 1}</p>
      <p>Character span: ${sentence.start}-${sentence.end}</p>
      <p>Emoji Lens is a local estimate, not a literal translation or guaranteed speaker intent.</p>
    </details>
    <div class="lens-accent"></div>
  `;

  lens.querySelector(".lens-close")?.addEventListener("click", hideEmojiLens);
  if (anchorEl) {
    positionEmojiLens(lens, anchorEl);
  }
  logInteraction("emoji_lens_opened", {
    bookId: activeBook.id,
    sectionIndex: activeSectionIndex,
    sentenceIndex,
    label: emotion.label,
    emoji: emotion.emoji,
    confidence: emotion.confidence,
    cues: emotion.cues
  });
}

function hideEmojiLens() {
  const lens = appEl.querySelector("#emojiLens");
  if (!lens) return;
  activeEmojiSentenceIndex = null;
  activeEmojiLensAnchored = false;
  lens.hidden = true;
  lens.classList.remove("is-floating-left", "is-sheet");
  lens.removeAttribute("style");
}

function hideWordLens() {
  const lens = appEl.querySelector("#wordLens");
  if (!lens) return;
  activeLensRowIndex = null;
  activeLensAnchored = false;
  lens.hidden = true;
  lens.classList.remove("is-floating", "is-sheet");
  lens.removeAttribute("style");
}

function positionActiveWordLens() {
  if (activeLensRowIndex === null || !activeLensAnchored) return;
  const lens = appEl.querySelector("#wordLens");
  const anchor = appEl.querySelector(`.word-token[data-row="${activeLensRowIndex}"]`);
  if (!lens || !anchor || lens.hidden) return;
  positionWordLens(lens, anchor);
}

function positionActiveEmojiLens() {
  if (activeEmojiSentenceIndex === null || !activeEmojiLensAnchored) return;
  const lens = appEl.querySelector("#emojiLens");
  const anchor = appEl.querySelector(`.sentence-span[data-sentence="${activeEmojiSentenceIndex}"]`);
  if (!lens || !anchor || lens.hidden) return;
  positionEmojiLens(lens, anchor);
}

function positionActiveBreakdown() {
  if (!activeBreakdownSelection?.anchored) return;
  const panel = appEl.querySelector("#breakdownPanel");
  const anchor = activeBreakdownSelection.scope === "word"
    ? appEl.querySelector(`.word-token[data-row="${activeBreakdownSelection.index}"]`)
    : appEl.querySelector(`.sentence-span[data-sentence="${activeBreakdownSelection.index}"]`);
  if (!panel || !anchor || panel.hidden) return;
  positionWordLens(panel, anchor);
}

function positionWordLens(lens, anchorEl) {
  const viewportWidth = window.innerWidth;
  if (viewportWidth < 760) {
    lens.classList.remove("is-floating");
    lens.classList.add("is-sheet");
    lens.removeAttribute("style");
    return;
  }

  lens.classList.add("is-floating");
  lens.classList.remove("is-sheet");
  const anchorRect = anchorEl.getBoundingClientRect();
  const lensWidth = Math.min(390, viewportWidth - 32);
  lens.style.width = `${lensWidth}px`;
  lens.style.left = "0px";
  lens.style.top = "0px";

  const lensRect = lens.getBoundingClientRect();
  const pageRect = appEl.querySelector(".page")?.getBoundingClientRect();
  const pageRight = pageRect?.right || anchorRect.right;
  const besidePageLeft = pageRight + 14;
  const viewportRightLeft = viewportWidth - lensWidth - 18;
  const left =
    besidePageLeft + lensWidth <= viewportWidth - 16
      ? besidePageLeft
      : Math.max(16, viewportRightLeft);
  const preferredTop = anchorRect.top - 18;
  const maxTop = Math.max(16, window.innerHeight - lensRect.height - 16);
  const top = Math.max(16, Math.min(preferredTop, maxTop));

  lens.style.left = `${left}px`;
  lens.style.top = `${top}px`;
}

function positionEmojiLens(lens, anchorEl) {
  const viewportWidth = window.innerWidth;
  if (viewportWidth < 760) {
    lens.classList.remove("is-floating-left");
    lens.classList.add("is-sheet");
    lens.removeAttribute("style");
    return;
  }

  lens.classList.add("is-floating-left");
  lens.classList.remove("is-sheet");
  const anchorRect = anchorEl.getBoundingClientRect();
  const lensWidth = Math.min(360, viewportWidth - 32);
  lens.style.width = `${lensWidth}px`;
  lens.style.left = "0px";
  lens.style.top = "0px";

  const lensRect = lens.getBoundingClientRect();
  const pageRect = appEl.querySelector(".page")?.getBoundingClientRect();
  const pageLeft = pageRect?.left || anchorRect.left;
  const besidePageLeft = pageLeft - lensWidth - 14;
  const fallbackLeft = 18;
  const left = besidePageLeft >= 16 ? besidePageLeft : fallbackLeft;
  const preferredTop = anchorRect.top - 18;
  const maxTop = Math.max(16, window.innerHeight - lensRect.height - 16);
  const top = Math.max(16, Math.min(preferredTop, maxTop));

  lens.style.left = `${left}px`;
  lens.style.top = `${top}px`;
}

async function setSection(index) {
  const sections = sectionsFor(activeBook);
  stopSpeechReader({ resetCursor: true });
  restoreSavedPositionOnRender = false;
  activeBreakdownSelection = null;
  activeSectionIndex = Math.max(0, Math.min(index, sections.length - 1));
  activeLensRowIndex = null;
  activeLensAnchored = false;
  activeEmojiSentenceIndex = null;
  activeEmojiLensAnchored = false;
  renderLoadingReader("Opening section...");
  try {
    await loadActiveSectionText();
    logInteraction("section_opened", {
      bookId: activeBook.id,
      sectionIndex: activeSectionIndex,
      sectionCount: sections.length
    });
    renderReader();
  } catch (error) {
    renderReaderError(error?.message || "This section could not be opened.");
  }
}

async function importBook() {
  if (!hasBookImporter()) return;
  showLibraryMessage("Opening book picker...");
  try {
    const result = await platform.library.importBook();
    if (!result) {
      showLibraryMessage("Import canceled.");
      return;
    }
    if (!result.ok) {
      showLibraryMessage(result.error || "That book could not be imported.");
      return;
    }

    customBooks = [result.book, ...customBooks.filter((book) => book.id !== result.book.id)];
    renderLibrary();
    showLibraryMessage(`Imported "${result.book.title}".`);
  } catch (error) {
    showLibraryMessage(error?.message || "That book could not be imported.");
  }
}

async function previewBookFromUrl(event) {
  event?.preventDefault();
  const input = appEl.querySelector("#urlImportInput");
  const button = appEl.querySelector("#urlImportButton");
  const rawUrl = input?.value?.trim() || "";
  if (!rawUrl) return;

  button.disabled = true;
  button.textContent = "Preparing...";
  showLibraryMessage("Opening the page and preparing a clean reading preview...");
  try {
    const result = hasNativeUrlPreview()
      ? await window.immersion.previewBookFromUrl(rawUrl)
      : await previewBrowserUrl(rawUrl);
    if (!result?.ok) {
      showLibraryMessage(result?.error || "That page could not be previewed.");
      return;
    }

    pendingUrlPreview = result.preview;
    renderLibrary();
    showLibraryMessage("Preview ready. Check the extraction before adding it to your shelf.");
    appEl.querySelector("#urlPreviewTitle")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    const corsNote = error instanceof TypeError
      ? "This website blocked direct browser access. Try the same URL in the desktop app."
      : error?.message;
    showLibraryMessage(corsNote || "That page could not be previewed.");
  } finally {
    const currentButton = appEl.querySelector("#urlImportButton");
    if (currentButton) {
      currentButton.disabled = false;
      currentButton.textContent = "Preview URL";
    }
  }
}

async function confirmUrlPreview() {
  if (!pendingUrlPreview) return;
  const button = appEl.querySelector("#confirmUrlPreview");
  const title = appEl.querySelector("#urlPreviewTitleInput")?.value?.trim() || "";
  const author = appEl.querySelector("#urlPreviewAuthorInput")?.value?.trim() || "";
  const text = appEl.querySelector("#urlPreviewTextInput")?.value?.trim() || "";
  if (!title) {
    showLibraryMessage("Add a title before saving this page.");
    return;
  }
  if (text.length < 100) {
    showLibraryMessage("Keep at least 100 readable characters before saving.");
    return;
  }

  button.disabled = true;
  button.textContent = "Adding...";
  showLibraryMessage("Adding the reviewed page to your shelf...");
  try {
    const result = hasNativeUrlPreview()
      ? await window.immersion.saveUrlPreview({ token: pendingUrlPreview.token, title, author, text })
      : { ok: true, book: createBrowserBookFromPreview(pendingUrlPreview, { title, author, text }) };
    if (!result?.ok) {
      showLibraryMessage(result?.error || "That preview could not be saved.");
      return;
    }

    customBooks = [result.book, ...customBooks.filter((book) => book.id !== result.book.id && book.sourceUrl !== result.book.sourceUrl)];
    if (!hasNativeUrlPreview()) saveBrowserUrlBooks(customBooks);
    const savedTitle = result.book.title;
    const savedHost = new URL(result.book.sourceUrl).hostname;
    pendingUrlPreview = null;
    renderLibrary();
    showLibraryMessage(`Added "${savedTitle}" from ${savedHost}.`);
  } catch (error) {
    showLibraryMessage(error?.message || "That preview could not be saved.");
    const currentButton = appEl.querySelector("#confirmUrlPreview");
    if (currentButton) {
      currentButton.disabled = false;
      currentButton.textContent = "Add to shelf";
    }
  }
}

function cancelUrlPreview() {
  pendingUrlPreview = null;
  renderLibrary();
  showLibraryMessage("URL preview discarded. Nothing was added to the shelf.");
}

async function previewBrowserUrl(rawUrl) {
  const url = validateBrowserImportUrl(rawUrl);
  const response = await fetch(url.toString(), {
    headers: { Accept: "text/html,application/xhtml+xml,text/plain;q=0.8" }
  });
  if (!response.ok) throw new Error(`The website returned HTTP ${response.status}.`);
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml") && !contentType.includes("text/plain")) {
    throw new Error("This URL did not return a readable HTML or text page.");
  }

  const source = await readBrowserResponseText(response, 2 * 1024 * 1024);
  const finalUrl = validateBrowserImportUrl(response.url || url.toString());
  const extracted = contentType.includes("text/plain")
    ? extractBrowserPlainText(source, finalUrl)
    : extractBrowserReadablePage(source, finalUrl);
  if (extracted.text.length > 350000) {
    throw new Error("This page is too large for browser-only storage. Import it through the desktop app.");
  }

  const id = `browser-url-${stableTextHash(finalUrl.toString())}`;
  return {
    ok: true,
    preview: {
      token: id,
      title: extracted.title,
      author: extracted.author,
      sourceUrl: finalUrl.toString(),
      hostname: finalUrl.hostname,
      italianSignal: extracted.italianSignal,
      extractionConfidence: browserExtractionConfidenceFor(extracted.text, extracted.italianSignal),
      characterCount: extracted.text.length,
      wordCount: countBrowserWords(extracted.text),
      excerpt: extracted.text.slice(0, 900).trim(),
      text: extracted.text
    }
  };
}

function createBrowserBookFromPreview(preview, edits) {
  const text = String(edits.text || "").replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length > 350000) throw new Error("This page is too large for browser-only storage. Import it through the desktop app.");
  const finalUrl = validateBrowserImportUrl(preview.sourceUrl);
  const italianSignal = estimateBrowserItalianSignal(text);
  return {
    id: `browser-url-${stableTextHash(finalUrl.toString())}`,
    title: edits.title,
    author: edits.author || finalUrl.hostname,
    source: `Imported URL / ${finalUrl.hostname}`,
    language: "Italian",
    rights: "External page imported locally by the user; rights remain with the source.",
    sourceUrl: finalUrl.toString(),
    importedAt: new Date().toISOString(),
    note: `${Math.max(1, Math.round(text.length / 1000))}k characters / Italian signal: ${italianSignal}.`,
    characterCount: text.length,
    text
  };
}

function validateBrowserImportUrl(rawUrl) {
  let url;
  try {
    url = new URL(String(rawUrl || "").trim());
  } catch {
    throw new Error("Enter a complete public http or https URL.");
  }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only public http and https URLs can be imported.");
  const hostname = url.hostname.toLowerCase();
  const privateIpv4 = /^(0\.|10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(hostname);
  const privateIpv6 = /^\[?(::|::1|f[cd][0-9a-f:]*|fe[89ab][0-9a-f:]*)\]?$/i.test(hostname);
  if (url.username || url.password || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || privateIpv4 || privateIpv6) {
    throw new Error("Local and private-network addresses cannot be imported.");
  }
  url.hash = "";
  return url;
}

async function readBrowserResponseText(response, limit) {
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > limit) throw new Error("This page is too large for browser-only import.");
  if (!response.body?.getReader) {
    const text = await response.text();
    if (text.length > limit) throw new Error("This page is too large for browser-only import.");
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = "";
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new Error("This page is too large for browser-only import.");
    }
    result += decoder.decode(value, { stream: true });
  }
  return result + decoder.decode();
}

function extractBrowserReadablePage(html, sourceUrl) {
  const documentNode = new DOMParser().parseFromString(html, "text/html");
  documentNode.querySelectorAll("script, style, noscript, nav, footer, header, aside, form, dialog, svg, canvas, iframe, template")
    .forEach((element) => element.remove());
  const title = cleanBrowserWebLine(
    documentNode.querySelector('meta[property="og:title"]')?.content ||
    documentNode.querySelector('meta[name="twitter:title"]')?.content ||
    documentNode.querySelector("h1")?.textContent ||
    documentNode.title ||
    sourceUrl.hostname
  );
  const author = cleanBrowserWebLine(
    documentNode.querySelector('meta[name="author"]')?.content ||
    documentNode.querySelector('meta[property="article:author"]')?.content ||
    documentNode.querySelector('[rel="author"]')?.textContent ||
    sourceUrl.hostname
  );
  const selectors = ["article", "main", '[role="main"]', ".article-body", ".article-content", ".post-content", ".entry-content", ".story-body", "body"];
  let best = null;
  for (const selector of selectors) {
    for (const candidate of documentNode.querySelectorAll(selector)) {
      const textLength = cleanBrowserWebLine(candidate.textContent).length;
      const paragraphCount = candidate.querySelectorAll("p").length;
      const linkLength = cleanBrowserWebLine([...candidate.querySelectorAll("a")].map((link) => link.textContent).join(" ")).length;
      const score = textLength + paragraphCount * 140 - Math.min(linkLength, textLength) * 0.45;
      if (!best || score > best.score) best = { candidate, score };
    }
    if (best && best.score > 1800 && selector !== "body") break;
  }
  if (!best) throw new Error("The page opened, but no readable text container was found.");

  const blocks = [];
  for (const element of best.candidate.querySelectorAll("h1, h2, h3, p, blockquote, li, pre")) {
    const line = cleanBrowserWebLine(element.textContent);
    if (line.length >= 2 && line !== blocks[blocks.length - 1]) blocks.push(line);
  }
  let text = blocks.join("\n\n").trim();
  if (text.length < 300) text = cleanBrowserWebLine(best.candidate.textContent);
  if (text.length < 300) throw new Error("The page opened, but it did not expose enough readable text.");
  return { title, author, text, italianSignal: estimateBrowserItalianSignal(text) };
}

function extractBrowserPlainText(value, sourceUrl) {
  const text = String(value || "").replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length < 100) throw new Error("The text page is too short to import.");
  return {
    title: cleanBrowserWebLine(text.split("\n").find(Boolean) || sourceUrl.hostname).slice(0, 120),
    author: sourceUrl.hostname,
    text,
    italianSignal: estimateBrowserItalianSignal(text)
  };
}

function cleanBrowserWebLine(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function estimateBrowserItalianSignal(text) {
  const tokens = String(text || "").toLowerCase().slice(0, 50000).match(/[a-zàèéìòù]+/g) || [];
  if (!tokens.length) return "uncertain";
  const markers = new Set(["il", "lo", "la", "gli", "le", "di", "del", "della", "che", "non", "per", "con", "una", "sono", "come", "anche", "questo", "questa"]);
  const hits = tokens.reduce((total, token) => total + Number(markers.has(token)), 0);
  const ratio = hits / Math.min(tokens.length, 3000);
  return ratio >= 0.055 ? "strong" : ratio >= 0.025 ? "possible" : "uncertain";
}

function countBrowserWords(text) {
  return (String(text || "").match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)?/gu) || []).length;
}

function browserExtractionConfidenceFor(text, italianSignal) {
  if (italianSignal === "strong" && text.length >= 1000) return "high";
  if ((italianSignal === "strong" || italianSignal === "possible") && text.length >= 500) return "medium";
  return "review";
}

function stableTextHash(value) {
  let hash = 2166136261;
  for (const character of String(value || "")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function saveBrowserUrlBooks(books) {
  try {
    localStorage.setItem("prototype03BrowserUrlBooks", JSON.stringify(books.slice(0, 12)));
  } catch {
    throw new Error("Browser storage is full. Use the desktop app for larger page imports.");
  }
}

function showLibraryMessage(message) {
  const el = appEl.querySelector("#libraryMessage");
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
}

async function loadCustomBooks() {
  try {
    customBooks = await platform.library.loadBooks();
  } catch {
    customBooks = [];
  }
  renderLibrary();
}

function updateTextScale(event) {
  readerSettings.textScale = Number(event.target.value);
  saveReaderSettings();
  appEl.querySelector(".page")?.style.setProperty("--reader-scale", readerSettings.textScale);
}

function updateLineHeight(event) {
  readerSettings.lineHeight = Number(event.target.value);
  saveReaderSettings();
  appEl.querySelector(".page")?.style.setProperty("--reader-line-height", readerSettings.lineHeight);
}

function positionActiveLenses() {
  positionActiveWordLens();
  positionActiveEmojiLens();
  positionActiveBreakdown();
}

window.addEventListener("resize", positionActiveLenses);
window.addEventListener("scroll", positionActiveLenses, { passive: true });

initializeSpeechReader();
loadCustomBooks();
