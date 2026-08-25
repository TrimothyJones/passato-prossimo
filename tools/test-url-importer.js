const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");
const yazl = require("yazl");

const handlers = new Map();
const testDataDir = path.join(os.tmpdir(), `immersion-url-test-${Date.now()}`);
const testingReportPath = path.join(testDataDir, "sanitized-testing-report.json");
const originalLoad = Module._load;
const originalFetch = global.fetch;

const electronMock = {
  app: {
    getPath() { return testDataDir; },
    whenReady() { return new Promise(() => {}); },
    on() {},
    quit() {}
  },
  BrowserWindow: class {},
  ipcMain: {
    handle(name, handler) { handlers.set(name, handler); }
  },
  shell: { async openExternal() {} },
  dialog: {
    async showSaveDialog() { return { canceled: false, filePath: testingReportPath }; }
  }
};

Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "electron") return electronMock;
  if (request === "dns/promises") {
    return { async lookup() { return [{ address: "93.184.216.34", family: 4 }]; } };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const italianParagraph = "La lettura in italiano aiuta il lettore a capire le parole, il contesto e la struttura della lingua. ";
const fixtureHtml = `<!doctype html>
  <html lang="it">
    <head>
      <title>Navigation title</title>
      <meta property="og:title" content="Una pagina italiana di prova">
      <meta name="author" content="Autrice di prova">
    </head>
    <body>
      <nav>Home Archivio Account</nav>
      <article>
        <h1>Una pagina italiana di prova</h1>
        <p>${italianParagraph.repeat(5)}</p>
        <p>${italianParagraph.repeat(5)}</p>
      </article>
      <footer>Privacy Cookie Contatti</footer>
    </body>
  </html>`;

global.fetch = async () => {
  const response = new Response(fixtureHtml, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" }
  });
  Object.defineProperty(response, "url", { value: "https://example.com/articolo" });
  return response;
};

async function run() {
  try {
    const mainModule = require(path.join(__dirname, "..", "src", "main.js"));
    assert.equal(mainModule.validateEpubEntryPath("OEBPS/content.opf"), "OEBPS/content.opf");
    assert.throws(() => mainModule.validateEpubEntryPath("../outside.txt"), /unsafe archive path/);
    assert.throws(() => mainModule.validateEpubEntryPath("OEBPS/../../outside.txt"), /unsafe archive path/);
    assert.throws(() => mainModule.validateEpubEntryPath("C:/outside.txt"), /unsafe archive path/);
    assert.throws(() => mainModule.validateEpubEntryPath("/outside.txt"), /unsafe archive path/);
    assert.throws(() => mainModule.assertSafeEpubEntryType({
      externalFileAttributes: (0o120777 << 16) >>> 0
    }, false), /symbolic link/);
    assert.throws(() => mainModule.assertSafeEpubEntryType({
      externalFileAttributes: (0o060777 << 16) >>> 0
    }, false), /unsupported archive entry type/);

    const miniatureEpubPath = path.join(testDataDir, "miniature.epub");
    const miniatureExtractDir = path.join(testDataDir, "miniature-extracted");
    const miniatureZip = new yazl.ZipFile();
    miniatureZip.addBuffer(Buffer.from("application/epub+zip"), "mimetype");
    miniatureZip.addBuffer(Buffer.from("<container>test</container>"), "META-INF/container.xml");
    miniatureZip.addBuffer(Buffer.from("<package>test</package>"), "OEBPS/content.opf");
    const miniatureZipBytes = await new Promise((resolve, reject) => {
      const chunks = [];
      miniatureZip.outputStream.on("data", chunk => chunks.push(chunk));
      miniatureZip.outputStream.on("end", () => resolve(Buffer.concat(chunks)));
      miniatureZip.outputStream.on("error", reject);
      miniatureZip.end();
    });
    await fs.mkdir(miniatureExtractDir, { recursive: true });
    await fs.writeFile(miniatureEpubPath, miniatureZipBytes);
    await mainModule.extractEpubSafely(miniatureEpubPath, miniatureExtractDir);
    assert.equal(await fs.readFile(path.join(miniatureExtractDir, "mimetype"), "utf8"), "application/epub+zip");
    assert.equal(await fs.readFile(path.join(miniatureExtractDir, "OEBPS", "content.opf"), "utf8"), "<package>test</package>");
    assert.equal(mainModule.desktopAppId, "com.passatoprossimo.immersion");
    assert.equal(mainModule.youtubeClientReferer, "https://com.passatoprossimo.immersion/");
    assert.deepEqual(mainModule.youtubeEmbedRequestFilter.urls, [
      "https://www.youtube.com/embed/*",
      "https://www.youtube-nocookie.com/embed/*"
    ]);
    assert.deepEqual(mainModule.youtubeIdentityHeaders({
      Accept: "text/html",
      referer: "file:///local-prototype/index.html"
    }), {
      Accept: "text/html",
      Referer: "https://com.passatoprossimo.immersion/"
    });
    let installedFilter = null;
    let installedListener = null;
    mainModule.installYouTubeClientIdentity({
      webRequest: {
        onBeforeSendHeaders(filter, listener) {
          installedFilter = filter;
          installedListener = listener;
        }
      }
    });
    assert.deepEqual(installedFilter, mainModule.youtubeEmbedRequestFilter);
    let identityResponse = null;
    installedListener({ requestHeaders: { Accept: "text/html" } }, response => {
      identityResponse = response;
    });
    assert.equal(identityResponse.requestHeaders.Referer, mainModule.youtubeClientReferer);
    const testingReport = mainModule.buildTestingReport([
      {
        type: "book_opened",
        title: "Private book title",
        bookId: "private-book-id",
        timestamp: "2026-08-23T10:00:00.000Z",
        sessionId: "session-one"
      },
      {
        type: "media_source_loaded",
        sourceKind: "youtube",
        videoId: "private-video-id",
        timestamp: "2026-08-23T10:01:00.000Z",
        sessionId: "session-one"
      },
      {
        type: "media_provider_error",
        provider: "youtube-iframe-v1",
        kind: "client-identity-missing",
        sourceUrl: "https://private.example/watch",
        timestamp: "2026-08-23T10:02:00.000Z",
        sessionId: "session-two"
      }
    ], {
      appVersion: "0.6.0-test",
      platform: "win32",
      architecture: "x64",
      osRelease: "test-release",
      electronVersion: "test-electron"
    });
    assert.equal(testingReport.reportFormat, "passato-prossimo-testing-report-v1");
    assert.equal(testingReport.usage.recordedEvents, 3);
    assert.equal(testingReport.usage.recordedSessions, 2);
    assert.equal(testingReport.usage.eventCounts.book_opened, 1);
    assert.equal(testingReport.usage.sourceKindCounts.youtube, 1);
    assert.equal(testingReport.usage.errorCounts["youtube-iframe-v1:client-identity-missing"], 1);
    assert.equal(testingReport.environment.appVersion, "0.6.0-test");
    const serializedTestingReport = JSON.stringify(testingReport);
    assert.doesNotMatch(serializedTestingReport, /Private book title|private-book-id|private-video-id|private\.example/);
    const editableMenu = mainModule.buildContextMenuTemplate({
      isEditable: true,
      editFlags: { canPaste: true, canSelectAll: true }
    });
    assert.equal(editableMenu.find((item) => item.role === "paste")?.enabled, true);
    assert.equal(editableMenu.find((item) => item.role === "selectAll")?.enabled, true);
    const previewHandler = handlers.get("preview-book-from-url");
    const savePreviewHandler = handlers.get("save-url-preview");
    const loadBooksHandler = handlers.get("load-custom-books");
    const sectionHandler = handlers.get("load-book-section");
    assert.equal(typeof previewHandler, "function");
    assert.equal(typeof savePreviewHandler, "function");
    assert.equal(typeof sectionHandler, "function");
    const logInteractionHandler = handlers.get("log-interaction");
    const exportTestingReportHandler = handlers.get("export-testing-report");
    assert.equal(typeof exportTestingReportHandler, "function");
    await logInteractionHandler(null, {
      type: "word_lens_opened",
      surface: "secret-word",
      sourceUrl: "https://private.example/reading"
    });
    const exportedReportResult = await exportTestingReportHandler();
    assert.equal(exportedReportResult.ok, true);
    const exportedReport = JSON.parse(await fs.readFile(testingReportPath, "utf8"));
    assert.equal(exportedReport.usage.eventCounts.word_lens_opened, 1);
    assert.doesNotMatch(JSON.stringify(exportedReport), /secret-word|private\.example/);

    const previewResult = await previewHandler(null, "https://example.com/articolo#commenti");
    assert.equal(previewResult.ok, true);
    assert.equal(previewResult.preview.title, "Una pagina italiana di prova");
    assert.equal(previewResult.preview.author, "Autrice di prova");
    assert.equal(previewResult.preview.sourceUrl, "https://example.com/articolo");
    assert.equal(previewResult.preview.italianSignal, "strong");
    assert.equal(previewResult.preview.extractionConfidence, "medium");
    assert.match(previewResult.preview.excerpt, /La lettura in italiano/);
    assert.equal((await loadBooksHandler()).length, 0);

    const result = await savePreviewHandler(null, {
      token: previewResult.preview.token,
      title: "Titolo controllato",
      author: previewResult.preview.author,
      text: previewResult.preview.text.replace("capire le parole", "capire davvero le parole")
    });
    assert.equal(result.ok, true);
    assert.equal(result.book.title, "Titolo controllato");
    assert.equal(result.book.author, "Autrice di prova");
    assert.equal(result.book.sourceUrl, "https://example.com/articolo");
    assert.match(result.book.importedAt, /^\d{4}-\d{2}-\d{2}T/);
    assert.match(result.book.note, /Italian signal: strong/);

    const section = await sectionHandler(null, {
      bookId: result.book.id,
      chapterIndex: 0,
      sectionIndex: 0
    });
    assert.match(section.sectionText, /capire davvero le parole/);
    assert.doesNotMatch(section.sectionText, /Privacy Cookie/);
    assert.doesNotMatch(section.sectionText, /Home Archivio/);

    const expired = await savePreviewHandler(null, { token: previewResult.preview.token });
    assert.equal(expired.ok, false);
    assert.match(expired.error, /expired/);

    const blocked = await previewHandler(null, "http://127.0.0.1/private");
    assert.equal(blocked.ok, false);
    assert.match(blocked.error, /private-network/);

    console.table([{
      title: result.book.title,
      author: result.book.author,
      characters: result.book.characterCount,
      source: result.book.sourceUrl,
      sectionCharacters: section.characterCount
    }]);
  } finally {
    Module._load = originalLoad;
    global.fetch = originalFetch;
    await fs.rm(testDataDir, { recursive: true, force: true });
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
