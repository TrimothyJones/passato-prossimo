const fs = require("fs");
const path = require("path");
const readline = require("readline");
const zlib = require("zlib");

const projectDir = path.resolve(__dirname, "..");
const dataDir = path.join(projectDir, "data");
const defaultInput = path.join(dataDir, "kaikki-italian.jsonl.gz");
const fallbackInput = path.join(dataDir, "kaikki-italian.jsonl");
const outputPath = path.join(projectDir, "core-dictionary.js");
const lexiconPath = path.join(projectDir, "lexicon.js");
const maxEntries = Number(process.argv[3] || process.env.CORE_DICTIONARY_LIMIT || 5000);
const inputPath = path.resolve(process.argv[2] || detectInputPath());
const itwacFrequencyFiles = [
  "itwac_nouns_lemmas_notail_2_0_0.csv",
  "itwac_verbs_lemmas_notail_2_1_0.csv",
  "itwac_adj_lemmas_notail_2_1_0.csv"
];
const itwacVerbLemmaFile = "itwac_verbs_list_of_lemmas_2_1_0.csv";

const allowedPos = new Set([
  "adj",
  "adv",
  "article",
  "conj",
  "det",
  "intj",
  "noun",
  "num",
  "prep",
  "pron",
  "verb"
]);

const posLabels = {
  adj: "adjective",
  adv: "adverb",
  article: "article",
  conj: "conjunction",
  det: "determiner",
  intj: "interjection",
  noun: "noun",
  num: "number",
  prep: "preposition",
  pron: "pronoun",
  verb: "verb"
};

function detectInputPath() {
  if (fs.existsSync(defaultInput)) return defaultInput;
  if (fs.existsSync(fallbackInput)) return fallbackInput;
  if (!fs.existsSync(dataDir)) return fallbackInput;

  const detected = fs.readdirSync(dataDir)
    .filter((fileName) => /^kaikki.*italian.*\.jsonl(\.gz)?$/i.test(fileName))
    .sort((a, b) => a.localeCompare(b))[0];

  return detected ? path.join(dataDir, detected) : fallbackInput;
}

const interestTags = {
  daily: ["acqua", "casa", "cosa", "giorno", "mano", "notte", "occhio", "strada", "tempo"],
  travel: ["andare", "biglietto", "citta", "dove", "paese", "prendere", "treno", "venire", "viaggio"],
  food: ["acqua", "cibo", "mangiare", "buono"],
  family: ["amico", "bambino", "famiglia", "figlio", "madre", "padre"],
  literature: ["libro", "memoria", "parola", "storia", "vita", "voce"],
  media: ["film", "guardare", "musica", "sentire", "vedere", "voce"],
  feelings: ["amare", "cuore", "paura", "sentire"],
  ideas: ["credere", "modo", "pensare", "ragione", "sapere"],
  work: ["lavoro", "dovere", "fare", "potere"],
  school: ["lingua", "libro", "parola", "scuola", "sapere"]
};

const learnerPriorityLemmas = new Set([
  "abitare", "acqua", "adesso", "aiutare", "albergo", "amare", "amico", "andare", "anno",
  "aprire", "arrivare", "ascoltare", "aspettare", "avere", "bambino", "bello", "bene",
  "bere", "bisogno", "buono", "capire", "casa", "chiamare", "chiedere", "cibo", "citta",
  "comprare", "conoscere", "cosa", "credere", "cuore", "dare", "dentro", "dire", "domani",
  "donna", "dovere", "dove", "entrare", "essere", "famiglia", "fare", "figlio", "film",
  "finire", "forse", "giorno", "grande", "guardare", "ieri", "imparare", "italiano",
  "lavorare", "lavoro", "leggere", "libro", "lingua", "mangiare", "mano", "meglio",
  "meno", "mettere", "modo", "molto", "mondo", "musica", "notte", "nuovo", "occhio",
  "oggi", "ora", "padre", "paese", "parlare", "parola", "parte", "passare", "pensare",
  "persona", "piacere", "piano", "piccolo", "poco", "potere", "prendere", "prima",
  "problema", "ragione", "sapere", "scuola", "scrivere", "sentire", "sera", "stare",
  "storia", "strada", "tempo", "tornare", "trovare", "uomo", "vedere", "venire", "vita",
  "vivere", "voce", "volere"
]);

const learnerPosPriority = {
  verb: 0,
  noun: 1,
  adverb: 2,
  adjective: 3,
  pronoun: 4,
  determiner: 5,
  preposition: 6,
  conjunction: 7,
  article: 8,
  interjection: 9,
  number: 10
};

const preferredGlossHints = {
  essere: ["to be", "be"],
  avere: ["to have", "have"],
  fare: ["to do", "to make"],
  potere: ["can", "be able"],
  volere: ["want"],
  dovere: ["must", "have to"],
  piano: ["floor", "storey", "plan", "slowly"],
  voce: ["voice", "word", "term", "entry"],
  bene: ["well", "good"],
  bello: ["beautiful", "nice"],
  buono: ["good"],
  casa: ["house", "home"],
  cosa: ["thing", "what"],
  paese: ["country", "town"],
  tempo: ["time", "weather"]
};

const preferredPosByLemma = {
  amare: "verb",
  andare: "verb",
  aprire: "verb",
  ascoltare: "verb",
  avere: "verb",
  bere: "verb",
  capire: "verb",
  chiamare: "verb",
  chiedere: "verb",
  comprare: "verb",
  conoscere: "verb",
  credere: "verb",
  dare: "verb",
  dire: "verb",
  dovere: "verb",
  essere: "verb",
  fare: "verb",
  finire: "verb",
  guardare: "verb",
  imparare: "verb",
  lavorare: "verb",
  leggere: "verb",
  mangiare: "verb",
  mettere: "verb",
  parlare: "verb",
  passare: "verb",
  pensare: "verb",
  piacere: "verb",
  potere: "verb",
  prendere: "verb",
  sapere: "verb",
  scrivere: "verb",
  sentire: "verb",
  stare: "verb",
  tornare: "verb",
  trovare: "verb",
  vedere: "verb",
  venire: "verb",
  vivere: "verb",
  volere: "verb",
  acqua: "noun",
  amico: "noun",
  anno: "noun",
  bambino: "noun",
  casa: "noun",
  cibo: "noun",
  citta: "noun",
  cosa: "noun",
  cuore: "noun",
  donna: "noun",
  famiglia: "noun",
  figlio: "noun",
  film: "noun",
  giorno: "noun",
  lavoro: "noun",
  libro: "noun",
  lingua: "noun",
  mano: "noun",
  mondo: "noun",
  musica: "noun",
  notte: "noun",
  occhio: "noun",
  padre: "noun",
  paese: "noun",
  parola: "noun",
  parte: "noun",
  persona: "noun",
  piano: "noun",
  problema: "noun",
  ragione: "noun",
  scuola: "noun",
  sera: "noun",
  storia: "noun",
  strada: "noun",
  tempo: "noun",
  uomo: "noun",
  vita: "noun",
  voce: "noun",
  bello: "adjective",
  buono: "adjective",
  grande: "adjective",
  nuovo: "adjective",
  piccolo: "adjective",
  bene: "adverb",
  dove: "adverb",
  molto: "adverb",
  poco: "adverb"
};

function normalizeItalian(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z'\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function numberFromCsv(value) {
  const parsed = Number(String(value || "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function loadFrequencyRanks() {
  const source = fs.readFileSync(lexiconPath, "utf8");
  const match = source.match(/window\.ITALIAN_FREQUENCY_LEMMAS\s*=\s*(\[[\s\S]*?\]);/);
  const seedEntries = match ? Function(`return ${match[1]}`)() : [];
  const frequencyRanks = loadItwacFrequencyRanks();

  for (const [lemma, zipf] of seedEntries) {
    const normalizedLemma = normalizeItalian(lemma);
    const existing = frequencyRanks.get(normalizedLemma);
    if (existing) {
      existing.zipf = Math.max(existing.zipf || 0, zipf);
      existing.seedRank = existing.seedRank || seedEntries.findIndex(([item]) => item === lemma) + 1;
      existing.sources = [...new Set([...existing.sources, "prototype-seed"])];
    } else {
      frequencyRanks.set(normalizedLemma, {
        zipf,
        rank: 100000,
        seedRank: seedEntries.findIndex(([item]) => item === lemma) + 1,
        corpusFrequency: 0,
        sources: ["prototype-seed"]
      });
    }
  }

  return rerankFrequencyMap(frequencyRanks);
}

function loadItwacFrequencyRanks() {
  const entries = new Map();

  for (const fileName of itwacFrequencyFiles) {
    const filePath = path.join(dataDir, fileName);
    if (!fs.existsSync(filePath)) continue;
    loadItwacFrequencyFile(filePath, entries);
  }

  const verbLemmaPath = path.join(dataDir, itwacVerbLemmaFile);
  if (fs.existsSync(verbLemmaPath)) {
    loadItwacVerbLemmaHints(verbLemmaPath, entries);
  }

  return entries;
}

function loadItwacFrequencyFile(filePath, entries) {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift() || "");
  const lemmaIndex = headers.findIndex((header) => header.toLowerCase() === "lemma");
  const frequencyIndex = headers.findIndex((header) => header.toLowerCase() === "freq");
  const zipfIndex = headers.findIndex((header) => header.toLowerCase() === "zipf");
  const posIndex = headers.findIndex((header) => header.toLowerCase() === "pos");
  const source = path.basename(filePath);

  for (const line of lines) {
    const row = parseCsvLine(line);
    const lemma = normalizeItalian(row[lemmaIndex]);
    if (!lemma || lemma.includes(" ") || lemma.includes("-")) continue;

    const existing = entries.get(lemma) || {
      lemma,
      corpusFrequency: 0,
      zipf: 0,
      posHints: new Set(),
      sources: []
    };
    existing.corpusFrequency += numberFromCsv(row[frequencyIndex]);
    existing.zipf = Math.max(existing.zipf, numberFromCsv(row[zipfIndex]));
    if (posIndex >= 0 && row[posIndex]) existing.posHints.add(row[posIndex]);
    existing.sources.push(source);
    entries.set(lemma, existing);
  }
}

function loadItwacVerbLemmaHints(filePath, entries) {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift() || "");
  const lemmaIndex = headers.findIndex((header) => header.toLowerCase() === "lemma");
  const frequencyIndex = headers.findIndex((header) => header.toLowerCase() === "freq");
  const source = path.basename(filePath);

  for (const line of lines) {
    const row = parseCsvLine(line);
    const lemma = normalizeItalian(row[lemmaIndex]);
    if (!lemma || lemma.includes(" ") || lemma.includes("-")) continue;

    const existing = entries.get(lemma) || {
      lemma,
      corpusFrequency: 0,
      zipf: 0,
      posHints: new Set(),
      sources: []
    };
    existing.verbLemmaHint = Math.max(existing.verbLemmaHint || 0, numberFromCsv(row[frequencyIndex]));
    existing.posHints.add("VER");
    existing.sources.push(source);
    entries.set(lemma, existing);
  }
}

function rerankFrequencyMap(frequencyRanks) {
  const ranked = [...frequencyRanks.values()]
    .sort((a, b) =>
      (b.corpusFrequency || 0) - (a.corpusFrequency || 0) ||
      (b.zipf || 0) - (a.zipf || 0) ||
      (a.seedRank || 999999) - (b.seedRank || 999999) ||
      a.lemma.localeCompare(b.lemma)
    );

  return new Map(ranked.map((entry, index) => [
    entry.lemma,
    {
      ...entry,
      rank: index + 1,
      sources: [...new Set(entry.sources || [])],
      posHints: [...(entry.posHints || [])]
    }
  ]));
}

function tagsFor(lemma) {
  return Object.entries(interestTags)
    .filter(([_tag, lemmas]) => lemmas.includes(lemma))
    .map(([tag]) => tag);
}

function streamInput(filePath) {
  if (filePath.endsWith(".gz")) {
    return fs.createReadStream(filePath).pipe(zlib.createGunzip());
  }
  return fs.createReadStream(filePath);
}

function cleanGloss(gloss) {
  return String(gloss || "")
    .replace(/\s+/g, " ")
    .replace(/^Used to /i, "used to ")
    .trim();
}

function hasBlockedTags(sense) {
  const tags = new Set(Array.isArray(sense?.tags) ? sense.tags : []);
  return [
    "abbreviation",
    "archaic",
    "form-of",
    "literary",
    "obsolete",
    "rare",
    "relational",
    "uncommon"
  ].some((tag) => tags.has(tag));
}

function senseScore(lemma, sense) {
  if (!Array.isArray(sense.glosses) || sense.glosses.length === 0 || hasBlockedTags(sense)) return -Infinity;
  const gloss = cleanGloss(sense.glosses[0]).toLowerCase();
  const hints = preferredGlossHints[lemma] || [];
  let score = 0;
  const hintIndex = hints.findIndex((hint) => gloss.includes(hint));
  if (hintIndex >= 0) score += 1200 - hintIndex * 120;
  if (sense.topics?.length) score += 260;
  if (sense.examples?.length) score += 180;
  if (gloss.includes(",") || gloss.includes("/")) score += 90;
  if (gloss.length <= 90) score += 70;
  if (gloss.length > 160) score -= 250;
  if (/plane|relational|letter name/i.test(gloss)) score -= 180;
  return score;
}

function chooseSense(entry, lemma) {
  const senses = Array.isArray(entry.senses) ? entry.senses : [];
  return senses
    .map((sense) => ({ sense, score: senseScore(lemma, sense) }))
    .filter((candidate) => Number.isFinite(candidate.score))
    .sort((a, b) => b.score - a.score)[0]?.sense || null;
}

function chooseExample(sense) {
  const examples = Array.isArray(sense?.examples) ? sense.examples : [];
  const example = examples.find((item) => typeof item.text === "string" && item.text.length <= 180);
  return example?.text || "";
}

function entryFromKaikki(rawEntry, frequencyRanks) {
  const lemma = normalizeItalian(rawEntry.word);
  if (!lemma || lemma.includes(" ") || lemma.includes("-")) return null;
  if (!allowedPos.has(rawEntry.pos)) return null;

  const sense = chooseSense(rawEntry, lemma);
  if (!sense) return null;

  const meaning = cleanGloss(sense.glosses[0]);
  if (!meaning) return null;

  const frequency = frequencyRanks.get(lemma);
  const pos = posLabels[rawEntry.pos] || rawEntry.pos;
  const priority = learnerPriorityLemmas.has(lemma);
  const chosenSenseScore = senseScore(lemma, sense);
  const example = chooseExample(sense);
  const qualityScore = scoreEntry({
    lemma,
    meaning,
    pos,
    sense,
    frequency,
    priority,
    example,
    senseScore: chosenSenseScore
  });

  return {
    lemma,
    meaning,
    example,
    note: `Imported from the Italian Wiktionary-derived Kaikki dataset. Part of speech: ${pos}.`,
    tags: [...new Set([...(Array.isArray(sense.topics) ? sense.topics.slice(0, 3) : []), ...tagsFor(lemma)])],
    level: "core-import",
    targetRank: frequency?.rank || 999999,
    corpusFrequency: frequency?.corpusFrequency || 0,
    priority,
    senseScore: chosenSenseScore,
    qualityScore,
    source: "kaikki-wiktionary",
    frequencySources: frequency?.sources || [],
    sourceLicense: "Wikimedia text license, generally CC BY-SA/GFDL; verify before release.",
    pos,
    zipf: frequency?.zipf || 0
  };
}

function scoreEntry(entry) {
  let score = 0;
  if (entry.frequency) score += 160000 - Math.min(entry.frequency.rank, 20000) * 10;
  if (entry.frequency?.corpusFrequency) score += Math.min(25000, Math.log10(entry.frequency.corpusFrequency + 1) * 4200);
  if (entry.priority) score += 60000;
  if (preferredPosByLemma[entry.lemma] === entry.pos) score += 5000;
  if (preferredPosByLemma[entry.lemma] && preferredPosByLemma[entry.lemma] !== entry.pos) score -= 4500;
  if (entry.example) score += 900;
  if (entry.sense?.topics?.length) score += 400;
  if (entry.meaning.length <= 90) score += 260;
  if (/[,/]/.test(entry.meaning)) score += 120;
  if (entry.meaning.length > 180) score -= 800;
  if (hasBlockedTags(entry.sense)) score -= 2000;
  score += Math.max(0, entry.senseScore || 0);
  score -= (learnerPosPriority[entry.pos] ?? 20) * 60;
  score -= Math.max(0, entry.lemma.length - 12) * 20;
  return score;
}

function rankEntries(entries) {
  return entries.sort((a, b) => {
    const scoreDelta = b.qualityScore - a.qualityScore;
    if (scoreDelta !== 0) return scoreDelta;
    const rankDelta = a.targetRank - b.targetRank;
    if (rankDelta !== 0) return rankDelta;
    return a.lemma.localeCompare(b.lemma);
  });
}

function renderDictionary(entries) {
  return `(function () {
  window.CORE_ITALIAN_DICTIONARY_META = {
    name: "Prototype Italian core dictionary",
    generatedAt: ${JSON.stringify(new Date().toISOString())},
    entryCount: ${entries.length},
    source: "Kaikki Italian machine-readable dictionary, derived from Wiktionary",
    ranking: "ItWaC lemma frequency plus prototype seed, learner-priority, and entry-quality scoring",
    frequencySource: "franfranz/Word_Frequency_Lists_ITA ItWaC CSVs when present",
    sourceLicenseNote: "Wikimedia text is generally CC BY-SA/GFDL. Keep attribution and verify license obligations before release."
  };

  window.CORE_ITALIAN_DICTIONARY = ${JSON.stringify(entries, null, 2)};
})();
`;
}

async function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const frequencyRanks = loadFrequencyRanks();
  const entriesByLemma = new Map();
  const reader = readline.createInterface({
    input: streamInput(inputPath),
    crlfDelay: Infinity
  });

  let lineCount = 0;
  for await (const line of reader) {
    lineCount += 1;
    if (!line.trim()) continue;

    let rawEntry;
    try {
      rawEntry = JSON.parse(line);
    } catch {
      continue;
    }

    const entry = entryFromKaikki(rawEntry, frequencyRanks);
    if (!entry) continue;

    const existing = entriesByLemma.get(entry.lemma);
    if (!existing || entry.qualityScore > existing.qualityScore) {
      entriesByLemma.set(entry.lemma, entry);
    }
  }

  const entries = rankEntries([...entriesByLemma.values()]).slice(0, maxEntries);
  fs.writeFileSync(outputPath, renderDictionary(entries), "utf8");

  console.log(`Read ${lineCount.toLocaleString()} JSONL rows.`);
  console.log(`Wrote ${entries.length.toLocaleString()} dictionary entries.`);
  console.log(outputPath);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
