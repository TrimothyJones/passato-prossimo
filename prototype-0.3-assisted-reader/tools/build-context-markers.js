const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..", "..");
const localInput = path.join(projectRoot, "prototype-0.3-assisted-reader", "data", "context list.json");
const downloadsInput = "D:\\Downloads\\Immersion Project Stuff\\context list.json";
const defaultInput = fs.existsSync(localInput) ? localInput : downloadsInput;
const defaultOutput = path.join(projectRoot, "prototype-0.3-assisted-reader", "context-markers.js");
const inputPath = path.resolve(process.argv[2] || defaultInput);
const outputPath = path.resolve(process.argv[3] || defaultOutput);

function extractJsonObjects(text) {
  const objects = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) start = index;
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        objects.push(text.slice(start, index + 1));
        start = -1;
      }
    }
  }

  return objects;
}

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

function compactMarker(entry) {
  const phrase = entry.marker || entry.cluster;
  if (!phrase) return null;
  const components = entry.components?.length ? entry.components : normalizeItalian(phrase).split(" ");
  return [
    phrase,
    normalizeItalian(phrase),
    String(entry.register || "mixed"),
    String(entry.syntactic_position || ""),
    entry.english_equivalents || [],
    String(entry.pragmatic_function || ""),
    String(entry.llm_instruction || ""),
    String(entry.example || ""),
    components.map(normalizeItalian).filter(Boolean)
  ];
}

function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Context marker source not found: ${inputPath}`);
  }

  const raw = fs.readFileSync(inputPath, "utf8");
  const parsedBlocks = extractJsonObjects(raw).map((block) => repairMojibake(JSON.parse(block)));
  const markers = [];
  const clusters = [];

  for (const block of parsedBlocks) {
    for (const entry of block.context_markers || []) {
      const compact = compactMarker(entry);
      if (compact) markers.push(compact);
    }
    for (const entry of block.clustered_markers || []) {
      const compact = compactMarker(entry);
      if (compact) clusters.push(compact);
    }
  }

  const output = [
    "window.CONTEXT_MARKER_META = {",
    '  name: "Italian context marker layer",',
    `  generatedAt: ${JSON.stringify(new Date().toISOString())},`,
    `  sourceFile: ${JSON.stringify(path.basename(inputPath))},`,
    `  markerCount: ${markers.length},`,
    `  clusterCount: ${clusters.length},`,
    '  sourceNote: "Prototype pragmatic/context marker seed; human review required before release.",',
    '  tuple: ["phrase", "normalizedPhrase", "register", "position", "englishEquivalents", "function", "instruction", "example", "components"]',
    "};",
    "",
    "window.ITALIAN_CONTEXT_MARKERS = ",
    `${JSON.stringify(markers, null, 2)};`,
    "",
    "window.ITALIAN_CONTEXT_CLUSTERS = ",
    `${JSON.stringify(clusters, null, 2)};`,
    ""
  ].join("\n");

  fs.writeFileSync(outputPath, output, "utf8");
  console.log(`Wrote ${markers.length} context markers and ${clusters.length} clusters to ${outputPath}`);
}

main();
