const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createMobileServer, normalizedRequestPath } = require("./serve-mobile");

const root = path.resolve(__dirname, "..");
const mobileHtml = fs.readFileSync(path.join(root, "mobile", "index.html"), "utf8");

assert.match(mobileHtml, /viewport-fit=cover/);
assert.match(mobileHtml, /class="mobile-app"/);
assert.match(mobileHtml, /rel="manifest" href="\.\/manifest\.webmanifest"/);
assert.match(mobileHtml, /rel="apple-touch-icon"/);
assert.ok(
  mobileHtml.indexOf("mobile-library.js") < mobileHtml.indexOf("platform-adapter.js") &&
    mobileHtml.indexOf("platform-adapter.js") < mobileHtml.indexOf("app.js"),
  "The platform adapter must load before the shared application."
);
assert.equal(normalizedRequestPath("/"), "mobile/index.html");
assert.equal(normalizedRequestPath("/mobile/"), "mobile/index.html");

async function run() {
  const server = createMobileServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  try {
    const pageResponse = await fetch(`${base}/mobile/`);
    const page = await pageResponse.text();
    assert.equal(pageResponse.status, 200);
    assert.match(page, /Passato Prossimo Mobile/);

    const adapterResponse = await fetch(`${base}/prototype-0.5-media-shell/platform-adapter.js`);
    assert.equal(adapterResponse.status, 200);
    assert.match(await adapterResponse.text(), /PASSATO_PLATFORM/);

    const importerResponse = await fetch(`${base}/mobile/mobile-library.js`);
    assert.equal(importerResponse.status, 200);
    assert.match(await importerResponse.text(), /PASSATO_MOBILE_LIBRARY/);

    const manifestResponse = await fetch(`${base}/mobile/manifest.webmanifest`);
    assert.equal(manifestResponse.status, 200);
    assert.match(manifestResponse.headers.get("content-type"), /application\/manifest\+json/);
    const manifest = await manifestResponse.json();
    assert.equal(manifest.display, "standalone");
    assert.equal(manifest.start_url, "./");

    const serviceWorkerResponse = await fetch(`${base}/mobile/sw.js`);
    assert.equal(serviceWorkerResponse.status, 200);
    assert.match(await serviceWorkerResponse.text(), /passato-prossimo-mobile-v1/);

    const iconResponse = await fetch(`${base}/mobile/icons/app-icon-192.png`);
    assert.equal(iconResponse.status, 200);
    assert.equal(iconResponse.headers.get("content-type"), "image/png");

    const privateResponse = await fetch(`${base}/package.json`);
    assert.equal(privateResponse.status, 404);

    const traversalResponse = await fetch(`${base}/mobile/%2e%2e/package.json`);
    assert.equal(traversalResponse.status, 404);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }

  console.log("Mobile entry and restricted preview server: PASS");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
