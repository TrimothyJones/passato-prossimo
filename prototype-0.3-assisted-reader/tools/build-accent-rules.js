const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..", "..");
const localInput = path.join(projectRoot, "prototype-0.3-assisted-reader", "data", "accent-rules.js");
const downloadsInput = "D:\\Downloads\\Immersion Project Stuff\\accent-rules.js";
const defaultInput = fs.existsSync(localInput) ? localInput : downloadsInput;
const defaultOutput = path.join(projectRoot, "prototype-0.3-assisted-reader", "accent-rules.js");
const inputPath = path.resolve(process.argv[2] || defaultInput);
const outputPath = path.resolve(process.argv[3] || defaultOutput);

function repairMojibake(value) {
  if (Array.isArray(value)) return value.map(repairMojibake);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, repairMojibake(item)]));
  }
  if (typeof value !== "string") return value;
  if (!/[ÃÂ]/.test(value)) return value;
  return Buffer.from(value, "latin1").toString("utf8");
}

function normalizeItalian(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Accent rules source not found: ${inputPath}`);
  }

  const source = repairMojibake(JSON.parse(fs.readFileSync(inputPath, "utf8")));
  const rules = source
    .filter((entry) => entry?.accented && entry?.unaccented)
    .map((entry) => [
      String(entry.accented),
      String(entry.unaccented),
      normalizeItalian(entry.accented),
      normalizeItalian(entry.unaccented),
      String(entry.accentedMeaning || ""),
      String(entry.unaccentedMeaning || ""),
      String(entry.note || ""),
      String(entry.example || "")
    ]);

  const output = [
    "window.ITALIAN_ACCENT_RULE_META = {",
    '  name: "Italian accent-sensitive rules",',
    `  generatedAt: ${JSON.stringify(new Date().toISOString())},`,
    `  sourceFile: ${JSON.stringify(path.basename(inputPath))},`,
    `  ruleCount: ${rules.length},`,
    '  sourceNote: "Prototype accent-sensitive pairs and stress examples; human review required before release.",',
    '  tuple: ["accented", "unaccented", "normalizedAccented", "normalizedUnaccented", "accentedMeaning", "unaccentedMeaning", "note", "example"]',
    "};",
    "",
    "window.ITALIAN_ACCENT_RULES = ",
    `${JSON.stringify(rules, null, 2)};`,
    ""
  ].join("\n");

  fs.writeFileSync(outputPath, output, "utf8");
  console.log(`Wrote ${rules.length} accent rules to ${outputPath}`);
}

main();
