(function initializeMobileLibrary(global) {
  const databaseName = "passato-prossimo-mobile-v1";
  const databaseVersion = 1;
  const maximumTextBytes = 10 * 1024 * 1024;
  const maximumEpubBytes = 30 * 1024 * 1024;
  const maximumEpubEntries = 5000;
  const maximumTextEntryBytes = 12 * 1024 * 1024;
  const maximumExtractedTextBytes = 80 * 1024 * 1024;
  const largeBookThreshold = 150000;
  const sectionSize = 10000;

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.addEventListener("success", () => resolve(request.result), { once: true });
      request.addEventListener("error", () => reject(request.error || new Error("Mobile storage request failed.")), { once: true });
    });
  }

  function transactionFinished(transaction) {
    return new Promise((resolve, reject) => {
      transaction.addEventListener("complete", resolve, { once: true });
      transaction.addEventListener("abort", () => reject(transaction.error || new Error("Mobile storage transaction was canceled.")), { once: true });
      transaction.addEventListener("error", () => reject(transaction.error || new Error("Mobile storage transaction failed.")), { once: true });
    });
  }

  function openDatabase() {
    if (!global.indexedDB) {
      return Promise.reject(new Error("This browser does not provide the book storage needed by the mobile importer."));
    }
    return new Promise((resolve, reject) => {
      const request = global.indexedDB.open(databaseName, databaseVersion);
      request.addEventListener("upgradeneeded", () => {
        const database = request.result;
        if (!database.objectStoreNames.contains("books")) {
          database.createObjectStore("books", { keyPath: "id" });
        }
        if (!database.objectStoreNames.contains("contents")) {
          database.createObjectStore("contents", { keyPath: "id" });
        }
      });
      request.addEventListener("success", () => resolve(request.result), { once: true });
      request.addEventListener("error", () => reject(request.error || new Error("The mobile book library could not open.")), { once: true });
    });
  }

  async function saveBook(metadata, chapters) {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(["books", "contents"], "readwrite");
      transaction.objectStore("books").put(metadata);
      transaction.objectStore("contents").put({ id: metadata.id, chapters });
      await transactionFinished(transaction);
    } finally {
      database.close();
    }
  }

  async function loadBooks() {
    const database = await openDatabase();
    try {
      const transaction = database.transaction("books", "readonly");
      const books = await requestResult(transaction.objectStore("books").getAll());
      await transactionFinished(transaction);
      return books.sort((a, b) => String(b.importedAt || "").localeCompare(String(a.importedAt || "")));
    } finally {
      database.close();
    }
  }

  async function loadSection({ bookId, chapterIndex = 0, sectionIndex = 0 }) {
    const database = await openDatabase();
    try {
      const transaction = database.transaction("contents", "readonly");
      const content = await requestResult(transaction.objectStore("contents").get(bookId));
      await transactionFinished(transaction);
      if (!content?.chapters?.length) throw new Error("This mobile book no longer has readable content.");
      const chapter = content.chapters[chapterIndex] || content.chapters[0];
      const sections = splitTextIntoSections(chapter.text || "");
      const safeSectionIndex = Math.max(0, Math.min(sectionIndex, sections.length - 1));
      return {
        chapterIndex,
        sectionIndex: safeSectionIndex,
        chapterTitle: chapter.title || `Chapter ${chapterIndex + 1}`,
        sectionText: sections[safeSectionIndex] || "",
        sectionCount: sections.length,
        sectionNumber: safeSectionIndex + 1,
        characterCount: sections[safeSectionIndex]?.length || 0
      };
    } finally {
      database.close();
    }
  }

  function chooseBookFile() {
    return new Promise((resolve) => {
      const input = global.document.createElement("input");
      input.type = "file";
      input.accept = ".txt,.epub,text/plain,application/epub+zip";
      input.hidden = true;
      const finish = (file) => {
        input.remove();
        resolve(file || null);
      };
      input.addEventListener("change", () => finish(input.files?.[0]), { once: true });
      input.addEventListener("cancel", () => finish(null), { once: true });
      global.document.body.append(input);
      input.click();
    });
  }

  async function importBookFromFile() {
    const file = await chooseBookFile();
    if (!file) return null;
    try {
      const extension = file.name.toLowerCase().split(".").pop();
      let parsed;
      if (extension === "txt") parsed = await parseTextFile(file);
      else if (extension === "epub") parsed = await parseEpubFile(file);
      else throw new Error("Choose a TXT or EPUB book.");

      const metadata = metadataForBook(parsed, file.name);
      await saveBook(metadata, parsed.chapters);
      return { ok: true, book: metadata };
    } catch (error) {
      return { ok: false, error: error?.message || "That book could not be imported on this phone." };
    }
  }

  async function parseTextFile(file) {
    if (file.size > maximumTextBytes) {
      throw new Error("This TXT file is larger than the current 10 MB mobile import limit.");
    }
    const text = cleanText(await file.text());
    if (!text) throw new Error("This TXT file does not contain readable text.");
    const title = titleFromFilename(file.name);
    return {
      title,
      author: "Unknown",
      source: "Mobile TXT import",
      rights: "User imported text",
      chapters: [{ title, text }]
    };
  }

  async function parseEpubFile(file) {
    if (file.size > maximumEpubBytes) {
      throw new Error("This EPUB is larger than the current 30 MB mobile import limit.");
    }
    return parseEpubBytes(new Uint8Array(await file.arrayBuffer()), file.name);
  }

  async function unzipReadableEntries(bytes) {
    if (!global.fflate?.unzip) throw new Error("The mobile EPUB reader did not load correctly.");
    return new Promise((resolve, reject) => {
      let entryCount = 0;
      let declaredTextBytes = 0;
      let rejectedReason = "";
      global.fflate.unzip(bytes, {
        filter(entry) {
          entryCount += 1;
          if (entryCount > maximumEpubEntries) {
            rejectedReason = "This EPUB contains too many files for the mobile importer.";
            return false;
          }
          const name = String(entry.name || "").replace(/\\/g, "/");
          const readable = /(?:^|\/)container\.xml$/i.test(name) || /\.(?:opf|xml|xhtml?|html?)$/i.test(name);
          if (!readable) return false;
          const originalSize = Number(entry.originalSize || 0);
          if (originalSize > maximumTextEntryBytes) {
            rejectedReason = "This EPUB contains a text file that is too large for the mobile importer.";
            return false;
          }
          declaredTextBytes += originalSize;
          if (declaredTextBytes > maximumExtractedTextBytes) {
            rejectedReason = "This EPUB expands beyond the mobile text limit.";
            return false;
          }
          return true;
        }
      }, (error, entries) => {
        if (error) reject(error);
        else if (rejectedReason) reject(new Error(rejectedReason));
        else resolve(entries || {});
      });
    });
  }

  async function parseEpubBytes(bytes, filename = "Imported book.epub") {
    const rawEntries = await unzipReadableEntries(bytes);
    const entries = new Map();
    let extractedBytes = 0;
    for (const [rawName, value] of Object.entries(rawEntries)) {
      const name = normalizeZipPath("", rawName);
      extractedBytes += value.byteLength;
      if (extractedBytes > maximumExtractedTextBytes) {
        throw new Error("This EPUB expands beyond the mobile text limit.");
      }
      entries.set(name.toLowerCase(), { name, value });
    }

    const containerEntry = entries.get("meta-inf/container.xml");
    if (!containerEntry) throw new Error("This EPUB does not contain a readable package location.");
    const container = decodeBytes(containerEntry.value);
    const packagePath = decodeXmlAttribute(matchAttribute(container, /<rootfile\b[^>]*\bfull-path=["']([^"']+)["']/i));
    if (!packagePath) throw new Error("This EPUB does not identify its package file.");

    const normalizedPackagePath = normalizeZipPath("", packagePath);
    const packageEntry = entries.get(normalizedPackagePath.toLowerCase());
    if (!packageEntry) throw new Error("This EPUB package file could not be opened.");
    const opf = decodeBytes(packageEntry.value);
    const packageDirectory = normalizedPackagePath.includes("/")
      ? normalizedPackagePath.slice(0, normalizedPackagePath.lastIndexOf("/"))
      : "";
    const title = decodeHtml(matchText(opf, /<dc:title\b[^>]*>([\s\S]*?)<\/dc:title>/i)) || titleFromFilename(filename);
    const author = decodeHtml(matchText(opf, /<dc:creator\b[^>]*>([\s\S]*?)<\/dc:creator>/i)) || "Unknown";
    const manifest = parseManifest(opf);
    const spineIds = [...opf.matchAll(/<itemref\b[^>]*\bidref=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
    const readableItems = spineIds
      .map((id) => manifest.get(id))
      .filter((item) => item && /x?html/i.test(item.mediaType));
    if (!readableItems.length) throw new Error("This EPUB does not contain readable text chapters.");

    const chapters = [];
    for (const item of readableItems) {
      const chapterPath = normalizeZipPath(packageDirectory, item.href);
      const chapterEntry = entries.get(chapterPath.toLowerCase());
      if (!chapterEntry) continue;
      const html = decodeBytes(chapterEntry.value);
      const text = htmlToText(html);
      if (text) {
        chapters.push({
          title: chapterTitle(html) || `Chapter ${chapters.length + 1}`,
          text
        });
      }
    }
    if (!chapters.length) throw new Error("This EPUB opened, but no readable chapter text was found.");

    return {
      title,
      author,
      source: "Mobile EPUB import",
      rights: "User imported EPUB",
      chapters
    };
  }

  function metadataForBook(book, filename) {
    const idSource = global.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const id = `mobile-${idSource}`;
    const characterCount = book.chapters.reduce((total, chapter) => total + chapter.text.length, 0);
    return {
      id,
      title: book.title,
      author: book.author,
      source: book.source,
      language: "Italian",
      rights: book.rights,
      sourceUrl: "",
      importedAt: new Date().toISOString(),
      note: `${book.chapters.length} chapter${book.chapters.length === 1 ? "" : "s"}, saved on this device.`,
      importedContent: true,
      largeBook: characterCount > largeBookThreshold,
      characterCount,
      chapterSummaries: book.chapters.map((chapter, index) => ({
        title: chapter.title || `Chapter ${index + 1}`,
        characterCount: chapter.text.length,
        sectionCount: splitTextIntoSections(chapter.text).length
      })),
      originalFilename: filename
    };
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
        if (bestBreak > start + sectionSize * 0.55) end = bestBreak + 1;
      }
      sections.push(text.slice(start, end).trim());
      start = end;
    }
    return sections.filter(Boolean);
  }

  function parseManifest(opf) {
    const manifest = new Map();
    for (const match of opf.matchAll(/<item\b([^>]+)>/gi)) {
      const attrs = match[1];
      const id = decodeXmlAttribute(matchAttribute(attrs, /\bid=["']([^"']+)["']/i));
      const href = decodeXmlAttribute(matchAttribute(attrs, /\bhref=["']([^"']+)["']/i));
      const mediaType = decodeXmlAttribute(matchAttribute(attrs, /\bmedia-type=["']([^"']+)["']/i));
      if (id && href) manifest.set(id, { href: safeDecodeUri(href), mediaType });
    }
    return manifest;
  }

  function normalizeZipPath(base, target) {
    const cleanTarget = safeDecodeUri(String(target || "").split(/[?#]/)[0]).replace(/\\/g, "/");
    const parts = [];
    for (const segment of `${base ? `${base}/` : ""}${cleanTarget}`.split("/")) {
      if (!segment || segment === ".") continue;
      if (segment === "..") {
        if (!parts.length) throw new Error("This EPUB contains an unsafe archive path.");
        parts.pop();
      } else {
        parts.push(segment);
      }
    }
    return parts.join("/");
  }

  function htmlToText(html) {
    return cleanText(
      String(html || "")
        .replace(/<script\b[\s\S]*?<\/script>/gi, "")
        .replace(/<style\b[\s\S]*?<\/style>/gi, "")
        .replace(/<\/(h[1-6]|p|div|section|article|li|blockquote|pre)>/gi, "\n\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .split("\n")
        .map((line) => decodeHtml(line).trim())
        .filter(Boolean)
        .join("\n\n")
    );
  }

  function chapterTitle(html) {
    return decodeHtml(
      matchText(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i) ||
      matchText(html, /<h2\b[^>]*>([\s\S]*?)<\/h2>/i) ||
      matchText(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i)
    ).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  function cleanText(text) {
    return String(text || "")
      .replace(/^\uFEFF/, "")
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function decodeBytes(value) {
    return new TextDecoder("utf-8").decode(value);
  }

  function titleFromFilename(filename) {
    return String(filename || "Imported book")
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .trim();
  }

  function matchText(value, pattern) {
    return String(value || "").match(pattern)?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";
  }

  function matchAttribute(value, pattern) {
    return String(value || "").match(pattern)?.[1] || "";
  }

  function decodeXmlAttribute(value) {
    return decodeHtml(value).trim();
  }

  function decodeHtml(value) {
    return String(value || "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'")
      .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
      .replace(/&#x([a-f0-9]+);/gi, (_match, code) => String.fromCodePoint(parseInt(code, 16)));
  }

  function safeDecodeUri(value) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  global.PASSATO_MOBILE_LIBRARY = Object.freeze({
    importBookFromFile,
    loadBooks,
    loadSection,
    testing: Object.freeze({
      metadataForBook,
      normalizeZipPath,
      parseEpubBytes,
      splitTextIntoSections
    })
  });
})(window);
