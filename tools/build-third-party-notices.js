const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const lock = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8"));
const outputPath = path.join(root, "THIRD-PARTY-NOTICES.txt");

const lines = [
  "PASSATO PROSSIMO - SOURCES AND THIRD-PARTY NOTICES",
  "Public alpha notice generated from the packaged dependency set.",
  "",
  "Passato Prossimo original application code and interface",
  "Copyright (c) 2026 Passato Prossimo Project. All rights reserved.",
  "The project's source-code license has not yet been selected.",
  "",
  "LANGUAGE AND READING DATA",
  "",
  "1. Kaikki Italian dictionary / English Wiktionary / Wiktextract",
  "Source: https://kaikki.org/dictionary/Italian/index.html",
  "Wiktionary terms: https://en.wiktionary.org/wiki/Wiktionary:Copyrights",
  "Wiktextract: https://github.com/tatuylonen/wiktextract",
  "License: Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0).",
  "Passato Prossimo uses a selected, compact browser-readable subset. Entries were ranked, fields were omitted, and learner-facing gloss choices or hints were added.",
  "Wiktionary and its contributors do not endorse Passato Prossimo.",
  "Suggested citation: Tatu Ylonen, Wiktextract: Wiktionary as Machine-Readable Structured Data, LREC 2022.",
  "",
  "2. mik3ml/italian-dictionary overflow definitions",
  "Source: https://huggingface.co/datasets/mik3ml/italian-dictionary",
  "License: CC BY-SA 4.0.",
  "The packaged overflow layer is a transformed subset. Passato Prossimo selected 12,000 entries, selected one definition line per entry, removed markup, shortened long definitions, and attached local frequency fields.",
  "The transformed overflow data remains available under CC BY-SA 4.0.",
  "",
  "3. PAISA Italian lemma frequencies",
  "Source: https://www.corpusitaliano.it/en/contents/description.html",
  "License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 (CC BY-NC-SA 3.0).",
  "Passato Prossimo converted the source frequency list into a compact 25,000-entry JavaScript layer with ranks, corpus counts, and reader-oriented Zipf values.",
  "The transformed frequency layer remains under CC BY-NC-SA 3.0. This public alpha is noncommercial.",
  "Citation: Lyding et al. (2014), The PAISA Corpus of Italian Web Texts, WaC-9.",
  "",
  "4. Language-Learning-decks Italian learner data and wordfreq",
  "Dataset: https://github.com/vbvss199/Language-Learning-decks",
  "Attribution: https://github.com/vbvss199/Language-Learning-decks/blob/main/attributions.md",
  "wordfreq: https://github.com/rspeer/wordfreq",
  "The dataset publisher permits reuse. Its frequency data is attributed to wordfreq and licensed CC BY-SA 4.0; wordfreq code is Apache-2.0.",
  "Passato Prossimo selected learner-useful fields and converted them into a compact local lookup layer. The transformed data layer remains under CC BY-SA 4.0.",
  "Citation: Robyn Speer (2022), rspeer/wordfreq v3.0, https://doi.org/10.5281/zenodo.7199437",
  "",
  "5. Italian ItWaC-derived frequency lists",
  "Source: https://github.com/franfranz/Word_Frequency_Lists_ITA",
  "License: MIT. Copyright (c) 2020 franfranz.",
  "Passato Prossimo used the lists to rank and connect dictionary entries; the raw lists are not included in the installer.",
  "Corpus reference: Baroni, Bernardini, Ferraresi, and Zanchetta (2009), The WaCky Wide Web.",
  "",
  "6. Built-in public-domain reading samples",
  "Pinocchio by Carlo Collodi: https://www.gutenberg.org/ebooks/19517",
  "I promessi sposi by Alessandro Manzoni: https://www.gutenberg.org/ebooks/45334",
  "La Divina Commedia by Dante Alighieri: https://www.gutenberg.org/ebooks/1012",
  "Only short public-domain text samples are bundled. Project Gutenberg does not endorse Passato Prossimo.",
  "",
  "7. Project-created experimental language rules",
  "The accent, elision, and conversational-context seed layers were assembled for this prototype with AI assistance and human review. They are experimental teaching aids, not an authoritative linguistic reference.",
  "",
  "SOFTWARE",
  "",
  "Electron is copyright Electron contributors and GitHub Inc. and is distributed under the MIT License. Electron's accompanying Chromium and third-party notices are included in the installed Electron distribution.",
  "Electron Forge's Squirrel maker is copyright (c) 2016 Samuel Attard and is distributed under the MIT License.",
  "electron-winstaller is copyright (c) 2015 GitHub Inc. and is distributed under the MIT License.",
  "",
  "The following production JavaScript packages and their complete license texts are reproduced below.",
  ""
];

function repositoryUrl(pkg) {
  const repository = typeof pkg.repository === "string" ? pkg.repository : pkg.repository?.url;
  return String(pkg.homepage || repository || "").replace(/^git\+/, "").replace(/\.git$/, "");
}

function licenseTextFor(packageDir, pkg) {
  const licenseFile = fs.readdirSync(packageDir)
    .find((name) => /^(licen[cs]e|copying)(?:\.|$)/i.test(name));
  if (licenseFile) return fs.readFileSync(path.join(packageDir, licenseFile), "utf8").trim();
  if (pkg.license === "ISC") {
    const owner = typeof pkg.author === "string" ? pkg.author : pkg.author?.name || pkg.name;
    return `ISC License\n\nCopyright (c) ${owner}\n\nPermission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.`;
  }
  return `No standalone license file was found. Declared SPDX license: ${pkg.license || "unknown"}.`;
}

const productionPackages = Object.entries(lock.packages)
  .filter(([key, entry]) => key.startsWith("node_modules/") && !entry.dev)
  .map(([key]) => {
    const packageDir = path.join(root, key);
    const pkg = JSON.parse(fs.readFileSync(path.join(packageDir, "package.json"), "utf8"));
    return { packageDir, pkg };
  })
  .sort((a, b) => a.pkg.name.localeCompare(b.pkg.name) || a.pkg.version.localeCompare(b.pkg.version));

for (const { packageDir, pkg } of productionPackages) {
  lines.push("=".repeat(72));
  lines.push(`${pkg.name} ${pkg.version} - ${pkg.license || "license not declared"}`);
  const source = repositoryUrl(pkg);
  if (source) lines.push(`Source: ${source}`);
  lines.push("");
  lines.push(licenseTextFor(packageDir, pkg));
  lines.push("");
}

fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${outputPath} with ${productionPackages.length} production package notices.`);
