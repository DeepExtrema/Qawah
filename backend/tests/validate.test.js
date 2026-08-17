const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  requireEmail,
  clampRating,
  normalizeCode,
  isLowStock,
  slugify,
  isObjectId,
} = require("../utils/validate");

describe("validate", () => {
  it("normalizes emails and discount codes", () => {
    assert.equal(requireEmail("  Yusuf@QahwaSupply.local "), "yusuf@qahwasupply.local");
    assert.equal(normalizeCode(" qahwa10 "), "QAHWA10");
  });

  it("rejects invalid ratings", () => {
    assert.equal(clampRating(5), 5);
    assert.throws(() => clampRating(0));
    assert.throws(() => clampRating(6));
  });

  it("flags low stock between 1 and 8", () => {
    assert.equal(isLowStock(0), false);
    assert.equal(isLowStock(1), true);
    assert.equal(isLowStock(8), true);
    assert.equal(isLowStock(9), false);
  });

  it("slugifies names and checks object ids", () => {
    assert.equal(slugify("Haraaz Red"), "haraaz-red");
    assert.equal(isObjectId("64b1f0c2a1b2c3d4e5f60789"), true);
    assert.equal(isObjectId("not-an-id"), false);
  });
});
