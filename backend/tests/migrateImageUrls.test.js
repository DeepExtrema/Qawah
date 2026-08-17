const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { relativise } = require("../migrateImageUrls");

/*
 * The migration only rewrites rows that are genuinely broken. Getting the
 * "leave it alone" cases wrong would be worse than the bug it fixes: it could
 * mangle a legitimate remote URL, and it would stop the script from being
 * safe to re-run.
 */

describe("rows that need rewriting", () => {
  it("strips a localhost origin from a seeded image", () => {
    assert.equal(
      relativise("http://localhost:5001/products/haraaz-red.png"),
      "/products/haraaz-red.png"
    );
  });

  it("handles other local hosts and ports", () => {
    assert.equal(relativise("http://127.0.0.1:3000/products/qishr.png"), "/products/qishr.png");
    assert.equal(relativise("https://localhost/products/qishr.png"), "/products/qishr.png");
    assert.equal(relativise("http://0.0.0.0:5001/products/qishr.png"), "/products/qishr.png");
  });

  it("rewrites a legacy uploaded-image URL too", () => {
    assert.equal(
      relativise("http://localhost:5001/api/products/651111111111111111111111/image?v=42"),
      "/api/products/651111111111111111111111/image?v=42"
    );
  });

  it("ignores surrounding whitespace", () => {
    assert.equal(
      relativise("  http://localhost:5001/products/qishr.png  "),
      "/products/qishr.png"
    );
  });
});

describe("rows that must be left alone", () => {
  it("returns null for an already-relative path, which makes re-runs no-ops", () => {
    assert.equal(relativise("/products/haraaz-red.png"), null);
    assert.equal(relativise("/api/products/abc/image?v=1"), null);
  });

  it("returns null for a genuine remote URL", () => {
    // Mangling this would break a real CDN-hosted image.
    assert.equal(relativise("https://images.example.com/photo.png"), null);
    assert.equal(relativise("https://cdn.shopify.com/x.jpg"), null);
  });

  it("returns null for missing or non-string values", () => {
    assert.equal(relativise(null), null);
    assert.equal(relativise(undefined), null);
    assert.equal(relativise(""), null);
    assert.equal(relativise("   "), null);
    assert.equal(relativise(42), null);
  });
});
