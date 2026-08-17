const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

/*
 * config.js reads process.env once at require time, so each case runs in a
 * fresh child process. Mutating process.env in-process would not re-evaluate
 * the module.
 */
function readConfig(env) {
  const script = `
    const c = require(${JSON.stringify(path.join(__dirname, "..", "utils", "config.js"))});
    process.stdout.write(JSON.stringify({
      seeded: c.productImageUrl("haraaz-red.png"),
      uploaded: c.uploadedImageUrl("651111111111111111111111", 42),
      clientOrigin: c.CLIENT_ORIGIN,
      publicApiUrl: c.PUBLIC_API_URL,
    }));
  `;
  const out = execFileSync(process.execPath, ["-e", script], {
    env: { ...process.env, ...env, DOTENV_CONFIG_QUIET: "true" },
    encoding: "utf8",
  });
  return JSON.parse(out.slice(out.indexOf("{")));
}

// Explicitly blank the values a developer's .env might supply, so the test
// asserts the code's behaviour rather than the machine's configuration.
const CLEAN = { PUBLIC_API_URL: "", URL: "", DEPLOY_PRIME_URL: "", CLIENT_ORIGIN: "" };

describe("seeded product image URLs are environment-portable", () => {
  it("is a relative path, never an absolute one", () => {
    const local = readConfig(CLEAN);
    const deployed = readConfig({ ...CLEAN, URL: "https://qahwa.netlify.app" });

    assert.equal(local.seeded, "/products/haraaz-red.png");
    // The same value regardless of environment. An absolute URL here would
    // bake the seeding machine's hostname into the database and break every
    // product image once deployed.
    assert.equal(deployed.seeded, local.seeded);
    assert.doesNotMatch(local.seeded, /^https?:/);
  });
});

describe("uploaded image URLs follow the deployment", () => {
  it("points at localhost during local development", () => {
    const c = readConfig(CLEAN);
    assert.match(c.uploaded, /^http:\/\/localhost:\d+\/api\/products\/[a-f0-9]{24}\/image\?v=42$/);
  });

  it("points at the Netlify site once deployed", () => {
    const c = readConfig({ ...CLEAN, URL: "https://qahwa.netlify.app" });
    assert.equal(
      c.uploaded,
      "https://qahwa.netlify.app/api/products/651111111111111111111111/image?v=42"
    );
  });

  it("carries a version stamp so a replaced image is not served from cache", () => {
    assert.match(readConfig(CLEAN).uploaded, /\?v=42$/);
  });
});

describe("origins fall back to the Netlify environment", () => {
  it("defaults to localhost with nothing configured", () => {
    const c = readConfig(CLEAN);
    assert.equal(c.clientOrigin, "http://localhost:3000");
  });

  it("adopts the Netlify site URL automatically", () => {
    const c = readConfig({ ...CLEAN, URL: "https://qahwa.netlify.app" });
    assert.equal(c.clientOrigin, "https://qahwa.netlify.app");
    assert.equal(c.publicApiUrl, "https://qahwa.netlify.app");
  });

  it("lets an explicit value win over the Netlify default", () => {
    const c = readConfig({
      ...CLEAN,
      URL: "https://qahwa.netlify.app",
      CLIENT_ORIGIN: "https://shop.example.com",
    });
    assert.equal(c.clientOrigin, "https://shop.example.com");
  });

  it("strips a trailing slash so URLs never double up", () => {
    const c = readConfig({ ...CLEAN, URL: "https://qahwa.netlify.app/" });
    assert.equal(c.publicApiUrl, "https://qahwa.netlify.app");
    assert.doesNotMatch(c.uploaded, /\/\/api\//);
  });
});
