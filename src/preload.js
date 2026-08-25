const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("immersion", {
  logInteraction: (payload) => ipcRenderer.invoke("log-interaction", payload),
  saveTopWords: (payload) => ipcRenderer.invoke("save-top-words", payload),
  loadCustomBooks: () => ipcRenderer.invoke("load-custom-books"),
  saveCustomBooks: (payload) => ipcRenderer.invoke("save-custom-books", payload),
  importBookFromFile: () => ipcRenderer.invoke("import-book-from-file"),
  importBookFromUrl: (url) => ipcRenderer.invoke("import-book-from-url", url),
  previewBookFromUrl: (url) => ipcRenderer.invoke("preview-book-from-url", url),
  saveUrlPreview: (payload) => ipcRenderer.invoke("save-url-preview", payload),
  loadBookSection: (payload) => ipcRenderer.invoke("load-book-section", payload),
  loadImportLog: () => ipcRenderer.invoke("load-import-log"),
  appendImportLog: (payload) => ipcRenderer.invoke("append-import-log", payload),
  exportTestingReport: () => ipcRenderer.invoke("export-testing-report"),
  openExternal: (url) => ipcRenderer.invoke("open-external", url)
});
