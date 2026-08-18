import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  waitlistKey,
  hasJoined,
  addJoined,
  removeJoined,
  notifyLabel,
} from "./waitlist.mjs";

describe("waitlistKey", () => {
  it("prefers the slug, which survives mergeWithApi swapping _id", () => {
    // Frontend-only: _id is the mock string from lots.js.
    assert.equal(
      waitlistKey({ _id: "lot-haraaz-2", slug: "haraaz-2" }),
      "haraaz-2"
    );
    // After mergeWithApi: _id is a Mongo id, mockId holds the old one.
    assert.equal(
      waitlistKey({ _id: "64b1f0c2a1b2c3d4e5f60789", mockId: "lot-haraaz-2", slug: "haraaz-2" }),
      "haraaz-2"
    );
  });

  it("falls back to mockId then _id when there is no slug", () => {
    assert.equal(waitlistKey({ _id: "64b1f0c2a1b2c3d4e5f60789", mockId: "lot-x" }), "lot-x");
    assert.equal(waitlistKey({ _id: "lot-y" }), "lot-y");
  });

  it("returns an empty string for junk input", () => {
    assert.equal(waitlistKey(null), "");
    assert.equal(waitlistKey(undefined), "");
    assert.equal(waitlistKey({}), "");
  });
});

describe("hasJoined", () => {
  const entries = [{ productKey: "haraaz-2", email: "a@b.co" }];

  it("matches a product against stored entries by key", () => {
    assert.equal(hasJoined(entries, { slug: "haraaz-2" }), true);
    assert.equal(hasJoined(entries, { slug: "bani-matar-honey" }), false);
  });

  it("still matches after the id swaps to a Mongo id", () => {
    assert.equal(
      hasJoined(entries, { _id: "64b1f0c2a1b2c3d4e5f60789", slug: "haraaz-2" }),
      true
    );
  });

  it("is safe with missing entries or products", () => {
    assert.equal(hasJoined(undefined, { slug: "haraaz-2" }), false);
    assert.equal(hasJoined(entries, null), false);
  });
});

describe("addJoined", () => {
  it("adds an entry", () => {
    const next = addJoined([], { productKey: "haraaz-2", email: "a@b.co" });
    assert.deepEqual(next, [{ productKey: "haraaz-2", email: "a@b.co" }]);
  });

  it("does not duplicate the same lot when joined twice", () => {
    const first = addJoined([], { productKey: "haraaz-2", email: "a@b.co" });
    const second = addJoined(first, { productKey: "haraaz-2", email: "new@b.co" });
    assert.equal(second.length, 1);
    // The newer email wins, so a corrected address replaces the old one.
    assert.equal(second[0].email, "new@b.co");
  });

  it("ignores entries with no product key", () => {
    assert.deepEqual(addJoined([], { email: "a@b.co" }), []);
  });

  it("does not mutate the array it was given", () => {
    const original = [];
    addJoined(original, { productKey: "haraaz-2", email: "a@b.co" });
    assert.equal(original.length, 0);
  });
});

describe("removeJoined", () => {
  it("drops the matching lot and leaves the rest", () => {
    const entries = [{ productKey: "haraaz-2" }, { productKey: "bani-matar-honey" }];
    const next = removeJoined(entries, { slug: "haraaz-2" });
    assert.deepEqual(next, [{ productKey: "bani-matar-honey" }]);
  });

  it("is a no-op for a lot that was never joined", () => {
    const entries = [{ productKey: "haraaz-2" }];
    assert.deepEqual(removeJoined(entries, { slug: "nope" }), entries);
  });
});

describe("notifyLabel", () => {
  it("reads as an action before joining and as state after", () => {
    assert.equal(notifyLabel({ joined: false, pending: false }), "Notify");
    assert.equal(notifyLabel({ joined: true, pending: false }), "On list");
  });

  it("shows progress while the request is in flight", () => {
    assert.equal(notifyLabel({ joined: false, pending: true }), "Joining…");
  });
});
