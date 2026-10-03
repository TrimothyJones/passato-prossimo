const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const prefix = "prototype-0.5-media-shell/";
const allowed = new Set([
  `${prefix}foundation-lab.html`, `${prefix}foundation-lab.js`,
  `${prefix}lexical-provider.js`, `${prefix}italian-foundation.js`,
  `${prefix}data/italian-foundation.json`,
  `${prefix}data/reader-dict-trial.json`,
  `${prefix}data/reader-dict-en-trial.json`,
  "prototype-0.2-lexical-coverage/core-dictionary.js",
  "prototype-0.3-assisted-reader/learner-enrichment.js",
  "prototype-0.3-assisted-reader/dictionary-overflow.js"
]);

function createLabServer() {
  return http.createServer(async (request, response) => {
    const name = new URL(request.url, "http://localhost").pathname.slice(1)
      || `${prefix}foundation-lab.html`;
    if (!allowed.has(name)) { response.writeHead(404); response.end("Not found"); return; }
    try {
      const body = await fs.readFile(path.join(root, name));
      const type = name.endsWith(".html") ? "text/html" : name.endsWith(".json") ? "application/json" : "text/javascript";
      response.writeHead(200, { "Content-Type": `${type}; charset=utf-8`, "Cache-Control": "no-store" });
      response.end(body);
    } catch {
      response.writeHead(500); response.end("Build the foundation provider before opening the lab.");
    }
  });
}

if (require.main === module) {
  const server = createLabServer();
  server.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
  server.listen(4174, "127.0.0.1", () => console.log("Foundation comparison: http://127.0.0.1:4174"));
}
module.exports = { createLabServer };
