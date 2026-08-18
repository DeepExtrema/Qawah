/*
 * Server-side form rules. These mirror frontend/lib/formRules.test.mjs on
 * purpose: the point of the server copy is that it holds when the browser copy
 * is bypassed, so it needs its own proof.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  PASSWORD_MIN,
  emailIssue,
  nameIssue,
  passwordIssue,
  postalIssue,
  normalizeCountry,
  rejectFields,
  requireEmail,
  requireName,
  requirePassword,
  requirePostal,
} = require("../utils/validate");

describe("emailIssue", () => {
  it("accepts an ordinary address", () => {
    assert.equal(emailIssue("name@example.com"), "");
    assert.equal(emailIssue("  name@example.com  "), "");
  });

  it("rejects the address the browser used to be the only thing catching", () => {
    // A client that skips the browser could previously create an account with
    // this as its email, and that address is where receipts get sent.
    assert.match(emailIssue("aaaaaa"), /needs an @/);
  });

  it("names each way an address can be malformed", () => {
    assert.match(emailIssue(""), /Please add an email/);
    assert.match(emailIssue("a b@example.com"), /cannot contain spaces/);
    assert.match(emailIssue("a@@example.com"), /more than one @/);
    assert.match(emailIssue("@example.com"), /nothing before the @/);
    assert.match(emailIssue("name@"), /after the @/);
    assert.match(emailIssue("name@example"), /needs a dot/);
    assert.match(emailIssue("name@example..com"), /two dots in a row/);
    assert.match(emailIssue("name@example.c"), /too short/);
  });
});

describe("requireEmail", () => {
  it("returns the address lowercased and trimmed", () => {
    assert.equal(requireEmail("  Name@Example.COM "), "name@example.com");
  });

  it("throws a VALIDATION error carrying the field", () => {
    assert.throws(() => requireEmail("aaaaaa"), (error) => {
      assert.equal(error.code, "VALIDATION");
      assert.equal(error.status, 400);
      assert.match(error.fields.email, /needs an @/);
      return true;
    });
  });
});

describe("nameIssue", () => {
  it("accepts an ordinary name", () => {
    assert.equal(nameIssue("Sam Rahman"), "");
  });

  it("uses the label it was given so the message fits the form", () => {
    assert.match(nameIssue("", "name this order is for"), /name this order is for/);
  });

  it("rejects a single character and an oversized name", () => {
    assert.match(nameIssue("a"), /at least 2 characters/);
    assert.match(nameIssue("x".repeat(121)), /under 120 characters/);
  });

  it("trims before measuring", () => {
    assert.match(nameIssue("   "), /Please add/);
    assert.equal(requireName("  Sam  "), "Sam");
  });
});

describe("passwordIssue", () => {
  it("accepts a decent password", () => {
    assert.equal(passwordIssue("plumtree harvest"), "");
  });

  it("reports the length actually supplied", () => {
    assert.match(passwordIssue("abc"), new RegExp(`at least ${PASSWORD_MIN} characters`));
    assert.match(passwordIssue("abc"), /this one has 3 characters/);
    assert.match(passwordIssue("a"), /this one has 1 character/);
  });

  it("rejects guessable passwords even when they are long enough", () => {
    assert.match(passwordIssue("password123"), /guessed first in an attack/);
    assert.match(passwordIssue("aaaaaaaa"), /guessed first in an attack/);
    assert.match(passwordIssue("12345678"), /guessed first in an attack/);
  });

  it("rejects a password built from the account's own name or email", () => {
    const context = { email: "taimoor@example.com", name: "Taimoor Khan" };
    assert.match(passwordIssue("taimoor2024", context), /repeats your own name or email/);
    assert.match(passwordIssue("xxKhan-1990", context), /repeats your own name or email/);
    assert.equal(passwordIssue("plumtree harvest", context), "");
  });

  it("joins several failures into one sentence", () => {
    const message = passwordIssue("sam", { name: "Sam" });
    assert.match(message, new RegExp(`at least ${PASSWORD_MIN} characters`));
    assert.match(message, /repeats your own name/);
    assert.match(message, / and /);
  });

  it("asks for a password before complaining about it", () => {
    assert.equal(passwordIssue(""), "Please choose a password.");
  });

  it("throws with the field attached", () => {
    assert.throws(() => requirePassword("abc"), (error) => {
      assert.equal(error.code, "VALIDATION");
      assert.match(error.fields.password, /at least 8 characters/);
      return true;
    });
  });
});

describe("normalizeCountry", () => {
  it("accepts a known code in any casing", () => {
    assert.equal(normalizeCountry("us"), "US");
    assert.equal(normalizeCountry(" CA "), "CA");
  });

  it("returns empty for a country we do not ship to", () => {
    assert.equal(normalizeCountry("Narnia"), "");
    assert.equal(normalizeCountry(""), "");
  });
});

describe("postalIssue", () => {
  it("accepts codes that match the country", () => {
    assert.equal(postalIssue("11201", "US"), "");
    assert.equal(postalIssue("11201-1234", "US"), "");
    assert.equal(postalIssue("M5V 2T6", "CA"), "");
    assert.equal(postalIssue("SW1A 1AA", "GB"), "");
    assert.equal(postalIssue("74000", "PK"), "");
  });

  it("rejects a code in the wrong shape and says what the shape is", () => {
    assert.match(postalIssue("!!!", "US"), /five digits/);
    assert.match(postalIssue("11201", "CA"), /M5V 2T6/);
  });

  it("requires a code where one exists", () => {
    assert.match(postalIssue("", "US"), /Please add the postal code/);
  });

  it("leaves it optional where the country has no postal system", () => {
    assert.equal(postalIssue("", "AE"), "");
  });

  it("only length-checks a country it has no pattern for", () => {
    assert.equal(postalIssue("AB12", "OTHER"), "");
    assert.match(postalIssue("1", "OTHER"), /too short/);
  });

  it("throws with the field attached", () => {
    assert.throws(() => requirePostal("!!!", "US"), (error) => {
      assert.match(error.fields.zip, /five digits/);
      return true;
    });
  });
});

describe("rejectFields", () => {
  it("does nothing when there is nothing wrong", () => {
    assert.doesNotThrow(() => rejectFields({}));
    assert.doesNotThrow(() => rejectFields(null));
  });

  it("carries every field on a single error", () => {
    assert.throws(
      () => rejectFields({ email: "bad email", password: "bad password" }),
      (error) => {
        assert.equal(error.status, 400);
        assert.equal(error.code, "VALIDATION");
        assert.equal(error.message, "2 details still need your attention.");
        assert.deepEqual(error.fields, {
          email: "bad email",
          password: "bad password",
        });
        return true;
      }
    );
  });

  it("uses the singular for a lone problem", () => {
    assert.throws(() => rejectFields({ email: "bad" }), {
      message: "One detail still needs your attention.",
    });
  });
});
