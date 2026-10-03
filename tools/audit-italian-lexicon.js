const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const reportPath = path.join(root, "prototype-0.5-media-shell", "docs", "italian-lexical-audit-2026-09-24.md");
const dataFiles = [
  "prototype-0.2-lexical-coverage/lexicon.js",
  "prototype-0.2-lexical-coverage/core-dictionary.js",
  "prototype-0.3-assisted-reader/paisa-frequency.js",
  "prototype-0.3-assisted-reader/learner-enrichment.js",
  "prototype-0.3-assisted-reader/dictionary-overflow.js",
  "src/books.js"
];

function loadRuntimeData() {
  const window = {};
  const context = vm.createContext({ window });
  for (const relativePath of dataFiles) {
    vm.runInContext(fs.readFileSync(path.join(root, relativePath), "utf8"), context, {
      filename: relativePath
    });
  }
  return window;
}

function exactKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedKey(value) {
  return exactKey(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z']/g, "");
}

function hasAccent(value) {
  return /[\u00e0\u00e8\u00e9\u00ec\u00f2\u00f3\u00f9]/i.test(String(value || ""));
}

function createIndex(records, wordFor) {
  const exact = new Map();
  const normalized = new Map();
  for (const record of records) {
    const word = wordFor(record);
    const exactWord = exactKey(word);
    const normalizedWord = normalizedKey(word);
    if (exactWord && !exact.has(exactWord)) exact.set(exactWord, record);
    if (normalizedWord && !normalized.has(normalizedWord)) normalized.set(normalizedWord, record);
  }
  return { exact, normalized };
}

function lookup(index, value) {
  const exact = exactKey(value);
  if (index.exact.has(exact)) return index.exact.get(exact);
  if (hasAccent(value)) return null;
  return index.normalized.get(normalizedKey(value)) || null;
}

function percent(value, total) {
  return total ? `${(value / total * 100).toFixed(1)}%` : "0.0%";
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`)
  ].join("\n");
}

function readCommonForms() {
  const source = fs.readFileSync(path.join(root, "prototype-0.5-media-shell", "app.js"), "utf8");
  const match = source.match(/const commonFormLemmas = new Map\((\[[\s\S]*?\])\);/);
  if (!match) throw new Error("Could not read the active reader's common-form map.");
  return new Map(vm.runInNewContext(match[1]));
}

function resolverFor({ core, frequency, commonForms }) {
  const suffixes = [
    ["erebbero", "ere"], ["irebbero", "ire"], ["erebbe", "ere"], ["irebbe", "ire"],
    ["avano", "are"], ["evano", "ere"], ["ivano", "ire"], ["iamo", "are"],
    ["ato", "are"], ["ata", "are"], ["ati", "are"], ["ate", "are"],
    ["uto", "ere"], ["uta", "ere"], ["uti", "ere"], ["ute", "ere"],
    ["ito", "ire"], ["ita", "ire"], ["iti", "ire"], ["ite", "ire"],
    ["ando", "are"], ["endo", "ere"], ["mente", ""],
    ["zione", "zione"], ["zioni", "zione"], ["i", "o"], ["e", "a"]
  ];

  function resolve(surface) {
    const exact = exactKey(surface);
    let word = normalizedKey(surface);
    if (!word) return { lemma: "", method: "empty" };

    if (exact.includes("'")) {
      const remainder = exact.slice(exact.lastIndexOf("'") + 1);
      if (remainder) {
        const nested = resolve(remainder);
        return { ...nested, method: `elision-${nested.method}` };
      }
    }

    if (exact === "\u00e8") return { lemma: "essere", method: "accent-sensitive" };
    if (exact === "d\u00e0") return { lemma: "dare", method: "accent-sensitive" };
    if (commonForms.has(exact)) return { lemma: commonForms.get(exact), method: "known-exact-form" };
    if (commonForms.has(word)) return { lemma: commonForms.get(word), method: "known-form" };
    if (lookup(core, word)) return { lemma: word, method: "dictionary-direct" };
    if (lookup(frequency, word)) return { lemma: word, method: "frequency-direct" };

    for (const [suffix, replacement] of suffixes) {
      if (word.length <= suffix.length + 2 || !word.endsWith(suffix)) continue;
      const candidate = word.slice(0, -suffix.length) + replacement;
      if (lookup(core, candidate) || lookup(frequency, candidate)) {
        return { lemma: candidate, method: "ending-guess" };
      }
    }
    return { lemma: word, method: "surface-form" };
  }

  return resolve;
}

function tokenizedWords(text) {
  return [...String(text || "").matchAll(/[\p{L}]+(?:['\u2019][\p{L}]+)?/gu)].map((match) => match[0]);
}

function coverageForBook(book, providers, resolve) {
  const words = tokenizedWords(book.text);
  const gaps = new Map();
  let recognized = 0;
  let english = 0;
  let anyDefinition = 0;
  let example = 0;

  for (const word of words) {
    const result = resolve(word);
    const coreHit = lookup(providers.core, result.lemma);
    const learnerHit = lookup(providers.learner, word) || lookup(providers.learner, result.lemma);
    const overflowHit = lookup(providers.overflow, word) || lookup(providers.overflow, result.lemma);
    const frequencyHit = lookup(providers.frequency, result.lemma);
    const hasEnglish = Boolean(coreHit?.meaning || learnerHit?.[1]);
    const hasAnyDefinition = hasEnglish || Boolean(overflowHit?.[1]);
    const hasExample = Boolean(coreHit?.example || learnerHit?.[2]);

    if (coreHit || learnerHit || overflowHit || frequencyHit) recognized += 1;
    if (hasEnglish) english += 1;
    if (hasAnyDefinition) anyDefinition += 1;
    if (hasExample) example += 1;
    if (!hasEnglish) {
      const gap = gaps.get(result.lemma) || { lemma: result.lemma, count: 0, surfaces: new Set(), overflow: false };
      gap.count += 1;
      gap.surfaces.add(word);
      gap.overflow ||= Boolean(overflowHit);
      gaps.set(result.lemma, gap);
    }
  }

  const topGaps = [...gaps.values()]
    .sort((a, b) => b.count - a.count || a.lemma.localeCompare(b.lemma))
    .slice(0, 12)
    .map((gap) => `${gap.lemma} (${gap.count}${gap.overflow ? ", Italian definition only" : ""})`);

  return {
    title: book.title,
    tokens: words.length,
    recognized,
    english,
    anyDefinition,
    example,
    topGaps
  };
}

function main() {
  const data = loadRuntimeData();
  const coreRecords = data.CORE_ITALIAN_DICTIONARY || [];
  const learnerRecords = data.LEARNER_ITALIAN_ENTRIES || [];
  const overflowRecords = data.DICTIONARY_OVERFLOW_ENTRIES || [];
  const frequencyRecords = data.PAISA_FREQUENCY_LEMMAS || [];
  const seedRecords = data.ITALIAN_FREQUENCY_LEMMAS || [];

  const providers = {
    core: createIndex(coreRecords, (entry) => entry.lemma),
    learner: createIndex(learnerRecords, (entry) => entry[0]),
    overflow: createIndex(overflowRecords, (entry) => entry[0]),
    frequency: createIndex(frequencyRecords, (entry) => entry[0])
  };
  const commonForms = readCommonForms();
  const resolve = resolverFor({ core: providers.core, frequency: providers.frequency, commonForms });

  const allDefinitionKeys = new Set([
    ...providers.core.normalized.keys(),
    ...providers.learner.normalized.keys(),
    ...providers.overflow.normalized.keys()
  ]);
  const englishKeys = new Set([
    ...providers.core.normalized.keys(),
    ...providers.learner.normalized.keys()
  ]);
  const recognitionKeys = new Set([...allDefinitionKeys, ...providers.frequency.normalized.keys()]);

  const overlap = (left, right) => [...left.keys()].filter((key) => right.has(key)).length;
  const thresholds = [100, 500, 1000, 5000, 10000, 25000];
  const frequencyRows = thresholds.map((limit) => {
    const rows = frequencyRecords.slice(0, limit);
    const counts = { core: 0, learner: 0, overflow: 0, english: 0, any: 0, examples: 0, pos: 0 };
    let totalWeight = 0;
    let englishWeight = 0;
    let anyWeight = 0;
    for (const row of rows) {
      const lemma = row[0];
      const weight = Number(row[2] || 0);
      const coreHit = lookup(providers.core, lemma);
      const learnerHit = lookup(providers.learner, lemma);
      const overflowHit = lookup(providers.overflow, lemma);
      const hasEnglish = Boolean(coreHit?.meaning || learnerHit?.[1]);
      const hasAny = hasEnglish || Boolean(overflowHit?.[1]);
      counts.core += Boolean(coreHit);
      counts.learner += Boolean(learnerHit);
      counts.overflow += Boolean(overflowHit);
      counts.english += hasEnglish;
      counts.any += hasAny;
      counts.examples += Boolean(coreHit?.example || learnerHit?.[2]);
      counts.pos += Boolean(coreHit?.pos || learnerHit?.[5] || overflowHit?.[2]);
      totalWeight += weight;
      if (hasEnglish) englishWeight += weight;
      if (hasAny) anyWeight += weight;
    }
    return { limit, ...counts, totalWeight, englishWeight, anyWeight };
  });

  const topGaps = frequencyRecords
    .map((row) => {
      const lemma = row[0];
      const coreHit = lookup(providers.core, lemma);
      const learnerHit = lookup(providers.learner, lemma);
      const overflowHit = lookup(providers.overflow, lemma);
      return {
        lemma,
        rank: row[3],
        count: row[2],
        overflow: Boolean(overflowHit?.[1]),
        pos: coreHit?.pos || learnerHit?.[5] || overflowHit?.[2] || "unknown",
        hasEnglish: Boolean(coreHit?.meaning || learnerHit?.[1])
      };
    })
    .filter((entry) => !entry.hasEnglish && /^[a-z\u00e0-\u00ff'-]+$/i.test(entry.lemma))
    .slice(0, 40);

  const accentForms = new Map();
  for (const word of [...providers.learner.exact.keys(), ...providers.overflow.exact.keys()]) {
    const normalized = normalizedKey(word);
    if (!accentForms.has(normalized)) accentForms.set(normalized, new Set());
    accentForms.get(normalized).add(word);
  }
  const accentCollisions = [...accentForms.entries()]
    .filter(([, forms]) => forms.size > 1 && [...forms].some(hasAccent))
    .sort((a, b) => a[0].localeCompare(b[0]));

  const coreFlags = {
    missingMeaning: coreRecords.filter((entry) => !String(entry.meaning || "").trim()).length,
    missingExample: coreRecords.filter((entry) => !String(entry.example || "").trim()).length,
    missingPos: coreRecords.filter((entry) => !String(entry.pos || "").trim()).length,
    formInsteadOfSense: coreRecords.filter((entry) => /^(plural|feminine|masculine|inflection|alternative form|past participle|present participle) of\b/i.test(String(entry.meaning || ""))).length,
    longMeaning: coreRecords.filter((entry) => String(entry.meaning || "").length > 180).length
  };
  const learnerFlags = {
    missingTranslation: learnerRecords.filter((entry) => !String(entry[1] || "").trim()).length,
    missingItalianExample: learnerRecords.filter((entry) => !String(entry[2] || "").trim()).length,
    missingEnglishExample: learnerRecords.filter((entry) => !String(entry[3] || "").trim()).length,
    missingPos: learnerRecords.filter((entry) => !String(entry[5] || "").trim()).length
  };
  const reviewLemmas = [
    "venire", "fare", "primo", "solo", "grande", "vedere", "trovare", "tempo",
    "ultimo", "nome", "gruppo", "andare", "diverso", "opera", "the"
  ].map((lemma) => {
    const entry = lookup(providers.core, lemma);
    const frequency = lookup(providers.frequency, lemma);
    return {
      lemma,
      rank: frequency?.[3] || 0,
      meaning: entry?.meaning || "missing",
      pos: entry?.pos || "unknown"
    };
  });

  const books = (data.IMMERSION_BOOKS || []).map((book) => coverageForBook(book, providers, resolve));
  const sourceInventory = [
    ["Kaikki Italian JSONL", "prototype-0.2-lexical-coverage/data/kaikki.org-dictionary-Italian.jsonl", "CC BY-SA / Wiktionary attribution"],
    ["FQ learner list", "prototype-0.2-lexical-coverage/data/FQ List.json", "Dataset reuse permission; embedded wordfreq fields CC BY-SA 4.0"],
    ["mik3ml dictionary", "prototype-0.2-lexical-coverage/data/dictionary_sorted.json", "CC BY-SA 4.0"],
    ["PAISA frequencies", "prototype-0.3-assisted-reader/lemma-frequencies-paisa.txt.gz", "CC BY-NC-SA 3.0"],
    ["ItWaC-derived lists", "prototype-0.2-lexical-coverage/data/itwac_nouns_lemmas_notail_2_0_0.csv", "MIT list code; retain corpus citation"]
  ].map(([name, relativePath, license]) => {
    const stats = fs.statSync(path.join(root, relativePath));
    return [name, `${(stats.size / 1024 / 1024).toFixed(1)} MB`, license];
  });

  const generated = new Date().toISOString();
  const lines = [
    "# Italian Lexical Stack Audit",
    "",
    `Generated: ${generated}`,
    "",
    "## Executive Summary",
    "",
    `The current runtime recognizes **${formatNumber(recognitionKeys.size)} normalized lexical keys**, but only **${formatNumber(englishKeys.size)}** have an English meaning in the core or learner layers. Adding the Italian-only overflow raises definition-bearing coverage to **${formatNumber(allDefinitionKeys.size)}** keys. Recognition, translation, and explanation coverage are therefore not interchangeable metrics.`,
    "",
    "The stack is already broad enough to support useful reading, but its next bottleneck is richer and better-aligned meanings rather than frequency data alone. The 25,000-entry PAISA layer recognizes many lemmas that still have no learner-facing English meaning. Core sense selection also needs quality work: a present entry can still choose a narrow or misleading sense.",
    "",
    "## Runtime Layers",
    "",
    markdownTable(
      ["Layer", "Entries", "Primary job", "Definition language"],
      [
        ["Core Kaikki dictionary", formatNumber(coreRecords.length), "Lemma, meaning, example, POS, ranking", "Mostly English"],
        ["Learner enrichment", formatNumber(learnerRecords.length), "Translation, paired examples, CEFR/POS", "English translation"],
        ["Dictionary overflow", formatNumber(overflowRecords.length), "Additional local definitions and POS headings", "Italian"],
        ["PAISA frequency", formatNumber(frequencyRecords.length), "Lemma recognition, rank, corpus count", "None"],
        ["Prototype seed frequency", formatNumber(seedRecords.length), "Very common learner-oriented seed", "None"]
      ]
    ),
    "",
    "## Provider Overlap",
    "",
    markdownTable(
      ["Comparison", "Shared normalized keys"],
      [
        ["Core and learner", formatNumber(overlap(providers.core.normalized, providers.learner.normalized))],
        ["Core and overflow", formatNumber(overlap(providers.core.normalized, providers.overflow.normalized))],
        ["Learner and overflow", formatNumber(overlap(providers.learner.normalized, providers.overflow.normalized))],
        ["English meaning union", formatNumber(englishKeys.size)],
        ["Any definition union", formatNumber(allDefinitionKeys.size)],
        ["Recognition union including PAISA", formatNumber(recognitionKeys.size)]
      ]
    ),
    "",
    "## Coverage By PAISA Frequency Rank",
    "",
    markdownTable(
      ["Top lemmas", "English meaning", "Any definition", "Example", "POS", "Token-weighted English", "Token-weighted any"],
      frequencyRows.map((row) => [
        formatNumber(row.limit),
        `${formatNumber(row.english)} (${percent(row.english, row.limit)})`,
        `${formatNumber(row.any)} (${percent(row.any, row.limit)})`,
        `${formatNumber(row.examples)} (${percent(row.examples, row.limit)})`,
        `${formatNumber(row.pos)} (${percent(row.pos, row.limit)})`,
        percent(row.englishWeight, row.totalWeight),
        percent(row.anyWeight, row.totalWeight)
      ])
    ),
    "",
    "Token-weighted figures use PAISA corpus counts. They estimate how often covered lemmas occur inside the selected frequency layer; they do not measure inflection handling, contextual sense accuracy, proper nouns, phrases, or learner knowledge.",
    "",
    "## Built-In Reading Samples",
    "",
    markdownTable(
      ["Sample", "Tokens", "Recognized", "English meaning", "Any definition", "Example"],
      books.map((book) => [
        book.title,
        formatNumber(book.tokens),
        `${formatNumber(book.recognized)} (${percent(book.recognized, book.tokens)})`,
        `${formatNumber(book.english)} (${percent(book.english, book.tokens)})`,
        `${formatNumber(book.anyDefinition)} (${percent(book.anyDefinition, book.tokens)})`,
        `${formatNumber(book.example)} (${percent(book.example, book.tokens)})`
      ])
    ),
    "",
    ...books.flatMap((book) => [
      `- **${book.title} top English-meaning gaps:** ${book.topGaps.join(", ") || "none"}`
    ]),
    "",
    "These samples are historical literature and intentionally stress archaic forms. They are useful regression material but should not be the only corpus used to judge modern Italian coverage.",
    "",
    "## Highest-Ranked English-Meaning Gaps",
    "",
    markdownTable(
      ["PAISA rank", "Lemma", "Corpus count", "Current POS", "Italian overflow definition"],
      topGaps.map((entry) => [
        formatNumber(entry.rank),
        `\`${entry.lemma}\``,
        formatNumber(entry.count),
        String(entry.pos).replace(/\|/g, "/"),
        entry.overflow ? "yes" : "no"
      ])
    ),
    "",
    "This is a triage list, not an automatic import queue. It contains names, abbreviations, malformed corpus tokens, and function forms alongside useful lemmas. Each candidate needs lexical and licensing review.",
    "",
    "## Data Quality Signals",
    "",
    markdownTable(
      ["Layer", "Signal", "Count"],
      [
        ["Core", "Missing meaning", formatNumber(coreFlags.missingMeaning)],
        ["Core", "Missing example", formatNumber(coreFlags.missingExample)],
        ["Core", "Missing POS", formatNumber(coreFlags.missingPos)],
        ["Core", "Meaning looks like an inflected-form cross-reference", formatNumber(coreFlags.formInsteadOfSense)],
        ["Core", "Meaning longer than 180 characters", formatNumber(coreFlags.longMeaning)],
        ["Learner", "Missing English translation", formatNumber(learnerFlags.missingTranslation)],
        ["Learner", "Missing Italian example", formatNumber(learnerFlags.missingItalianExample)],
        ["Learner", "Missing English example", formatNumber(learnerFlags.missingEnglishExample)],
        ["Learner", "Missing POS", formatNumber(learnerFlags.missingPos)],
        ["Combined learner/overflow", "Accent-collision groups", formatNumber(accentCollisions.length)]
      ]
    ),
    "",
    `Accent-sensitive collision examples: ${accentCollisions.slice(0, 20).map(([, forms]) => [...forms].map((form) => `\`${form}\``).join(" / ")).join(", ") || "none"}. These must remain separate during lookup; accent-stripped merging would erase meaning contrasts.`,
    "",
    "## Frequent Core Senses Requiring Review",
    "",
    markdownTable(
      ["PAISA rank", "Lemma", "Selected core meaning", "POS"],
      reviewLemmas.map((entry) => [
        formatNumber(entry.rank),
        `\`${entry.lemma}\``,
        String(entry.meaning).replace(/\|/g, "/"),
        entry.pos
      ])
    ),
    "",
    "These entries are not necessarily false dictionary senses. The problem is ordering: a valid specialist, secondary, or malformed sense is being presented as the default learner meaning. This list is a small confirmed sample, not a complete quality count.",
    "",
    "## Local Source Inventory",
    "",
    markdownTable(["Source", "Local size", "Current license note"], sourceInventory),
    "",
    "The raw local sources total far more material than the runtime exports. Increasing a numeric limit is possible, but it would also enlarge the PWA download and reproduce current sense-selection problems at greater scale. Expansion should go through a compact provider build rather than shipping raw dumps.",
    "",
    "## Findings",
    "",
    "1. **The frequency layer is ahead of the meaning layer.** PAISA already supplies broad recognition and ranking, so the immediate gain comes from enriching high-frequency gaps with dependable meanings and examples.",
    "2. **Italian and English definitions need explicit roles.** The overflow layer is useful, but the UI currently sometimes treats its Italian definition as though it were an English meaning. Provider records should carry a language field.",
    "3. **Presence is not quality.** The core importer chooses one sense per lemma. Common words can receive a valid but narrow sense, so core entries need multi-sense ranking or a learner-facing preferred-sense layer. Blindly raising the 5,000-entry limit would scale this problem.",
    "4. **Accent preservation is mandatory.** Normalized keys are useful for retrieval, but exact accented forms must win before loose matching.",
    "5. **Literary and modern benchmarks should be separated.** Dante, Manzoni, and Collodi expose historical gaps; a balanced modern test set is needed before judging everyday coverage.",
    "6. **The commercial path has a known constraint.** PAISA is CC BY-NC-SA 3.0. It is suitable for the noncommercial alpha, but a commercial release needs a replaceable frequency provider or separate licensing review.",
    "",
    "## Recommended Step 2 Sourcing Targets",
    "",
    "- A small reviewed foundation provider for missing function words such as `di`, `il`, `in`, `che`, `un`, `una`, `per`, and `con`.",
    "- English glosses for high-frequency lemmas currently known only by PAISA or Italian overflow.",
    "- Better preferred senses for common polysemous words already present in the core, beginning with the confirmed review table above.",
    "- Provider metadata for definition language, source, license, confidence, register, and whether a meaning is preferred or merely available.",
    "- Natural modern examples with clear reuse rights and source metadata.",
    "- Morphological links for frequent inflected forms that still fall through to surface-form guesses.",
    "- Phrase and collocation data kept separate from single-lemma definitions.",
    "- A commercially replaceable frequency list before monetization decisions become implementation work.",
    "",
    "## Audit Boundary",
    "",
    "This audit measures local runtime data and the current reader's lightweight form resolver. It does not claim semantic correctness, complete dictionary coverage, or learner comprehension. Automated counts identify where human review and better sources are likely to matter most."
  ];

  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
  console.log(`Wrote ${reportPath}`);
  console.log(`Recognition keys: ${formatNumber(recognitionKeys.size)}`);
  console.log(`English meaning keys: ${formatNumber(englishKeys.size)}`);
  console.log(`Any definition keys: ${formatNumber(allDefinitionKeys.size)}`);
}

main();
