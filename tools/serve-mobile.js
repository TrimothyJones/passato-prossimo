const fs = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const defaultPort = 4173;
const allowedFiles = new Set([
  "mobile/index.html",
  "mobile/mobile.css",
  "mobile/manifest.webmanifest",
  "mobile/pwa-register.js",
  "mobile/sw.js",
  "mobile/mobile-library.js",
  "mobile/vendor/fflate-0.8.3.js",
  "mobile/icons/app-icon-180.png",
  "mobile/icons/app-icon-192.png",
  "mobile/icons/app-icon-512.png",
  "src/books.js",
  "prototype-0.2-lexical-coverage/lexicon.js",
  "prototype-0.2-lexical-coverage/core-dictionary.js",
  "prototype-0.3-assisted-reader/paisa-frequency.js",
  "prototype-0.3-assisted-reader/learner-enrichment.js",
  "prototype-0.3-assisted-reader/dictionary-overflow.js",
  "prototype-0.3-assisted-reader/context-markers.js",
  "prototype-0.3-assisted-reader/accent-rules.js",
  "prototype-0.3-assisted-reader/elision-rules.js",
  "prototype-0.5-media-shell/styles.css",
  "prototype-0.5-media-shell/platform-adapter.js",
  "prototype-0.5-media-shell/app.js"
]);
const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".png", "image/png"]
]);

function normalizedRequestPath(rawUrl) {
  const pathname = new URL(rawUrl || "/", "http://localhost").pathname;
  if (pathname === "/" || pathname === "/mobile") return "mobile/index.html";
  const decoded = decodeURIComponent(pathname).replace(/^\/+/, "");
  return decoded === "mobile/" ? "mobile/index.html" : decoded;
}

async function respond(request, response) {
  let relativePath;
  try {
    relativePath = normalizedRequestPath(request.url);
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad request");
    return;
  }

  if (!allowedFiles.has(relativePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  try {
    const body = await fs.readFile(path.join(root, relativePath));
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": contentTypes.get(path.extname(relativePath)) || "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("The mobile preview could not read a required project file.");
  }
}

function createMobileServer() {
  return http.createServer((request, response) => {
    if (!new Set(["GET", "HEAD"]).has(request.method)) {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }
    respond(request, response);
  });
}

function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((address) => address?.family === "IPv4" && !address.internal)
    .map((address) => address.address);
}

if (require.main === module) {
  const port = Number(process.env.PORT || defaultPort);
  const server = createMobileServer();
  server.listen(port, "0.0.0.0", () => {
    console.log(`Passato Prossimo mobile preview: http://127.0.0.1:${port}/mobile/`);
    for (const address of lanAddresses()) {
      console.log(`iPhone on the same Wi-Fi: http://${address}:${port}/mobile/`);
    }
    console.log("Press Ctrl+C to stop the preview server.");
  });
}

module.exports = {
  allowedFiles,
  createMobileServer,
  normalizedRequestPath
};
