const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..", "..");
const defaultInput = path.join(projectRoot, "prototype-0.2-lexical-coverage", "data", "FQ List.json");
const defaultOutput = path.join(projectRoot, "prototype-0.3-assisted-reader", "learner-enrichment.js");
const inputPath = path.resolve(process.argv[2] || defaultInput);
const outputPath = path.resolve(process.argv[3] || defaultOutput);

function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Learner enrichment source not found: ${inputPath}`);
  }

  const rawEntries = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  const entries = rawEntries
    .filter((entry) => entry?.word && entry?.useful_for_flashcard)
    .map((entry) => [
      String(entry.word),
      String(entry.english_translation || ""),
      String(entry.example_sentence_native || ""),
      String(entry.example_sentence_english || ""),
      String(entry.cefr_level || ""),
      String(entry.pos || ""),
      Number(entry.word_frequency || 0)
    ]);

  const output = [
    "window.LEARNER_ITALIAN_META = {",
    '  name: "Learner Italian enrichment layer",',
    `  generatedAt: ${JSON.stringify(new Date().toISOString())},`,
    `  sourceFile: ${JSON.stringify(path.basename(inputPath))},`,
    `  entryCount: ${entries.length},`,
    '  sourceNote: "Derived from the Language-Learning-decks Italian JSON linked from Reddit; verify upstream license before release.",',
    '  tuple: ["word", "translation", "italianExample", "englishExample", "cefr", "pos", "frequencyRank"]',
    "};",
    "",
    "window.LEARNER_ITALIAN_ENTRIES = ",
    `${JSON.stringify(entries, null, 2)};`,
    ""
  ].join("\n");

  fs.writeFileSync(outputPath, output, "utf8");
  console.log(`Wrote ${entries.length} learner enrichment entries to ${outputPath}`);
}

main();
