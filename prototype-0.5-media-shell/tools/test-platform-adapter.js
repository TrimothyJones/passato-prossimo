const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const adapterSource = fs.readFileSync(
  path.resolve(__dirname, "..", "platform-adapter.js"),
  "utf8"
);

function createPlatform({ immersion = null, mobileLibrary = null, storedBooks = [] } = {}) {
  const storage = new Map([
    ["prototype03BrowserUrlBooks", JSON.stringify(storedBooks)]
  ]);
  const localStorage = {
    getItem(key) {
      return storage.get(key) ?? null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    }
  };
  const window = { immersion, localStorage, PASSATO_MOBILE_LIBRARY: mobileLibrary };
  const context = vm.createContext({ window });
  vm.runInContext(adapterSource, context, { filename: "platform-adapter.js" });
  return window.PASSATO_PLATFORM;
}

async function run() {
  const browserBook = { id: "browser-1", title: "Pagina salvata" };
  const browserPlatform = createPlatform({ storedBooks: [browserBook] });
  const browserBooks = await browserPlatform.library.loadBooks();

  assert.equal(browserPlatform.id, "browser");
  assert.equal(browserPlatform.capabilities.nativeBookImport, false);
  assert.equal(browserPlatform.capabilities.storedBookSections, false);
  assert.equal(browserBooks.length, 1);
  assert.equal(browserBooks[0].title, "Pagina salvata");
  await assert.rejects(
    browserPlatform.library.loadSection({ bookId: "missing" }),
    /not available in this browser build yet/
  );

  const mobileCalls = [];
  const mobilePlatform = createPlatform({
    mobileLibrary: {
      async loadBooks() {
        mobileCalls.push("load-books");
        return [{ id: "mobile-1", title: "Libro sul telefono" }];
      },
      async importBookFromFile() {
        mobileCalls.push("import-book");
        return { ok: true, book: { id: "mobile-2" } };
      },
      async loadSection(request) {
        mobileCalls.push(`load-section:${request.bookId}`);
        return { sectionText: "Sezione mobile." };
      }
    }
  });
  const mobileBooks = await mobilePlatform.library.loadBooks();
  const mobileImport = await mobilePlatform.library.importBook();
  const mobileSection = await mobilePlatform.library.loadSection({ bookId: "mobile-1" });

  assert.equal(mobilePlatform.id, "mobile-browser");
  assert.equal(mobilePlatform.capabilities.bookImport, true);
  assert.equal(mobilePlatform.capabilities.nativeBookImport, false);
  assert.equal(mobilePlatform.capabilities.storedBookSections, true);
  assert.equal(mobileBooks[0].title, "Libro sul telefono");
  assert.equal(mobileImport.book.id, "mobile-2");
  assert.equal(mobileSection.sectionText, "Sezione mobile.");
  assert.deepEqual(mobileCalls, ["load-books", "import-book", "load-section:mobile-1"]);

  const calls = [];
  const desktopPlatform = createPlatform({
    immersion: {
      importBookFromFile() {},
      async loadCustomBooks() {
        calls.push("load-books");
        return [{ id: "desktop-1", title: "Libro locale" }];
      },
      async loadBookSection(request) {
        calls.push(`load-section:${request.bookId}`);
        return { sectionText: "Testo della sezione." };
      }
    }
  });
  const desktopBooks = await desktopPlatform.library.loadBooks();
  const section = await desktopPlatform.library.loadSection({ bookId: "desktop-1" });

  assert.equal(desktopPlatform.id, "electron-desktop");
  assert.equal(desktopPlatform.capabilities.nativeBookImport, true);
  assert.equal(desktopPlatform.capabilities.storedBookSections, true);
  assert.equal(desktopBooks[0].title, "Libro locale");
  assert.equal(section.sectionText, "Testo della sezione.");
  assert.deepEqual(calls, ["load-books", "load-section:desktop-1"]);

  console.table([
    {
      platform: browserPlatform.id,
      books: browserBooks.length,
      storedSections: browserPlatform.capabilities.storedBookSections
    },
    {
      platform: mobilePlatform.id,
      books: mobileBooks.length,
      storedSections: mobilePlatform.capabilities.storedBookSections
    },
    {
      platform: desktopPlatform.id,
      books: desktopBooks.length,
      storedSections: desktopPlatform.capabilities.storedBookSections
    }
  ]);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
