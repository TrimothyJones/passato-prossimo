const { app, BrowserWindow, ipcMain, shell, dialog, Menu, session } = require("electron");
const path = require("path");
const fs = require("fs/promises");
const fsSync = require("fs");
const os = require("os");
const crypto = require("crypto");
const dns = require("dns/promises");
const net = require("net");
const { Transform } = require("stream");
const { pipeline } = require("stream/promises");
const yauzl = require("yauzl");
const cheerio = require("cheerio");
const packageMetadata = require("../package.json");

const appDataDir = () => path.join(app.getPath("userData"), "immersion-data");
const logPath = () => path.join(appDataDir(), "interactions.json");
const wordsPath = () => path.join(appDataDir(), "top-words.json");
const customBooksPath = () => path.join(appDataDir(), "custom-books.json");
const importLogPath = () => path.join(appDataDir(), "import-log.json");
const importedBooksDir = () => path.join(appDataDir(), "imported-books");
const largeBookThreshold = 150000;
const sectionSize = 10000;
const maximumRemoteBytes = 5 * 1024 * 1024;
const maximumRedirects = 5;
const maximumUrlTextCharacters = 350000;
const maximumEpubEntries = 5000;
const maximumEpubEntryBytes = 50 * 1024 * 1024;
const maximumEpubExtractedBytes = 250 * 1024 * 1024;
const pendingUrlPreviews = new Map();
const appSessionId = crypto.randomUUID();
const desktopAppId = "com.passatoprossimo.immersion";
const youtubeClientReferer = `https://${desktopAppId}/`;
const youtubeEmbedRequestFilter = {
  urls: [
    "https://www.youtube.com/embed/*",
    "https://www.youtube-nocookie.com/embed/*"
  ]
};

function youtubeIdentityHeaders(requestHeaders = {}) {
  const headers = { ...requestHeaders };
  for (const name of Object.keys(headers)) {
    if (name.toLowerCase() === "referer") delete headers[name];
  }
  headers.Referer = youtubeClientReferer;
  return headers;
}

function installYouTubeClientIdentity(electronSession) {
  electronSession.webRequest.onBeforeSendHeaders(
    youtubeEmbedRequestFilter,
    (details, callback) => callback({
      requestHeaders: youtubeIdentityHeaders(details.requestHeaders)
    })
  );
}

async function ensureDataFiles() {
  await fs.mkdir(appDataDir(), { recursive: true });
  await fs.mkdir(importedBooksDir(), { recursive: true });

  try {
    await fs.access(logPath());
  } catch {
    await fs.writeFile(logPath(), "[]", "utf8");
  }

  try {
    await fs.access(wordsPath());
  } catch {
    await fs.writeFile(wordsPath(), "{}", "utf8");
  }

  try {
    await fs.access(customBooksPath());
  } catch {
    await fs.writeFile(customBooksPath(), "[]", "utf8");
  }

  try {
    await fs.access(importLogPath());
  } catch {
    await fs.writeFile(importLogPath(), "[]", "utf8");
  }
}

async function appendInteraction(event) {
  await ensureDataFiles();
  const existing = JSON.parse(await fs.readFile(logPath(), "utf8"));
  existing.push({
    ...event,
    timestamp: new Date().toISOString(),
    sessionId: appSessionId,
    appVersion: packageMetadata.version
  });
  await fs.writeFile(logPath(), JSON.stringify(existing.slice(-5000), null, 2), "utf8");
}

function buildTestingReport(events, environment = {}) {
  const safeEvents = Array.isArray(events) ? events : [];
  const eventCounts = {};
  const sourceKindCounts = {};
  const errorCounts = {};
  const sessions = new Set();
  const timestamps = [];

  for (const event of safeEvents) {
    const type = String(event?.type || "unknown").replace(/[^a-z0-9_-]/gi, "").slice(0, 80) || "unknown";
    eventCounts[type] = (eventCounts[type] || 0) + 1;
    if (event?.sessionId) sessions.add(String(event.sessionId));
    if (typeof event?.timestamp === "string" && !Number.isNaN(Date.parse(event.timestamp))) timestamps.push(event.timestamp);

    if (type === "media_source_loaded") {
      const sourceKind = ["local-file", "direct-url", "youtube"].includes(event.sourceKind) ? event.sourceKind : "other";
      sourceKindCounts[sourceKind] = (sourceKindCounts[sourceKind] || 0) + 1;
    }
    if (type.endsWith("_error") || type.endsWith("_failed") || type === "media_provider_error") {
      const provider = String(event.provider || "app").replace(/[^a-z0-9_-]/gi, "").slice(0, 40) || "app";
      const kind = String(event.kind || event.code || "unknown").replace(/[^a-z0-9_-]/gi, "").slice(0, 60) || "unknown";
      const key = `${provider}:${kind}`;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    }
  }

  timestamps.sort();
  return {
    reportFormat: "passato-prossimo-testing-report-v1",
    generatedAt: new Date().toISOString(),
    privacy: {
      sanitized: true,
      excludes: ["reading text", "book titles", "clicked words", "URLs", "video IDs", "device identifiers"]
    },
    environment: {
      appVersion: String(environment.appVersion || packageMetadata.version),
      platform: String(environment.platform || process.platform),
      architecture: String(environment.architecture || process.arch),
      osRelease: String(environment.osRelease || os.release()),
      electronVersion: String(environment.electronVersion || process.versions.electron || "unknown")
    },
    usage: {
      recordedEvents: safeEvents.length,
      recordedSessions: sessions.size,
      firstRecordedAt: timestamps[0] || null,
      lastRecordedAt: timestamps.at(-1) || null,
      eventCounts,
      sourceKindCounts,
      errorCounts
    }
  };
}

async function exportTestingReport() {
  await ensureDataFiles();
  const events = JSON.parse(await fs.readFile(logPath(), "utf8"));
  const report = buildTestingReport(events);
  const date = new Date().toISOString().slice(0, 10);
  const result = await dialog.showSaveDialog({
    title: "Export sanitized testing report",
    defaultPath: path.join(app.getPath("documents"), `Passato-Prossimo-testing-report-${date}.json`),
    filters: [{ name: "JSON report", extensions: ["json"] }]
  });
  if (result.canceled || !result.filePath) return { ok: false, canceled: true };
  await fs.writeFile(result.filePath, JSON.stringify(report, null, 2), "utf8");
  return { ok: true, eventCount: report.usage.recordedEvents, sessionCount: report.usage.recordedSessions };
}

async function saveTopWords(payload) {
  await ensureDataFiles();
  await fs.writeFile(wordsPath(), JSON.stringify(payload, null, 2), "utf8");
}

async function loadCustomBooks() {
  await ensureDataFiles();
  const books = JSON.parse(await fs.readFile(customBooksPath(), "utf8"));
  const normalized = await normalizeStoredBooks(books);
  if (normalized.changed) {
    await fs.writeFile(customBooksPath(), JSON.stringify(normalized.books, null, 2), "utf8");
  }
  return normalized.books;
}

async function saveCustomBooks(payload) {
  await ensureDataFiles();
  await fs.writeFile(customBooksPath(), JSON.stringify(payload, null, 2), "utf8");
}

async function normalizeStoredBooks(books) {
  let changed = false;
  const normalizedBooks = [];

  for (const book of books) {
    if (!book.chapters && !book.text) {
      normalizedBooks.push(book);
      continue;
    }

    const id = book.id || `local-${Date.now()}-${normalizedBooks.length}`;
    const chapters =
      Array.isArray(book.chapters) && book.chapters.length > 0
        ? book.chapters
        : [{ title: book.title, text: book.text || "" }];
    await saveBookContent(id, chapters);
    normalizedBooks.push(metadataForBook({ ...book, id, chapters }));
    changed = true;
  }

  return { books: normalizedBooks, changed };
}

async function appendImportLog(event) {
  await ensureDataFiles();
  const existing = JSON.parse(await fs.readFile(importLogPath(), "utf8"));
  existing.push({
    ...event,
    timestamp: new Date().toISOString()
  });
  await fs.writeFile(importLogPath(), JSON.stringify(existing.slice(-80), null, 2), "utf8");
}

async function loadImportLog() {
  await ensureDataFiles();
  return JSON.parse(await fs.readFile(importLogPath(), "utf8"));
}

async function importBookFromFile() {
  try {
    await appendImportLog({ stage: "picker_opened" });
    const result = await dialog.showOpenDialog({
      title: "Import a book",
      properties: ["openFile"],
      filters: [
        { name: "Books", extensions: ["txt", "epub"] },
        { name: "Text", extensions: ["txt"] },
        { name: "EPUB", extensions: ["epub"] }
      ]
    });

    if (result.canceled || !result.filePaths[0]) {
      await appendImportLog({ stage: "picker_canceled" });
      return null;
    }

    const filePath = result.filePaths[0];
    const extension = path.extname(filePath).toLowerCase();
    await appendImportLog({
      stage: "file_selected",
      filename: path.basename(filePath),
      extension
    });

    if (extension === ".epub") {
      const book = await importEpub(filePath);
      const metadata = await saveImportedBook(book, path.basename(filePath));
      await appendImportLog({
        stage: "import_success",
        filename: path.basename(filePath),
        format: "epub",
        chapterCount: book.chapters.length,
        characterCount: book.text.length
      });
      return { ok: true, book: metadata };
    }

    const book = await importText(filePath);
    const metadata = await saveImportedBook(book, path.basename(filePath));
    await appendImportLog({
      stage: "import_success",
      filename: path.basename(filePath),
      format: "txt",
      characterCount: book.text.length
    });
    return { ok: true, book: metadata };
  } catch (error) {
    await appendImportLog({
      stage: "import_failed",
      error: error.message || "The book could not be imported.",
      stack: error.stack || ""
    });
    return {
      ok: false,
      error: error.message || "The book could not be imported."
    };
  }
}

async function previewBookFromUrl(rawUrl) {
  let parsedUrl;
  try {
    parsedUrl = normalizeRemoteUrl(rawUrl);
    await appendImportLog({
      stage: "url_preview_started",
      host: parsedUrl.hostname
    });

    const response = await fetchPublicPage(parsedUrl);
    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml") && !contentType.includes("text/plain")) {
      throw new Error(`This URL returned ${contentType || "an unsupported file type"}, not a readable web page.`);
    }

    const sourceText = await readLimitedResponseText(response, maximumRemoteBytes);
    const finalUrl = normalizeRemoteUrl(response.url || parsedUrl.toString());
    const extracted = contentType.includes("text/plain")
      ? extractPlainWebText(sourceText, finalUrl)
      : extractReadableWebPage(sourceText, finalUrl);
    if (extracted.text.length > maximumUrlTextCharacters) {
      throw new Error("This page is too large for the URL preview. Save it as a text file and use the book importer instead.");
    }

    const token = crypto.randomBytes(18).toString("hex");
    const preview = {
      token,
      title: extracted.title,
      author: extracted.author,
      sourceUrl: finalUrl.toString(),
      hostname: finalUrl.hostname,
      text: extracted.text,
      characterCount: extracted.text.length,
      wordCount: countWebWords(extracted.text),
      italianSignal: extracted.italianSignal,
      extractionConfidence: extractionConfidenceFor(extracted.text, extracted.italianSignal),
      excerpt: extracted.text.slice(0, 900).trim()
    };
    pendingUrlPreviews.set(token, preview);
    trimPendingUrlPreviews();
    await appendImportLog({
      stage: "url_preview_ready",
      host: finalUrl.hostname,
      characterCount: extracted.text.length,
      italianSignal: extracted.italianSignal
    });
    return { ok: true, preview };
  } catch (error) {
    await appendImportLog({
      stage: "url_preview_failed",
      host: parsedUrl?.hostname || "invalid-url",
      error: error.message || "The page could not be imported."
    });
    return { ok: false, error: error.message || "The page could not be imported." };
  }
}

async function saveUrlPreview(payload) {
  try {
    const token = String(payload?.token || "");
    const pending = pendingUrlPreviews.get(token);
    if (!pending) throw new Error("This URL preview expired. Preview the page again.");

    const title = cleanWebLine(payload?.title || pending.title).slice(0, 200);
    const author = cleanWebLine(payload?.author || pending.author).slice(0, 160);
    const text = cleanText(String(payload?.text || pending.text));
    if (!title) throw new Error("Add a title before saving this page.");
    if (text.length < 100) throw new Error("Keep at least 100 readable characters before saving.");
    if (text.length > maximumUrlTextCharacters) throw new Error("The edited page is too large to save through the URL Door.");

    const finalUrl = normalizeRemoteUrl(pending.sourceUrl);
    const italianSignal = estimateItalianSignal(text);
    const id = `url-${crypto.createHash("sha256").update(finalUrl.toString()).digest("hex").slice(0, 16)}`;
    const book = {
      id,
      title,
      author: author || finalUrl.hostname,
      source: `Imported URL / ${finalUrl.hostname}`,
      language: "Italian",
      rights: "External page imported locally by the user; rights remain with the source.",
      sourceUrl: finalUrl.toString(),
      importedAt: new Date().toISOString(),
      note: `${Math.max(1, Math.round(text.length / 1000))}k characters / Italian signal: ${italianSignal}.`,
      chapters: [{ title, text }],
      text
    };
    const metadata = await saveImportedBook(book, "");
    pendingUrlPreviews.delete(token);
    await appendImportLog({
      stage: "url_import_success",
      id,
      host: finalUrl.hostname,
      characterCount: text.length,
      italianSignal
    });
    return { ok: true, book: metadata };
  } catch (error) {
    await appendImportLog({
      stage: "url_import_failed",
      error: error.message || "The preview could not be saved."
    });
    return { ok: false, error: error.message || "The preview could not be saved." };
  }
}

async function importBookFromUrl(rawUrl) {
  const previewResult = await previewBookFromUrl(rawUrl);
  if (!previewResult.ok) return previewResult;
  return saveUrlPreview({ token: previewResult.preview.token });
}

function countWebWords(text) {
  return (String(text || "").match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)?/gu) || []).length;
}

function extractionConfidenceFor(text, italianSignal) {
  if (italianSignal === "strong" && text.length >= 1000) return "high";
  if ((italianSignal === "strong" || italianSignal === "possible") && text.length >= 500) return "medium";
  return "review";
}

function trimPendingUrlPreviews() {
  while (pendingUrlPreviews.size > 6) {
    pendingUrlPreviews.delete(pendingUrlPreviews.keys().next().value);
  }
}

function normalizeRemoteUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(String(rawUrl || "").trim());
  } catch {
    throw new Error("Enter a complete public http or https URL.");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only public http and https URLs can be imported.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("URLs containing usernames or passwords are not supported.");
  }
  parsed.hash = "";
  return parsed;
}

async function assertPublicRemoteUrl(url) {
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Local and private-network addresses cannot be imported.");
  }

  const directIpVersion = net.isIP(hostname);
  const addresses = directIpVersion
    ? [{ address: hostname, family: directIpVersion }]
    : await dns.lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Local and private-network addresses cannot be imported.");
  }
}

function isPrivateAddress(address) {
  const value = String(address || "").toLowerCase();
  if (net.isIPv4(value)) {
    const [a, b] = value.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224;
  }
  if (net.isIPv6(value)) {
    if (value === "::" || value === "::1" || value.startsWith("fc") || value.startsWith("fd")) return true;
    if (/^fe[89ab]/.test(value)) return true;
    const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
    return mapped ? isPrivateAddress(mapped) : false;
  }
  return true;
}

async function fetchPublicPage(startUrl) {
  let currentUrl = startUrl;
  for (let redirectCount = 0; redirectCount <= maximumRedirects; redirectCount += 1) {
    await assertPublicRemoteUrl(currentUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response;
    try {
      response = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "Accept": "text/html,application/xhtml+xml,text/plain;q=0.8",
          "User-Agent": "The-Immersion-Project/0.4 (local reading prototype)"
        }
      });
    } catch (error) {
      if (error.name === "AbortError") throw new Error("The page took too long to respond.");
      throw new Error(`The page could not be reached: ${error.message}`);
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new Error("The page redirected without providing a destination.");
      if (redirectCount === maximumRedirects) throw new Error("The page redirected too many times.");
      currentUrl = normalizeRemoteUrl(new URL(location, currentUrl).toString());
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`The website returned HTTP ${response.status}.`);
    }
    return response;
  }
  throw new Error("The page redirected too many times.");
}

async function readLimitedResponseText(response, limit) {
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > limit) throw new Error("This page is too large for the URL prototype.");

  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new Error("This page is too large for the URL prototype.");
    }
    chunks.push(value);
  }

  const encoding = response.headers.get("content-type")?.match(/charset=([^;\s]+)/i)?.[1]?.replace(/["']/g, "") || "utf-8";
  let decoder;
  try {
    decoder = new TextDecoder(encoding);
  } catch {
    decoder = new TextDecoder("utf-8");
  }
  const bytes = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
  return decoder.decode(bytes);
}

function extractReadableWebPage(html, sourceUrl) {
  const $ = cheerio.load(html);
  $("script, style, noscript, nav, footer, header, aside, form, dialog, svg, canvas, iframe, template").remove();

  const title = cleanWebLine(
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("h1").first().text() ||
    $("title").text() ||
    sourceUrl.hostname
  );
  const author = cleanWebLine(
    $('meta[name="author"]').attr("content") ||
    $('meta[property="article:author"]').attr("content") ||
    $('[rel="author"]').first().text() ||
    sourceUrl.hostname
  );
  const candidateSelectors = [
    "article",
    "main",
    '[role="main"]',
    ".article-body",
    ".article-content",
    ".post-content",
    ".entry-content",
    ".story-body",
    "body"
  ];
  let best = null;
  for (const selector of candidateSelectors) {
    $(selector).each((_index, element) => {
      const candidate = $(element);
      const textLength = cleanWebLine(candidate.text()).length;
      const paragraphCount = candidate.find("p").length;
      const linkLength = cleanWebLine(candidate.find("a").text()).length;
      const score = textLength + paragraphCount * 140 - Math.min(linkLength, textLength) * 0.45;
      if (!best || score > best.score) best = { candidate, score };
    });
    if (best && best.score > 1800 && selector !== "body") break;
  }

  if (!best) throw new Error("The page opened, but no readable text container was found.");
  const blocks = [];
  best.candidate.find("h1, h2, h3, p, blockquote, li, pre").each((_index, element) => {
    const line = cleanWebLine($(element).text());
    if (line.length >= 2 && line !== blocks[blocks.length - 1]) blocks.push(line);
  });
  let text = cleanText(blocks.join("\n\n"));
  if (text.length < 300) text = cleanText(best.candidate.text());
  if (text.length < 300) throw new Error("The page opened, but it did not expose enough readable text.");

  return { title, author, text, italianSignal: estimateItalianSignal(text) };
}

function extractPlainWebText(value, sourceUrl) {
  const text = cleanText(value);
  if (text.length < 100) throw new Error("The text page is too short to import.");
  const firstLine = text.split("\n").find(Boolean) || sourceUrl.hostname;
  return {
    title: cleanWebLine(firstLine).slice(0, 120),
    author: sourceUrl.hostname,
    text,
    italianSignal: estimateItalianSignal(text)
  };
}

function cleanWebLine(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function estimateItalianSignal(text) {
  const sample = String(text || "").toLowerCase().slice(0, 50000);
  const tokens = sample.match(/[a-zàèéìòù]+/g) || [];
  if (!tokens.length) return "uncertain";
  const markers = new Set(["il", "lo", "la", "gli", "le", "di", "del", "della", "che", "non", "per", "con", "una", "sono", "come", "anche", "questo", "questa"]);
  const hits = tokens.reduce((total, token) => total + Number(markers.has(token)), 0);
  const ratio = hits / Math.min(tokens.length, 3000);
  return ratio >= 0.055 ? "strong" : ratio >= 0.025 ? "possible" : "uncertain";
}

async function saveImportedBook(book, filename) {
  const id = book.id || `local-${Date.now()}`;
  await saveBookContent(id, book.chapters);
  const metadata = metadataForBook({ ...book, id, originalFilename: filename });
  const books = await loadCustomBooks();
  const nextBooks = [metadata, ...books.filter((existing) => existing.id !== id && (!book.sourceUrl || existing.sourceUrl !== book.sourceUrl))];
  await fs.writeFile(customBooksPath(), JSON.stringify(nextBooks, null, 2), "utf8");
  await appendImportLog({
    stage: "metadata_saved",
    id,
    title: metadata.title,
    characterCount: metadata.characterCount,
    largeBook: metadata.largeBook
  });
  return metadata;
}

async function saveBookContent(id, chapters) {
  await fs.writeFile(
    bookContentPath(id),
    JSON.stringify({ id, chapters }, null, 2),
    "utf8"
  );
}

function metadataForBook(book) {
  const chapters =
    Array.isArray(book.chapters) && book.chapters.length > 0
      ? book.chapters
      : [{ title: book.title, text: book.text || "" }];
  const characterCount = chapters.reduce(
    (total, chapter) => total + (chapter.text?.length || 0),
    0
  );
  const chapterSummaries = chapters.map((chapter, index) => ({
    title: chapter.title || `Chapter ${index + 1}`,
    characterCount: chapter.text?.length || 0,
    sectionCount: splitTextIntoSections(chapter.text || "").length
  }));

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    source: book.source,
    language: book.language || "Italian",
    rights: book.rights || "User imported book",
    sourceUrl: book.sourceUrl || "",
    importedAt: book.importedAt || "",
    note:
      book.note ||
      `${Math.max(1, Math.round(characterCount / 1000))}k characters, saved locally.`,
    importedContent: true,
    largeBook: characterCount > largeBookThreshold,
    characterCount,
    chapterSummaries,
    originalFilename: book.originalFilename || ""
  };
}

async function loadBookSection({ bookId, chapterIndex = 0, sectionIndex = 0 }) {
  await ensureDataFiles();
  const content = JSON.parse(await fs.readFile(bookContentPath(bookId), "utf8"));
  const chapter = content.chapters[chapterIndex] || content.chapters[0];
  const sections = splitTextIntoSections(chapter.text || "");
  const safeSectionIndex = Math.max(0, Math.min(sectionIndex, sections.length - 1));
  await appendImportLog({
    stage: "section_loaded",
    bookId,
    chapterIndex,
    sectionIndex: safeSectionIndex + 1,
    sectionCount: sections.length,
    characterCount: sections[safeSectionIndex]?.length || 0
  });
  return {
    chapterIndex,
    sectionIndex: safeSectionIndex,
    chapterTitle: chapter.title || `Chapter ${chapterIndex + 1}`,
    sectionText: sections[safeSectionIndex] || "",
    sectionCount: sections.length,
    sectionNumber: safeSectionIndex + 1,
    characterCount: sections[safeSectionIndex]?.length || 0
  };
}

function bookContentPath(id) {
  return path.join(importedBooksDir(), `${id}.json`);
}

function splitTextIntoSections(text) {
  if (!text) return [""];
  if (text.length <= sectionSize) return [text];

  const sections = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + sectionSize, text.length);
    if (end < text.length) {
      const paragraphBreak = text.lastIndexOf("\n\n", end);
      const sentenceBreak = Math.max(
        text.lastIndexOf(". ", end),
        text.lastIndexOf("? ", end),
        text.lastIndexOf("! ", end)
      );
      const bestBreak = Math.max(paragraphBreak, sentenceBreak);
      if (bestBreak > start + sectionSize * 0.55) {
        end = bestBreak + 1;
      }
    }

    sections.push(text.slice(start, end).trim());
    start = end;
  }

  return sections.filter(Boolean);
}

async function importText(filePath) {
  const text = cleanText(await fs.readFile(filePath, "utf8"));
  const title = titleFromFilename(filePath);
  return {
    title,
    author: "Unknown",
    source: "Imported TXT",
    language: "Italian",
    rights: "User imported text",
    sourceUrl: "",
    note: `${Math.max(1, Math.round(text.length / 1000))}k characters, saved locally.`,
    chapters: [{ title, text }],
    text
  };
}

async function importEpub(filePath) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "immersion-epub-"));
  try {
    await appendImportLog({ stage: "epub_extract_started", filename: path.basename(filePath) });
    await extractEpubSafely(filePath, tempDir);
    await appendImportLog({ stage: "epub_extract_finished" });

    const container = await fs.readFile(
      path.join(tempDir, "META-INF", "container.xml"),
      "utf8"
    );
    const opfRelativePath = decodeXmlAttribute(
      matchAttribute(container, /<rootfile\b[^>]*\bfull-path=["']([^"']+)["']/i)
    );
    if (!opfRelativePath) {
      throw new Error("This EPUB does not contain a readable package file.");
    }
    await appendImportLog({ stage: "epub_package_found", packagePath: opfRelativePath });

    const opfPath = safeJoin(tempDir, tempDir, opfRelativePath);
    const opfDir = path.dirname(opfPath);
    const opf = await fs.readFile(opfPath, "utf8");
    const title = decodeHtml(matchText(opf, /<dc:title\b[^>]*>([\s\S]*?)<\/dc:title>/i)) ||
      titleFromFilename(filePath);
    const author =
      decodeHtml(matchText(opf, /<dc:creator\b[^>]*>([\s\S]*?)<\/dc:creator>/i)) ||
      "Unknown";

    const manifest = parseManifest(opf);
    const spineIds = [...opf.matchAll(/<itemref\b[^>]*\bidref=["']([^"']+)["'][^>]*>/gi)].map(
      (match) => match[1]
    );
    const readableItems = spineIds
      .map((id) => manifest.get(id))
      .filter((item) => item && /x?html/i.test(item.mediaType));
    await appendImportLog({
      stage: "epub_manifest_read",
      manifestCount: manifest.size,
      spineCount: spineIds.length,
      readableCount: readableItems.length
    });

    if (readableItems.length === 0) {
      throw new Error("This EPUB does not contain readable text chapters.");
    }

    const chapters = [];
    for (const item of readableItems) {
      const chapterPath = safeJoin(tempDir, opfDir, item.href);
      const html = await fs.readFile(chapterPath, "utf8");
      const text = htmlToText(html);
      if (text.length > 0) {
        chapters.push({
          title: chapterTitle(html) || item.title || `Chapter ${chapters.length + 1}`,
          text
        });
      }
    }

    const text = chapters.map((chapter) => chapter.text).join("\n\n");
    await appendImportLog({
      stage: "epub_chapters_extracted",
      chapterCount: chapters.length,
      characterCount: text.length
    });
    if (!text) {
      throw new Error("This EPUB opened, but no readable chapter text was found.");
    }

    return {
      title,
      author,
      source: "Imported EPUB",
      language: "Italian",
      rights: "User imported EPUB",
      sourceUrl: "",
      note: `${chapters.length} chapters, saved locally.`,
      chapters,
      text
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

function validateEpubEntryPath(entryName) {
  const normalized = String(entryName || "").replace(/\\/g, "/");
  const segments = normalized.split("/");
  if (!normalized || normalized.includes("\0") || normalized.startsWith("/") || /^[a-z]:/i.test(normalized)) {
    throw new Error("This EPUB contains an unsafe archive path.");
  }
  if (segments.some((segment) => segment === ".." || segment === ".")) {
    throw new Error("This EPUB contains an unsafe archive path.");
  }
  return normalized;
}

function assertSafeEpubEntryType(entry, isDirectory) {
  const unixMode = (entry.externalFileAttributes >>> 16) & 0xffff;
  const fileType = unixMode & 0o170000;
  if (fileType === 0o120000) throw new Error("This EPUB contains a symbolic link, which is not supported.");
  if (fileType && fileType !== 0o100000 && !(isDirectory && fileType === 0o040000)) {
    throw new Error("This EPUB contains an unsupported archive entry type.");
  }
}

function openZipArchive(filePath) {
  return new Promise((resolve, reject) => {
    yauzl.open(filePath, {
      lazyEntries: true,
      strictFileNames: true,
      validateEntrySizes: true
    }, (error, archive) => error ? reject(error) : resolve(archive));
  });
}

function openZipEntryStream(archive, entry) {
  return new Promise((resolve, reject) => {
    archive.openReadStream(entry, (error, stream) => error ? reject(error) : resolve(stream));
  });
}

async function extractEpubSafely(filePath, destinationDir) {
  const archive = await openZipArchive(filePath);
  let entryCount = 0;
  let declaredBytes = 0;
  let extractedBytes = 0;

  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      try {
        archive.close();
      } catch {
      }
      reject(error);
    };

    archive.on("error", fail);
    archive.on("end", () => {
      if (settled) return;
      settled = true;
      resolve();
    });
    archive.on("entry", (entry) => {
      (async () => {
        entryCount += 1;
        if (entryCount > maximumEpubEntries) throw new Error("This EPUB contains too many files for the prototype importer.");
        const entryName = validateEpubEntryPath(entry.fileName);
        const isDirectory = entryName.endsWith("/");
        assertSafeEpubEntryType(entry, isDirectory);
        if (entry.uncompressedSize > maximumEpubEntryBytes) throw new Error("This EPUB contains an individual file that is too large.");
        declaredBytes += entry.uncompressedSize;
        if (declaredBytes > maximumEpubExtractedBytes) throw new Error("This EPUB expands beyond the prototype import limit.");

        const targetPath = safeJoin(destinationDir, destinationDir, entryName);
        if (isDirectory) {
          await fs.mkdir(targetPath, { recursive: true });
          return;
        }

        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        const input = await openZipEntryStream(archive, entry);
        const sizeGuard = new Transform({
          transform(chunk, _encoding, callback) {
            extractedBytes += chunk.length;
            if (extractedBytes > maximumEpubExtractedBytes) {
              callback(new Error("This EPUB expands beyond the prototype import limit."));
              return;
            }
            callback(null, chunk);
          }
        });
        await pipeline(input, sizeGuard, fsSync.createWriteStream(targetPath, { flags: "wx" }));
      })().then(() => archive.readEntry()).catch(fail);
    });
    archive.readEntry();
  });
}

function parseManifest(opf) {
  const manifest = new Map();
  for (const match of opf.matchAll(/<item\b([^>]+)>/gi)) {
    const attrs = match[1];
    const id = decodeXmlAttribute(matchAttribute(attrs, /\bid=["']([^"']+)["']/i));
    const href = decodeXmlAttribute(matchAttribute(attrs, /\bhref=["']([^"']+)["']/i));
    const mediaType = decodeXmlAttribute(
      matchAttribute(attrs, /\bmedia-type=["']([^"']+)["']/i)
    );
    if (id && href) {
      manifest.set(id, {
        href: safeDecodeUri(href).replace(/\//g, path.sep),
        mediaType
      });
    }
  }
  return manifest;
}

function htmlToText(html) {
  return cleanText(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, "")
      .replace(/<\/(h[1-6]|p|div|section|article|li|blockquote)>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\u00a0/g, " ")
      .split("\n")
      .map((line) => decodeHtml(line).trim())
      .filter(Boolean)
      .join("\n\n")
  );
}

function chapterTitle(html) {
  return (
    decodeHtml(matchText(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i)) ||
    decodeHtml(matchText(html, /<h2\b[^>]*>([\s\S]*?)<\/h2>/i)) ||
    ""
  )
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchText(value, pattern) {
  return value.match(pattern)?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";
}

function matchAttribute(value, pattern) {
  return value.match(pattern)?.[1] || "";
}

function decodeXmlAttribute(value) {
  return decodeHtml(value).trim();
}

function decodeHtml(value) {
  return String(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([a-f0-9]+);/gi, (_match, code) =>
      String.fromCodePoint(parseInt(code, 16))
    );
}

function cleanText(text) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function titleFromFilename(filePath) {
  return path.basename(filePath, path.extname(filePath)).replace(/[_-]+/g, " ").trim();
}

function safeDecodeUri(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function safeJoin(rootPath, basePath, targetPath) {
  if (!targetPath) {
    return path.resolve(rootPath, basePath);
  }

  const resolvedRoot = path.resolve(rootPath);
  const resolvedTarget = path.resolve(basePath, safeDecodeUri(targetPath));
  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error("This EPUB contains an unsafe file path.");
  }
  return resolvedTarget;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 820,
    minHeight: 560,
    backgroundColor: "#111111",
    title: "The Immersion Project",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  installContextMenu(win);
  win.loadFile(path.join(__dirname, "..", "prototype-0.5-media-shell", "index.html"));
}

function installContextMenu(win) {
  win.webContents.on("context-menu", (_event, params) => {
    Menu.buildFromTemplate(buildContextMenuTemplate(params)).popup({ window: win });
  });
}

function buildContextMenuTemplate(params) {
  const editFlags = params.editFlags || {};
  return params.isEditable
    ? [
        { label: "Undo", role: "undo", enabled: Boolean(editFlags.canUndo) },
        { label: "Redo", role: "redo", enabled: Boolean(editFlags.canRedo) },
        { type: "separator" },
        { label: "Cut", role: "cut", enabled: Boolean(editFlags.canCut) },
        { label: "Copy", role: "copy", enabled: Boolean(editFlags.canCopy) },
        { label: "Paste", role: "paste", enabled: Boolean(editFlags.canPaste) },
        { label: "Delete", role: "delete", enabled: Boolean(editFlags.canDelete) },
        { type: "separator" },
        { label: "Select all", role: "selectAll", enabled: Boolean(editFlags.canSelectAll) }
      ]
    : [
        { label: "Copy", role: "copy", enabled: Boolean(params.selectionText) },
        { label: "Select all", role: "selectAll" }
      ];
}

module.exports = {
  buildContextMenuTemplate,
  desktopAppId,
  youtubeClientReferer,
  youtubeEmbedRequestFilter,
  youtubeIdentityHeaders,
  installYouTubeClientIdentity,
  buildTestingReport,
  validateEpubEntryPath,
  assertSafeEpubEntryType,
  extractEpubSafely
};

app.whenReady().then(async () => {
  app.setAppUserModelId?.(desktopAppId);
  installYouTubeClientIdentity(session.defaultSession);
  await ensureDataFiles();
  await appendInteraction({ type: "app_started" });
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("log-interaction", async (_event, payload) => {
  await appendInteraction(payload);
  return { ok: true };
});

ipcMain.handle("save-top-words", async (_event, payload) => {
  await saveTopWords(payload);
  return { ok: true };
});

ipcMain.handle("load-custom-books", async () => loadCustomBooks());

ipcMain.handle("save-custom-books", async (_event, payload) => {
  await saveCustomBooks(payload);
  return { ok: true };
});

ipcMain.handle("import-book-from-file", async () => importBookFromFile());

ipcMain.handle("import-book-from-url", async (_event, url) => importBookFromUrl(url));

ipcMain.handle("preview-book-from-url", async (_event, url) => previewBookFromUrl(url));

ipcMain.handle("save-url-preview", async (_event, payload) => saveUrlPreview(payload));

ipcMain.handle("load-book-section", async (_event, payload) => loadBookSection(payload));

ipcMain.handle("load-import-log", async () => loadImportLog());

ipcMain.handle("append-import-log", async (_event, payload) => {
  await appendImportLog(payload);
  return { ok: true };
});

ipcMain.handle("export-testing-report", async () => exportTestingReport());

ipcMain.handle("open-external", async (_event, url) => {
  const parsed = new URL(url);
  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new Error("Unsupported link");
  }
  await shell.openExternal(parsed.toString());
  return { ok: true };
});
