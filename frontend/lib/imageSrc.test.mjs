import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveImageSrc } from "./imageSrc.mjs";

/*
 * These cover a bug that reached production: every product row held an
 * absolute http://localhost:5001/... image URL, so the deployed site asked
 * each visitor's own machine for the images and every one of them broke.
 *
 * The stored value is now relative, but a database seeded before that change
 * still holds the old form, so the component repairs it rather than trusting
 * that every environment has been migrated.
 */

const PROD = ""; // production: API is proxied on the same origin
const DEV = "http://localhost:5001"; // development: API is a separate process

describe("seeded catalogue images", () => {
  it("passes a relative path straight through in production", () => {
    assert.equal(resolveImageSrc("/products/haraaz-red.png", PROD), "/products/haraaz-red.png");
  });

  it("keeps it relative in development too, since the file is served by Next", () => {
    // The 18 seeded files live in frontend/public/products, so they are served
    // by the site itself on both origins. Prefixing the API origin would 404.
    assert.equal(resolveImageSrc("/products/haraaz-red.png", DEV), "/products/haraaz-red.png");
  });
});

describe("administrator-uploaded images", () => {
  it("is already correct in production, where the API shares the origin", () => {
    assert.equal(
      resolveImageSrc("/api/products/651111111111111111111111/image?v=42", PROD),
      "/api/products/651111111111111111111111/image?v=42"
    );
  });

  it("gains the API origin in development, where the API is on another port", () => {
    assert.equal(
      resolveImageSrc("/api/products/651111111111111111111111/image?v=42", DEV),
      "http://localhost:5001/api/products/651111111111111111111111/image?v=42"
    );
  });

  it("preserves the cache-busting version stamp", () => {
    assert.match(resolveImageSrc("/api/products/abc/image?v=99", PROD), /\?v=99$/);
  });
});

describe("legacy absolute URLs are repaired", () => {
  it("strips a localhost origin from a seeded image", () => {
    // The exact value found in the database after deploying.
    assert.equal(
      resolveImageSrc("http://localhost:5001/products/haraaz-red.png", PROD),
      "/products/haraaz-red.png"
    );
  });

  it("strips it in development as well", () => {
    assert.equal(
      resolveImageSrc("http://localhost:5001/products/haraaz-red.png", DEV),
      "/products/haraaz-red.png"
    );
  });

  it("handles 127.0.0.1 and other ports", () => {
    assert.equal(resolveImageSrc("http://127.0.0.1:3000/products/qishr.png", PROD), "/products/qishr.png");
    assert.equal(resolveImageSrc("https://localhost/products/qishr.png", PROD), "/products/qishr.png");
  });

  it("re-points a legacy uploaded image at the API origin", () => {
    assert.equal(
      resolveImageSrc("http://localhost:5001/api/products/abc/image?v=1", DEV),
      "http://localhost:5001/api/products/abc/image?v=1"
    );
    assert.equal(
      resolveImageSrc("http://localhost:5001/api/products/abc/image?v=1", PROD),
      "/api/products/abc/image?v=1"
    );
  });
});

describe("genuine remote URLs are left alone", () => {
  it("does not touch a real CDN address", () => {
    const cdn = "https://images.example.com/photo.png";
    assert.equal(resolveImageSrc(cdn, PROD), cdn);
    assert.equal(resolveImageSrc(cdn, DEV), cdn);
  });
});

describe("missing or malformed values", () => {
  it("returns an empty string so the component falls back to the placeholder", () => {
    assert.equal(resolveImageSrc(null, PROD), "");
    assert.equal(resolveImageSrc(undefined, PROD), "");
    assert.equal(resolveImageSrc("", PROD), "");
    assert.equal(resolveImageSrc("   ", PROD), "");
    assert.equal(resolveImageSrc(42, PROD), "");
  });

  it("adds the leading slash a bare filename is missing", () => {
    assert.equal(resolveImageSrc("products/qishr.png", PROD), "/products/qishr.png");
  });
});
