(function initializePassatoPlatform(global) {
  const desktopBridge = global.immersion || null;
  const mobileLibrary = global.PASSATO_MOBILE_LIBRARY || null;
  const browserBooksKey = "prototype03BrowserUrlBooks";
  const isDesktop = Boolean(
    desktopBridge?.loadCustomBooks && desktopBridge?.loadBookSection
  );
  const isMobileBrowser = !isDesktop && Boolean(mobileLibrary);

  function loadBrowserBooks() {
    try {
      const stored = JSON.parse(global.localStorage?.getItem(browserBooksKey) || "[]");
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  }

  const platform = {
    id: isDesktop ? "electron-desktop" : isMobileBrowser ? "mobile-browser" : "browser",
    capabilities: Object.freeze({
      bookImport: Boolean(desktopBridge?.importBookFromFile || mobileLibrary?.importBookFromFile),
      nativeBookImport: Boolean(
        desktopBridge?.importBookFromFile && desktopBridge?.loadCustomBooks
      ),
      storedBookSections: Boolean(desktopBridge?.loadBookSection || mobileLibrary?.loadSection)
    }),
    library: Object.freeze({
      async loadBooks() {
        if (isDesktop) return desktopBridge.loadCustomBooks();
        if (isMobileBrowser) {
          const mobileBooks = await mobileLibrary.loadBooks();
          const browserBooks = loadBrowserBooks();
          return [...mobileBooks, ...browserBooks.filter((book) => !mobileBooks.some((mobileBook) => mobileBook.id === book.id))];
        }
        return loadBrowserBooks();
      },

      async importBook() {
        if (desktopBridge?.importBookFromFile) return desktopBridge.importBookFromFile();
        if (mobileLibrary?.importBookFromFile) return mobileLibrary.importBookFromFile();
        throw new Error("Book importing is not available in this browser build yet.");
      },

      async loadSection(request) {
        if (desktopBridge?.loadBookSection) {
          return desktopBridge.loadBookSection(request);
        }
        if (mobileLibrary?.loadSection) return mobileLibrary.loadSection(request);
        throw new Error("Stored book sections are not available in this browser build yet.");
      }
    })
  };

  global.PASSATO_PLATFORM = Object.freeze(platform);
})(window);
