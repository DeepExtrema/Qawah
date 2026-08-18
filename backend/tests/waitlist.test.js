const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeProductKey,
  buildWaitlistEntry,
} = require("../utils/waitlist");

describe("normalizeProductKey", () => {
  it("trims and lowercases so casing never splits a lot's list", () => {
    assert.equal(normalizeProductKey("  Haraaz-2 "), "haraaz-2");
  });

  it("accepts a Mongo id as a key, since the client may send either", () => {
    assert.equal(
      normalizeProductKey("64B1F0C2A1B2C3D4E5F60789"),
      "64b1f0c2a1b2c3d4e5f60789"
    );
  });

  it("rejects empty or oversized keys", () => {
    assert.throws(() => normalizeProductKey(""), { code: "VALIDATION" });
    assert.throws(() => normalizeProductKey("   "), { code: "VALIDATION" });
    assert.throws(() => normalizeProductKey(undefined), { code: "VALIDATION" });
    assert.throws(() => normalizeProductKey("x".repeat(121)), { code: "VALIDATION" });
  });
});

describe("buildWaitlistEntry", () => {
  it("normalizes the key and email together", () => {
    const entry = buildWaitlistEntry({
      productKey: " Haraaz-2 ",
      email: "  Yusuf@QahwaSupply.local ",
      productName: "  Haraaz Nº 2  ",
    });
    assert.equal(entry.productKey, "haraaz-2");
    assert.equal(entry.email, "yusuf@qahwasupply.local");
    assert.equal(entry.productName, "Haraaz Nº 2");
  });

  it("rejects a malformed email", () => {
    assert.throws(
      () => buildWaitlistEntry({ productKey: "haraaz-2", email: "not-an-email" }),
      { code: "VALIDATION" }
    );
  });

  it("keeps a valid userId and drops a junk one", () => {
    const withUser = buildWaitlistEntry({
      productKey: "haraaz-2",
      email: "a@b.co",
      userId: "64b1f0c2a1b2c3d4e5f60789",
    });
    assert.equal(withUser.userId, "64b1f0c2a1b2c3d4e5f60789");

    // A guest join has no user at all; a bad id must not become one.
    const guest = buildWaitlistEntry({ productKey: "haraaz-2", email: "a@b.co" });
    assert.equal(guest.userId, null);
    const junk = buildWaitlistEntry({
      productKey: "haraaz-2",
      email: "a@b.co",
      userId: "lot-not-a-user",
    });
    assert.equal(junk.userId, null);
  });

  it("omits productName when none is supplied", () => {
    const entry = buildWaitlistEntry({ productKey: "haraaz-2", email: "a@b.co" });
    assert.equal(entry.productName, "");
  });
});
