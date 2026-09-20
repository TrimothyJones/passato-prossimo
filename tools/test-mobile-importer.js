const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const fflate = require("fflate");

const source = fs.readFileSync(
  path.resolve(__dirname, "..", "mobile", "mobile-library.js"),
  "utf8"
);
const window = {
  crypto: crypto.webcrypto,
  fflate
};
const context = vm.createContext({
  console,
  Date,
  Math,
  Map,
  Object,
  Promise,
  String,
  TextDecoder,
  Uint8Array,
  decodeURIComponent,
  parseInt,
  window
});
vm.runInContext(source, context, { filename: "mobile-library.js" });

const container = `<?xml version="1.0"?>
<container><rootfiles><rootfile full-path="OEBPS/content.opf" /></rootfiles></container>`;
const packageFile = `<?xml version="1.0"?>
<package xmlns:dc="http://purl.org/dc/elements/1.1/">
  <metadata><dc:title>Il libro mobile</dc:title><dc:creator>Autrice Prova</dc:creator></metadata>
  <manifest><item id="chapter" href="chapter.xhtml" media-type="application/xhtml+xml"></item></manifest>
  <spine><itemref idref="chapter"></itemref></spine>
</package>`;
const chapter = `<html><head><title>Capitolo Uno</title></head><body>
  <h1>Capitolo Uno</h1><p>C'era una volta un testo italiano.</p><p>La lettura continua.</p>
</body></html>`;
const archive = fflate.zipSync({
  "META-INF/container.xml": fflate.strToU8(container),
  "OEBPS/content.opf": fflate.strToU8(packageFile),
  "OEBPS/chapter.xhtml": fflate.strToU8(chapter)
});

async function run() {
  const mobileLibrary = window.PASSATO_MOBILE_LIBRARY;
  const parsed = await mobileLibrary.testing.parseEpubBytes(archive, "prova.epub");
  const metadata = mobileLibrary.testing.metadataForBook(parsed, "prova.epub");

  assert.equal(parsed.title, "Il libro mobile");
  assert.equal(parsed.author, "Autrice Prova");
  assert.equal(parsed.chapters.length, 1);
  assert.equal(parsed.chapters[0].title, "Capitolo Uno");
  assert.match(parsed.chapters[0].text, /C'era una volta/);
  assert.match(parsed.chapters[0].text, /La lettura continua/);
  assert.equal(metadata.importedContent, true);
  assert.equal(metadata.chapterSummaries.length, 1);
  assert.equal(metadata.originalFilename, "prova.epub");
  assert.throws(
    () => mobileLibrary.testing.normalizeZipPath("", "../../private.txt"),
    /unsafe archive path/
  );

  console.table([{
    title: parsed.title,
    author: parsed.author,
    chapters: parsed.chapters.length,
    characters: metadata.characterCount
  }]);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
