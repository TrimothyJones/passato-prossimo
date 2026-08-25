const fs = require("fs");
const path = require("path");
const readline = require("readline");
const zlib = require("zlib");

const projectDir = path.resolve(__dirname, "..");
const defaultInput = path.join(projectDir, "lemma-frequencies-paisa.txt.gz");
const defaultOutput = path.join(projectDir, "paisa-frequency.js");
const inputPath = path.resolve(process.argv[2] || defaultInput);
const outputPath = path.resolve(process.argv[3] || defaultOutput);
const maxEntries = Number(process.env.PAISA_FREQUENCY_LIMIT || process.argv[4] || 25000);

async function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`PAISA frequency file not found: ${inputPath}`);
  }

  const rawEntries = await readPaisaEntries(inputPath);
  const ranked = rawEntries
    .sort((a, b) => b.count - a.count || a.lemma.localeCompare(b.lemma))
    .slice(0, maxEntries)
    .map((entry, index) => {
      const rank = index + 1;
      return [
        entry.lemma,
        Number(readerZipfForRank(rank).toFixed(3)),
        entry.count,
        rank
      ];
    });

  const output = [
    "window.PAISA_FREQUENCY_META = {",
    '  name: "PAISA lemma frequency layer",',
    `  generatedAt: ${JSON.stringify(new Date().toISOString())},`,
    `  sourceFile: ${JSON.stringify(path.basename(inputPath))},`,
    `  rawEntryCount: ${rawEntries.length},`,
    `  entryCount: ${ranked.length},`,
    '  license: "Creative Commons Attribution-NonCommercial-ShareAlike 3.0; verify release compatibility.",',
    '  tuple: ["lemma", "readerZipf", "corpusCount", "rank"]',
    "};",
    "",
    "window.PAISA_FREQUENCY_LEMMAS = ",
    `${JSON.stringify(ranked, null, 2)};`,
    ""
  ].join("\n");

  fs.writeFileSync(outputPath, output, "utf8");
  console.log(`Wrote ${ranked.length} PAISA frequency entries to ${outputPath}`);
  console.log(`Read ${rawEntries.length} cleaned lemma entries from ${inputPath}`);
}

async function readPaisaEntries(filePath) {
  const entries = new Map();
  const rl = readline.createInterface({
    input: streamInput(filePath),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line || line.startsWith("#")) continue;
    const parsed = parsePaisaLine(line);
    if (!parsed) continue;

    const existing = entries.get(parsed.lemma) || 0;
    entries.set(parsed.lemma, existing + parsed.count);
  }

  return [...entries.entries()].map(([lemma, count]) => ({ lemma, count }));
}

function streamInput(filePath) {
  const stream = fs.createReadStream(filePath);
  return filePath.endsWith(".gz") ? stream.pipe(zlib.createGunzip()) : stream;
}

function parsePaisaLine(line) {
  const commaIndex = line.lastIndexOf(",");
  if (commaIndex <= 0) return null;

  const rawLemma = line.slice(0, commaIndex);
  const count = Number(line.slice(commaIndex + 1));
  if (!Number.isFinite(count) || count <= 0) return null;

  const lemma = normalizeItalian(rawLemma);
  if (!lemma || lemma.length < 2) return null;
  if (lemma.includes(" ") || lemma.includes("-")) return null;
  if (!/[a-z]/.test(lemma)) return null;

  return { lemma, count };
}

function normalizeItalian(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z'\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readerZipfForRank(rank) {
  return Math.max(2.1, 6.95 - Math.log10(rank) * 0.88);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
