const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const packageMetadata = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const target = path.join(root, "public-repo", `passato-prossimo-${packageMetadata.version}-source`);

if (fs.existsSync(target)) {
  throw new Error(`Public source target already exists: ${target}`);
}

const exactCopies = [
  [".gitattributes", ".gitattributes"],
  [".gitignore", ".gitignore"],
  ["LICENSE", "LICENSE"],
  ["DATA-LICENSES.md", "DATA-LICENSES.md"],
  ["CONTRIBUTING.md", "CONTRIBUTING.md"],
  ["THIRD-PARTY-NOTICES.txt", "THIRD-PARTY-NOTICES.txt"],
  ["package.json", "package.json"],
  ["package-lock.json", "package-lock.json"],
  ["forge.config.js", "forge.config.js"],
  ["releases/public-source/README.md", "README.md"],
  ["releases/PUBLIC-ALPHA-DATA-INVENTORY.md", "docs/PUBLIC-ALPHA-DATA-INVENTORY.md"],
  ["releases/PUBLIC-RELEASE-CHECKLIST.md", "docs/PUBLIC-RELEASE-CHECKLIST.md"],
  ["src/books.js", "src/books.js"],
  ["src/main.js", "src/main.js"],
  ["src/preload.js", "src/preload.js"],
  ["prototype-0.2-lexical-coverage/lexicon.js", "prototype-0.2-lexical-coverage/lexicon.js"],
  ["prototype-0.2-lexical-coverage/core-dictionary.js", "prototype-0.2-lexical-coverage/core-dictionary.js"],
  ["prototype-0.2-lexical-coverage/README.md", "prototype-0.2-lexical-coverage/README.md"],
  ["prototype-0.2-lexical-coverage/data/README.txt", "prototype-0.2-lexical-coverage/data/README.txt"],
  ["prototype-0.2-lexical-coverage/tools/import-kaikki-italian.js", "prototype-0.2-lexical-coverage/tools/import-kaikki-italian.js"],
  ["prototype-0.3-assisted-reader/paisa-frequency.js", "prototype-0.3-assisted-reader/paisa-frequency.js"],
  ["prototype-0.3-assisted-reader/learner-enrichment.js", "prototype-0.3-assisted-reader/learner-enrichment.js"],
  ["prototype-0.3-assisted-reader/dictionary-overflow.js", "prototype-0.3-assisted-reader/dictionary-overflow.js"],
  ["prototype-0.3-assisted-reader/context-markers.js", "prototype-0.3-assisted-reader/context-markers.js"],
  ["prototype-0.3-assisted-reader/accent-rules.js", "prototype-0.3-assisted-reader/accent-rules.js"],
  ["prototype-0.3-assisted-reader/elision-rules.js", "prototype-0.3-assisted-reader/elision-rules.js"],
  ["prototype-0.3-assisted-reader/README.md", "prototype-0.3-assisted-reader/README.md"],
  ["tools/build-public-source.js", "tools/build-public-source.js"],
  ["tools/build-third-party-notices.js", "tools/build-third-party-notices.js"],
  ["tools/test-url-importer.js", "tools/test-url-importer.js"]
];

const treeCopies = [
  ["prototype-0.3-assisted-reader/tools", "prototype-0.3-assisted-reader/tools"],
  ["prototype-0.5-media-shell", "prototype-0.5-media-shell"],
  ["releases/public-source/.github", ".github"]
];

function copyFile(sourceRelative, targetRelative) {
  const source = path.join(root, sourceRelative);
  const destination = path.join(target, targetRelative);
  if (!fs.statSync(source).isFile()) throw new Error(`Expected a file: ${sourceRelative}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function copyTree(sourceRelative, targetRelative) {
  const source = path.join(root, sourceRelative);
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const childSource = path.join(sourceRelative, entry.name);
    const childTarget = path.join(targetRelative, entry.name);
    if (entry.isDirectory()) copyTree(childSource, childTarget);
    else if (entry.isFile()) copyFile(childSource, childTarget);
  }
}

fs.mkdirSync(target, { recursive: true });
for (const [source, destination] of exactCopies) copyFile(source, destination);
for (const [source, destination] of treeCopies) copyTree(source, destination);

function listFiles(directory, prefix = "") {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(absolute, relative));
    else if (entry.isFile()) files.push({ relative, absolute });
  }
  return files;
}

const forbidden = [
  /(^|\/)node_modules(\/|$)/i,
  /(^|\/)out(\/|$)/i,
  /(^|\/)releases\/Passato-Prossimo-/i,
  /kaikki\.org-dictionary/i,
  /dictionary_sorted\.json/i,
  /lemma-frequencies-paisa\.txt/i,
  /FQ List\.json/i,
  /\.(?:epub|mp3|mp4|mov|m4a|wav|exe|nupkg|zip)$/i,
  /(^|\/)\.env(?:\.|$)/i
];
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/,
  /\bsk-[A-Za-z0-9_-]{24,}\b/
];
const maxFileBytes = 95 * 1024 * 1024;
const manifestFiles = [];

for (const file of listFiles(target)) {
  if (forbidden.some((pattern) => pattern.test(file.relative))) {
    throw new Error(`Forbidden public-source file: ${file.relative}`);
  }
  const data = fs.readFileSync(file.absolute);
  if (data.length > maxFileBytes) throw new Error(`Oversized public-source file: ${file.relative}`);
  const text = data.toString("utf8");
  if (secretPatterns.some((pattern) => pattern.test(text))) {
    throw new Error(`Possible credential in public-source file: ${file.relative}`);
  }
  manifestFiles.push({
    path: file.relative,
    bytes: data.length,
    sha256: crypto.createHash("sha256").update(data).digest("hex").toUpperCase()
  });
}

const manifest = {
  format: "passato-prossimo-public-source-v1",
  version: packageMetadata.version,
  generatedAt: new Date().toISOString(),
  policy: "Explicit allowlist; raw corpora, installers, release archives, dependencies, local media, and secrets are excluded.",
  fileCount: manifestFiles.length,
  files: manifestFiles.sort((a, b) => a.path.localeCompare(b.path))
};

fs.writeFileSync(
  path.join(target, "PUBLIC-SOURCE-MANIFEST.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8"
);

console.log(`Built ${target}`);
console.log(`Verified ${manifest.fileCount} allowlisted files.`);
