const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..", "..");
const defaultInput = path.join(projectRoot, "prototype-0.2-lexical-coverage", "data", "dictionary_sorted.json");
const defaultOutput = path.join(projectRoot, "prototype-0.3-assisted-reader", "dictionary-overflow.js");
const inputPath = path.resolve(process.argv[2] || defaultInput);
const outputPath = path.resolve(process.argv[3] || defaultOutput);
const limit = Number(process.env.OVERFLOW_LIMIT || 12000);

function normalizeItalian(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z']/g, "");
}

function cleanDefinition(definition) {
  const lines = String(definition || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let activeHeading = "";
  const candidates = [];

  for (const line of lines) {
    if (line.startsWith("###")) {
      activeHeading = line.replace(/^#+\s*/, "").trim();
      continue;
    }
    if (!line.startsWith("- ")) continue;
    if (/definizione mancante|con flemma|forma flessa/i.test(line)) continue;

    const cleanedLine = line.replace(/^-\s*/, "").trim();
    const wordCount = cleanedLine.split(/\s+/).filter(Boolean).length;
    if (wordCount < 3) continue;

    const headingScore = /sostantivo|verbo|aggettivo|avverbio/i.test(activeHeading) ? 2 : 0;
    const detailScore = Math.min(wordCount, 18);
    candidates.push({
      heading: activeHeading,
      line,
      score: headingScore + detailScore
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  if (!best) return null;

  const cleaned = best.line
    .replace(/^-\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, "$1")
    .replace(/\{\{[^}]+\}\}/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || /definizione mancante/i.test(cleaned)) return null;
  return {
    heading: best.heading,
    definition: cleaned.length > 360 ? `${cleaned.slice(0, 357).trim()}...` : cleaned
  };
}

function loadPaisaRanks() {
  const paisaPath = path.join(projectRoot, "prototype-0.3-assisted-reader", "paisa-frequency.js");
  const ranks = new Map();
  if (!fs.existsSync(paisaPath)) return ranks;

  global.window = {};
  require(paisaPath);
  for (const [lemma, zipf, corpusFrequency, rank] of global.window.PAISA_FREQUENCY_LEMMAS || []) {
    ranks.set(normalizeItalian(lemma), {
      lemma,
      zipf,
      corpusFrequency,
      rank
    });
  }
  return ranks;
}

function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Dictionary overflow source not found: ${inputPath}`);
  }

  const paisaRanks = loadPaisaRanks();
  const sourceEntries = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const selected = new Map();

  for (const entry of sourceEntries) {
    const key = normalizeItalian(entry.word);
    if (!key || selected.has(key) || !paisaRanks.has(key)) continue;

    const cleaned = cleanDefinition(entry.definition);
    if (!cleaned) continue;

    const frequency = paisaRanks.get(key);
    selected.set(key, [
      String(entry.word),
      cleaned.definition,
      cleaned.heading,
      frequency.rank || 0,
      frequency.corpusFrequency || 0
    ]);

    if (selected.size >= limit) break;
  }

  const entries = [...selected.values()].sort((a, b) => a[3] - b[3]);
  const output = [
    "window.DICTIONARY_OVERFLOW_META = {",
    '  name: "Local dictionary overflow layer",',
    `  generatedAt: ${JSON.stringify(new Date().toISOString())},`,
    `  sourceFile: ${JSON.stringify(path.basename(inputPath))},`,
    `  entryCount: ${entries.length},`,
    '  sourceUrl: "https://huggingface.co/datasets/mik3ml/italian-dictionary",',
    '  sourceLicense: "CC BY-SA 4.0",',
    '  sourceNote: "Compact transformed subset of mik3ml/italian-dictionary, derived from Wiktionary. Definitions were selected and shortened for the prototype.",',
    '  tuple: ["word", "definition", "heading", "frequencyRank", "corpusFrequency"]',
    "};",
    "",
    "window.DICTIONARY_OVERFLOW_ENTRIES = ",
    `${JSON.stringify(entries, null, 2)};`,
    ""
  ].join("\n");

  fs.writeFileSync(outputPath, output, "utf8");
  console.log(`Wrote ${entries.length} dictionary overflow entries to ${outputPath}`);
}

main();
