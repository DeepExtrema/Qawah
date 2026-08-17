const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

/**
 * Guards the deployability of the API as a Netlify Function.
 *
 * This exists because a real deploy died on it. `bcrypt` is a native module: it
 * compiles to a platform-specific .node binary, and esbuild bundles JavaScript
 * by inlining it, so the binary was simply left behind. The function then threw
 * "Cannot find module 'bcrypt'" on import, before a single line of application
 * code ran, and every route returned 502 including /api/health, which touches
 * neither auth nor the database.
 *
 * Nothing in the local test suite noticed, because locally the binary is right
 * there in node_modules. These tests encode the constraint that only holds once
 * the code is bundled somewhere else.
 */

const BACKEND = path.join(__dirname, "..");

/** Every file under a directory, bounded so a pathological tree cannot hang. */
function walk(dir, depth = 0, out = []) {
  if (depth > 8) return out;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, depth + 1, out);
    else out.push(full);
  }
  return out;
}

describe("the API can be bundled into a serverless function", () => {
  it("has no native .node binaries in its dependency tree", () => {
    const modules = path.join(BACKEND, "node_modules");
    if (!fs.existsSync(modules)) return; // dependencies not installed; nothing to assert

    const native = walk(modules)
      .filter((f) => f.endsWith(".node"))
      .map((f) => path.relative(modules, f));

    assert.deepEqual(
      native,
      [],
      "A native module cannot be bundled into a Netlify Function and will make " +
        "every route return 502 on deploy. Replace it with a pure-JavaScript " +
        "equivalent, as bcrypt was replaced by bcryptjs. Offending files: " +
        native.join(", ")
    );
  });

  it("does not declare dependencies that are known to ship native code", () => {
    const { dependencies = {} } = require("../package.json");
    // Packages commonly reached for in a project like this that would break the
    // bundle. Each has a pure-JavaScript alternative.
    const NATIVE = ["bcrypt", "sharp", "canvas", "sqlite3", "better-sqlite3", "node-sass", "argon2"];
    const found = NATIVE.filter((name) => name in dependencies);

    assert.deepEqual(
      found,
      [],
      `Declared native dependency: ${found.join(", ")}. Use a pure-JavaScript ` +
        "equivalent so the Netlify function bundle still loads."
    );
  });

  it("hashes passwords with bcryptjs rather than the native bcrypt", () => {
    for (const file of ["routes/authRoutes.js", "seed.js"]) {
      const source = fs.readFileSync(path.join(BACKEND, file), "utf8");
      assert.doesNotMatch(
        source,
        /require\(["']bcrypt["']\)/,
        `${file} requires the native bcrypt, which cannot be bundled`
      );
    }
  });
});

describe("bcryptjs stays compatible with already-stored hashes", () => {
  const bcryptjs = require("bcryptjs");

  /*
   * A real hash, produced by the native bcrypt package at cost 10 for the
   * password "password", captured at the moment of the migration. It is pinned
   * here rather than generated, because generating it with bcryptjs would only
   * prove bcryptjs agrees with itself. The question that matters is whether it
   * agrees with the library that wrote every password already in the database.
   *
   * A throwaway vector, not a credential belonging to any account.
   */
  const NATIVE_BCRYPT_HASH =
    "$2b$10$duRKOuVopXd5k.GVI6.hROl06ztSTBhOhn2PtuOt.segBZSUqKYMq";

  it("verifies a $2b$ hash that native bcrypt wrote", async () => {
    // Were this ever to fail, every existing user would be locked out.
    assert.equal(await bcryptjs.compare("password", NATIVE_BCRYPT_HASH), true);
  });

  it("rejects a wrong password against that same hash", async () => {
    assert.equal(await bcryptjs.compare("Password", NATIVE_BCRYPT_HASH), false);
    assert.equal(await bcryptjs.compare("", NATIVE_BCRYPT_HASH), false);
  });

  it("still produces $2b$ hashes, so nothing downstream sees a format change", async () => {
    const hash = await bcryptjs.hash("whatever", 10);
    assert.match(hash, /^\$2[ab]\$10\$/);
    assert.equal(await bcryptjs.compare("whatever", hash), true);
  });
});
