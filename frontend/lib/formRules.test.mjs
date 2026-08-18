import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PASSWORD_MIN,
  countryName,
  detectPostalCountry,
  emailProblem,
  emailSuggestion,
  isPickup,
  normalizeCountry,
  passwordChecks,
  passwordProblem,
  regionLabel,
  validateCheckout,
  validateRegister,
} from "./formRules.mjs";

function checkById(password, id, context) {
  return passwordChecks(password, context).find((check) => check.id === id);
}

describe("emailProblem", () => {
  it("accepts an ordinary address", () => {
    assert.equal(emailProblem("name@example.com"), "");
    assert.equal(emailProblem("  name@example.com  "), "");
  });

  it("names the missing @ rather than saying invalid", () => {
    // The case from the bug report: "aaaaaa" typed into the email box.
    assert.match(emailProblem("aaaaaa"), /needs an @/);
  });

  it("distinguishes each way an address can be malformed", () => {
    assert.match(emailProblem(""), /Please add an email/);
    assert.match(emailProblem("a b@example.com"), /cannot contain spaces/);
    assert.match(emailProblem("a@@example.com"), /more than one @/);
    assert.match(emailProblem("@example.com"), /nothing before the @/);
    assert.match(emailProblem("name@"), /after the @/);
    assert.match(emailProblem("name@example"), /needs a dot/);
    assert.match(emailProblem("name@example..com"), /two dots in a row/);
    assert.match(emailProblem("name@.example.com"), /start or end with a dot/);
    assert.match(emailProblem("name@example.c"), /too short/);
  });

  it("rejects an address longer than the column allows", () => {
    const long = `${"a".repeat(320)}@example.com`;
    assert.match(emailProblem(long), /longer than 320/);
  });
});

describe("emailSuggestion", () => {
  it("offers a fix for a commonly mistyped domain", () => {
    assert.equal(emailSuggestion("sam@gmial.com"), "Did you mean sam@gmail.com?");
    assert.equal(emailSuggestion("sam@hotmail.co"), "Did you mean sam@hotmail.com?");
  });

  it("stays quiet for a domain it does not recognise as a typo", () => {
    assert.equal(emailSuggestion("sam@qahwasupply.com"), "");
  });

  it("stays quiet while the address is still malformed", () => {
    // Nagging about the domain before there is an @ would be noise.
    assert.equal(emailSuggestion("sam@gmial"), "");
    assert.equal(emailSuggestion(""), "");
  });
});

describe("passwordChecks", () => {
  it("marks nothing satisfied for an empty password", () => {
    assert.ok(passwordChecks("").every((check) => check.ok === false));
  });

  it("passes every check for a decent password", () => {
    const checks = passwordChecks("plumtree harvest", {
      email: "sam@example.com",
      name: "Sam",
    });
    assert.ok(checks.every((check) => check.ok));
  });

  it("counts length against PASSWORD_MIN", () => {
    assert.equal(checkById("a".repeat(PASSWORD_MIN - 1), "length").ok, false);
    assert.equal(checkById("plumtree", "length").ok, true);
  });

  it("catches guessable passwords, including padded and repeated ones", () => {
    assert.equal(checkById("password", "common").ok, false);
    assert.equal(checkById("password123", "common").ok, false);
    assert.equal(checkById("aaaaaaaa", "common").ok, false);
    assert.equal(checkById("12345678", "common").ok, false);
    assert.equal(checkById("abcdefgh", "common").ok, false);
    assert.equal(checkById("plumtree harvest", "common").ok, true);
  });

  it("catches a password built from the name or email", () => {
    const context = { email: "taimoor@example.com", name: "Taimoor Khan" };
    assert.equal(checkById("taimoor2024", "personal", context).ok, false);
    assert.equal(checkById("xKhan-1990x", "personal", context).ok, false);
    assert.equal(checkById("plumtree harvest", "personal", context).ok, true);
  });

  it("ignores name fragments too short to mean anything", () => {
    // A two-letter name would flag almost every password ever typed.
    assert.equal(checkById("plumtree harvest", "personal", { name: "Al" }).ok, true);
  });
});

describe("passwordProblem", () => {
  it("is silent for a good password", () => {
    assert.equal(passwordProblem("plumtree harvest"), "");
  });

  it("reports the actual length so the gap is obvious", () => {
    assert.match(passwordProblem("abc"), /this one has 3 characters/);
    assert.match(passwordProblem("a"), /this one has 1 character/);
  });

  it("joins several failures into one readable sentence", () => {
    const message = passwordProblem("sam", { name: "Sam" });
    assert.match(message, /at least 8 characters/);
    assert.match(message, /repeats your own name/);
    assert.match(message, / and /);
  });

  it("asks for a password before complaining about it", () => {
    assert.equal(passwordProblem(""), "Please choose a password.");
  });
});

describe("normalizeCountry", () => {
  it("accepts codes and the names people actually type", () => {
    assert.equal(normalizeCountry("us"), "US");
    assert.equal(normalizeCountry("USA"), "US");
    assert.equal(normalizeCountry("United States"), "US");
    assert.equal(normalizeCountry("uk"), "GB");
    assert.equal(normalizeCountry("Pakistan"), "PK");
  });

  it("returns empty for anything unrecognised", () => {
    assert.equal(normalizeCountry(""), "");
    assert.equal(normalizeCountry("Narnia"), "");
  });

  it("names a country back for use in messages", () => {
    assert.equal(countryName("us"), "United States");
    assert.equal(countryName("Narnia"), "");
  });
});

describe("detectPostalCountry", () => {
  it("recognises distinctive formats", () => {
    assert.equal(detectPostalCountry("M5V 2T6"), "CA");
    assert.equal(detectPostalCountry("SW1A 1AA"), "GB");
    assert.equal(detectPostalCountry("1012 AB"), "NL");
  });

  it("refuses to guess when a shape belongs to several countries", () => {
    // 75001 is a valid Paris, Berlin-shaped, Karachi-shaped and US-shaped code.
    // Naming one of them would be confidently wrong.
    assert.equal(detectPostalCountry("75001"), "");
    assert.equal(detectPostalCountry(""), "");
    assert.equal(detectPostalCountry("!!!"), "");
  });
});

describe("regionLabel", () => {
  it("uses the word the country actually uses", () => {
    assert.equal(regionLabel("US"), "State");
    assert.equal(regionLabel("CA"), "Province");
    assert.equal(regionLabel("FR"), "Region");
  });
});

describe("isPickup", () => {
  it("reads the id off a string or a method object", () => {
    assert.equal(isPickup("pickup"), true);
    assert.equal(isPickup({ id: "pickup", label: "Local pickup" }), true);
    assert.equal(isPickup("std"), false);
    assert.equal(isPickup(""), false);
    assert.equal(isPickup(null), false);
  });
});

describe("validateRegister", () => {
  const good = {
    name: "Sam Rahman",
    email: "sam@example.com",
    password: "plumtree harvest",
    confirmPassword: "plumtree harvest",
  };

  it("passes a complete form", () => {
    const result = validateRegister(good);
    assert.equal(result.valid, true);
    assert.deepEqual(result.missing, []);
  });

  it("reports every problem at once, not one at a time", () => {
    const result = validateRegister({});
    assert.equal(result.valid, false);
    assert.deepEqual(
      result.missing.map((item) => item.field),
      ["name", "email", "password", "confirmPassword"]
    );
  });

  it("lists problems in the order the fields appear on screen", () => {
    const result = validateRegister({ ...good, name: "", email: "nope" });
    assert.deepEqual(
      result.missing.map((item) => item.field),
      ["name", "email"]
    );
  });

  it("catches a confirmation that does not match", () => {
    const result = validateRegister({ ...good, confirmPassword: "plumtree harvst" });
    assert.match(result.fields.confirmPassword, /do not match/);
  });

  it("asks for the confirmation before comparing it", () => {
    const result = validateRegister({ ...good, confirmPassword: "" });
    assert.match(result.fields.confirmPassword, /type the password a second time/);
  });

  it("carries the email typo hint as advice, not as a blocker", () => {
    const result = validateRegister({ ...good, email: "sam@gmial.com" });
    assert.equal(result.valid, true);
    assert.deepEqual(result.notes, ["Did you mean sam@gmail.com?"]);
  });

  it("reproduces the reported bug: a name of a and an email of aaaaaa", () => {
    const result = validateRegister({
      name: "a",
      email: "aaaaaa",
      password: "abc",
      confirmPassword: "abc",
    });
    assert.equal(result.valid, false);
    assert.match(result.fields.name, /at least 2 characters/);
    assert.match(result.fields.email, /needs an @/);
    assert.match(result.fields.password, /at least 8 characters/);
  });
});

describe("validateCheckout", () => {
  const good = {
    customerName: "Sam Rahman",
    customerEmail: "sam@example.com",
    address1: "12 Wythe Ave",
    city: "Brooklyn",
    region: "NY",
    zip: "11201",
    country: "US",
  };
  const shipped = { shippingMethod: "std", cartCount: 2 };

  it("passes a complete US address", () => {
    assert.equal(validateCheckout(good, shipped).valid, true);
  });

  it("reports every missing piece at once", () => {
    const result = validateCheckout({}, shipped);
    // No region: until a country is chosen there is no way to know whether one
    // is part of the address, and inventing the requirement would be worse than
    // asking for it a moment later.
    assert.deepEqual(
      result.missing.map((item) => item.field),
      ["customerEmail", "customerName", "country", "address1", "city", "zip"]
    );
  });

  it("puts an empty bag in the same list as everything else", () => {
    const result = validateCheckout(good, { ...shipped, cartCount: 0 });
    assert.equal(result.valid, false);
    assert.match(result.fields.cart, /bag is empty/);
  });

  it("checks the postal code against the chosen country", () => {
    const result = validateCheckout({ ...good, zip: "!!!" }, shipped);
    assert.match(result.fields.zip, /five digits/);
  });

  it("accepts the ZIP+4 form", () => {
    assert.equal(validateCheckout({ ...good, zip: "11201-1234" }, shipped).valid, true);
  });

  it("names the mismatch when a code belongs to another country", () => {
    const result = validateCheckout({ ...good, zip: "M5V 2T6" }, shipped);
    assert.match(
      result.fields.zip,
      /looks like a postal code for Canada, but the country is set to United States/
    );
  });

  it("falls back to the generic hint when the code matches nothing", () => {
    const result = validateCheckout({ ...good, zip: "1234567" }, shipped);
    assert.match(result.fields.zip, /does not look right/);
  });

  it("requires the region only where it is part of the address", () => {
    assert.match(validateCheckout({ ...good, region: "" }, shipped).fields.region, /state/);

    const canada = { ...good, country: "CA", zip: "M5V 2T6", region: "" };
    assert.match(validateCheckout(canada, shipped).fields.region, /province/);

    const france = { ...good, country: "FR", zip: "75001", region: "" };
    assert.equal(validateCheckout(france, shipped).valid, true);
  });

  it("leaves the postal code optional where the country has none", () => {
    const uae = { ...good, country: "AE", zip: "", region: "" };
    assert.equal(validateCheckout(uae, shipped).valid, true);
  });

  it("accepts an unlisted country with a loose check", () => {
    const other = { ...good, country: "OTHER", zip: "AB12", region: "" };
    assert.equal(validateCheckout(other, shipped).valid, true);
    assert.match(validateCheckout({ ...other, zip: "1" }, shipped).fields.zip, /too short/);
  });

  it("says so when the country is typed but not one we ship to", () => {
    const result = validateCheckout({ ...good, country: "Narnia" }, shipped);
    assert.match(result.fields.country, /do not ship to that country/);
  });

  it("drops the address entirely for local pickup", () => {
    const bare = {
      customerName: "Sam Rahman",
      customerEmail: "sam@example.com",
    };
    const result = validateCheckout(bare, { shippingMethod: "pickup", cartCount: 1 });
    assert.equal(result.valid, true);
  });

  it("explains that a pickup will not use the address already typed", () => {
    const result = validateCheckout(good, { shippingMethod: "pickup", cartCount: 1 });
    assert.equal(result.valid, true);
    assert.match(result.notes[0], /local pickup, so the delivery address you entered will not be used/);
  });

  it("still needs contact details for a pickup", () => {
    const result = validateCheckout(
      { customerEmail: "aaaaaa" },
      { shippingMethod: "pickup", cartCount: 1 }
    );
    assert.equal(result.valid, false);
    assert.deepEqual(
      result.missing.map((item) => item.field),
      ["customerEmail", "customerName"]
    );
  });
});
