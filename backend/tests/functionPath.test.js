const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { originalPath } = require("../utils/functionPath");

/*
 * These guard the seam between Netlify and Express. If the rewrite prefix is
 * not stripped correctly, every single API route 404s in production while
 * working perfectly in local development, which is an expensive way to find
 * out about it.
 */

describe("Netlify path translation: rawUrl", () => {
  it("uses the originally requested path, ignoring the rewrite", () => {
    assert.equal(
      originalPath({
        rawUrl: "https://qahwa.netlify.app/api/products",
        path: "/.netlify/functions/api/products",
      }),
      "/api/products"
    );
  });

  it("drops the query string, which Express matches separately", () => {
    assert.equal(
      originalPath({ rawUrl: "https://qahwa.netlify.app/api/products?q=haraaz" }),
      "/api/products"
    );
  });

  it("preserves nested route segments", () => {
    assert.equal(
      originalPath({ rawUrl: "https://qahwa.netlify.app/api/orders/651/confirmation" }),
      "/api/orders/651/confirmation"
    );
  });

  it("falls back to the event path when rawUrl is malformed", () => {
    assert.equal(
      originalPath({ rawUrl: "not a url", path: "/.netlify/functions/api/admin/stats" }),
      "/api/admin/stats"
    );
  });
});

describe("Netlify path translation: prefix fallback", () => {
  it("restores the /api prefix the rewrite consumed", () => {
    assert.equal(
      originalPath({ path: "/.netlify/functions/api/products" }),
      "/api/products"
    );
    assert.equal(
      originalPath({ path: "/.netlify/functions/api/admin/stats" }),
      "/api/admin/stats"
    );
  });

  it("handles the bare function path without producing a trailing slash", () => {
    assert.equal(originalPath({ path: "/.netlify/functions/api" }), "/api");
    assert.equal(originalPath({ path: "/.netlify/functions/api/" }), "/api");
  });

  it("does not double up when the path already carries /api", () => {
    assert.equal(
      originalPath({ path: "/.netlify/functions/api/api/health" }),
      "/api/health"
    );
  });

  it("leaves a direct, un-rewritten path alone", () => {
    assert.equal(originalPath({ path: "/api/health" }), "/api/health");
  });

  it("defaults to root when the event carries no path at all", () => {
    assert.equal(originalPath({}), "/");
    assert.equal(originalPath(undefined), "/");
  });
});
