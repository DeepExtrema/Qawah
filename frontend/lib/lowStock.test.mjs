import { describe, it } from "node:test";
import assert from "node:assert/strict";
// Import the real module. An earlier version of this file re-declared the
// functions inline, which meant it passed no matter what lowStock.js did.
import { isLowStock, lowStockLabel } from "./lowStock.mjs";

describe("isLowStock threshold", () => {
  it("treats 1 through 8 as low stock", () => {
    assert.equal(isLowStock(1), true);
    assert.equal(isLowStock(8), true);
  });

  it("excludes sold out and healthy inventory", () => {
    // 0 is sold out, not low — the UI shows a different badge for it.
    assert.equal(isLowStock(0), false);
    assert.equal(isLowStock(9), false);
    assert.equal(isLowStock(-3), false);
  });

  it("does not warn on missing or unparseable inventory", () => {
    assert.equal(isLowStock(undefined), false);
    assert.equal(isLowStock(null), false);
    assert.equal(isLowStock("not a number"), false);
  });
});

describe("low stock badge copy", () => {
  it("shows remaining bags when inventory is 1–8", () => {
    assert.equal(lowStockLabel(3), "Only 3 bags left");
    assert.equal(lowStockLabel(8), "Only 8 bags left");
  });

  it("uses the singular noun for exactly one bag", () => {
    assert.equal(lowStockLabel(1), "Only 1 bag left");
  });

  it("returns null when no warning should render", () => {
    // Returning null (not "") lets the component skip the element entirely.
    assert.equal(lowStockLabel(0), null);
    assert.equal(lowStockLabel(12), null);
    assert.equal(lowStockLabel(undefined), null);
  });

  it("accepts numeric strings, as the API sometimes returns them", () => {
    assert.equal(lowStockLabel("2"), "Only 2 bags left");
  });
});
