/*
 * Validation rules for the two forms that create something: registration and
 * checkout.
 *
 * React-free and fetch-free on purpose, matching waitlist.mjs / lowStock.mjs,
 * so every rule below is testable with `node --test`.
 *
 * The guiding rule for the copy: name the defect, never the category. "Invalid
 * email" tells somebody nothing they did not already suspect. "An email
 * address needs an @ - for example name@example.com" tells them which key they
 * missed. Every message here should be actionable on its own.
 *
 * These rules are mirrored in backend/utils/validate.js. The browser is not a
 * security boundary, and this file ships to the client where anyone can edit
 * it, so nothing here is load-bearing for correctness on the server.
 */

export const PASSWORD_MIN = 8;
export const NAME_MAX = 120;
export const EMAIL_MAX = 320;

/* ---------------------------------------------------------------- email -- */

// Only the domains people actually mistype often. A fuzzy edit-distance match
// over every domain on earth produces confident nonsense ("did you mean
// gmail.com?" for a legitimate corporate address), so this stays a fixed list.
const DOMAIN_TYPOS = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.con": "gmail.com",
  "gmails.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "yahooo.com": "yahoo.com",
  "yaho.com": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "outlook.co": "outlook.com",
  "icloud.co": "icloud.com",
  "iclould.com": "icloud.com",
};

export function emailProblem(value) {
  const email = String(value || "").trim();

  if (!email) return "Please add an email address so we can send your receipt.";
  if (email.length > EMAIL_MAX) {
    return `That address is longer than ${EMAIL_MAX} characters.`;
  }
  if (/\s/.test(email)) return "Email addresses cannot contain spaces.";

  const parts = email.split("@");
  if (parts.length === 1) {
    return "An email address needs an @ - for example name@example.com.";
  }
  if (parts.length > 2) return "That address has more than one @ in it.";

  const [local, domain] = parts;
  if (!local) return "There is nothing before the @ - try name@example.com.";
  if (!domain) return "Add the part after the @, like gmail.com.";
  if (domain.startsWith(".") || domain.endsWith(".")) {
    return "The part after the @ cannot start or end with a dot.";
  }
  if (!domain.includes(".")) {
    return "The part after the @ needs a dot in it, like example.com.";
  }
  if (domain.includes("..")) {
    return "The part after the @ has two dots in a row.";
  }
  if (domain.slice(domain.lastIndexOf(".") + 1).length < 2) {
    return "The bit after the last dot looks too short - did you mean .com?";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "That does not look like a valid email address.";
  }
  return "";
}

// Advice, not an error: a real address can look like a typo, so this never
// blocks a submit. It only ever appears once the address is otherwise valid.
export function emailSuggestion(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!email || emailProblem(email)) return "";
  const at = email.lastIndexOf("@");
  const fixed = DOMAIN_TYPOS[email.slice(at + 1)];
  if (!fixed) return "";
  return `Did you mean ${email.slice(0, at)}@${fixed}?`;
}

/* ------------------------------------------------------------- password -- */

const COMMON_PASSWORDS = new Set([
  "password", "passw0rd", "password1", "password123", "letmein", "welcome",
  "qwerty", "qwertyui", "qwerty123", "iloveyou", "sunshine", "princess",
  "football", "baseball", "superman", "monkey", "dragon", "master", "shadow",
  "trustno1", "admin", "admin123", "administrator", "changeme", "secret",
  "login", "abc123", "abcd1234", "1q2w3e4r", "zaq12wsx", "qazwsx",
  "coffee", "coffee123", "espresso", "qahwa", "qahwa123",
]);

function isSequentialRun(value) {
  if (value.length < 4) return false;
  let ascending = true;
  let descending = true;
  for (let i = 1; i < value.length; i += 1) {
    const step = value.charCodeAt(i) - value.charCodeAt(i - 1);
    if (step !== 1) ascending = false;
    if (step !== -1) descending = false;
  }
  return ascending || descending;
}

function isCommonPassword(value) {
  const lower = value.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) return true;
  if (/^(.)\1+$/.test(value)) return true;
  if (isSequentialRun(lower)) return true;
  // "password123" and "coffee!!" are the same password wearing a costume.
  const stem = lower.replace(/[^a-z]/g, "");
  return stem.length >= 4 && COMMON_PASSWORDS.has(stem);
}

function containsPersonal(value, { email = "", name = "" } = {}) {
  const lower = value.toLowerCase();
  const tokens = [];
  const local = String(email || "").split("@")[0];
  if (local) tokens.push(local.toLowerCase());
  String(name || "")
    .split(/\s+/)
    .forEach((token) => {
      if (token) tokens.push(token.toLowerCase());
    });
  return tokens.some((token) => token.length >= 3 && lower.includes(token));
}

// A live checklist, for while somebody is still typing. Encouraging by design:
// it shows what is already satisfied, not only what is wrong.
export function passwordChecks(password, context = {}) {
  const value = String(password || "");
  const typed = value.length > 0;
  return [
    {
      id: "length",
      label: `At least ${PASSWORD_MIN} characters`,
      ok: value.length >= PASSWORD_MIN,
    },
    {
      id: "common",
      label: "Not an easily guessed password",
      ok: typed && !isCommonPassword(value),
    },
    {
      id: "personal",
      label: "Does not repeat your name or email",
      ok: typed && !containsPersonal(value, context),
    },
  ];
}

function joinList(items) {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

// The same rules as passwordChecks, in corrective mood, for after a submit.
export function passwordProblem(password, context = {}) {
  const value = String(password || "");
  if (!value) return "Please choose a password.";

  const failed = passwordChecks(value, context).filter((check) => !check.ok);
  if (failed.length === 0) return "";

  const reasons = failed.map((check) => {
    if (check.id === "length") {
      const unit = value.length === 1 ? "character" : "characters";
      return `it needs at least ${PASSWORD_MIN} characters (this one has ${value.length} ${unit})`;
    }
    if (check.id === "common") {
      return "it is one of the passwords guessed first in an attack";
    }
    return "it repeats your own name or email address";
  });
  return `That password will not work yet - ${joinList(reasons)}.`;
}

/* ------------------------------------------------------------ countries -- */

export const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "PK", name: "Pakistan" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "OTHER", name: "Somewhere else" },
];

/*
 * `pattern` absent and `optional` false means "required, but we do not know the
 * shape" - a length check only, so an unanticipated country is never blocked.
 * `optional: true` is for countries with no postal system at all.
 * `region` names the sub-national field where one is part of the address; it
 * doubles as that field's label, so a US customer is asked for a State and a
 * Canadian for a Province.
 */
export const POSTAL_RULES = {
  US: {
    pattern: /^\d{5}(-\d{4})?$/,
    hint: "US ZIP codes are five digits, like 11201.",
    region: "State",
  },
  CA: {
    pattern: /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/,
    hint: "Canadian postal codes look like M5V 2T6.",
    region: "Province",
  },
  GB: {
    pattern: /^[A-Za-z]{1,2}\d[A-Za-z\d]? ?\d[A-Za-z]{2}$/,
    hint: "UK postcodes look like SW1A 1AA.",
  },
  IE: {
    pattern: /^[A-Za-z]\d[A-Za-z\d] ?[A-Za-z\d]{4}$/,
    hint: "Irish Eircodes look like D02 AF30.",
  },
  PK: {
    pattern: /^\d{5}$/,
    hint: "Pakistani postal codes are five digits, like 74000.",
  },
  SA: {
    pattern: /^\d{5}(-\d{4})?$/,
    hint: "Saudi postal codes are five digits, like 11564.",
  },
  AE: {
    optional: true,
    hint: "The UAE does not use postal codes, so you can leave this blank.",
  },
  AU: {
    pattern: /^\d{4}$/,
    hint: "Australian postcodes are four digits, like 3000.",
    region: "State",
  },
  DE: {
    pattern: /^\d{5}$/,
    hint: "German postal codes are five digits, like 10115.",
  },
  FR: {
    pattern: /^\d{5}$/,
    hint: "French postal codes are five digits, like 75001.",
  },
  NL: {
    pattern: /^\d{4} ?[A-Za-z]{2}$/,
    hint: "Dutch postal codes look like 1012 AB.",
  },
  OTHER: { hint: "" },
};

const COUNTRY_ALIASES = {
  usa: "US",
  "united states": "US",
  "united states of america": "US",
  america: "US",
  uk: "GB",
  "united kingdom": "GB",
  "great britain": "GB",
  britain: "GB",
  england: "GB",
  scotland: "GB",
  wales: "GB",
  canada: "CA",
  ireland: "IE",
  eire: "IE",
  pakistan: "PK",
  uae: "AE",
  "united arab emirates": "AE",
  "saudi arabia": "SA",
  ksa: "SA",
  australia: "AU",
  germany: "DE",
  deutschland: "DE",
  france: "FR",
  netherlands: "NL",
  holland: "NL",
};

export function normalizeCountry(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const upper = raw.toUpperCase();
  if (POSTAL_RULES[upper]) return upper;
  return COUNTRY_ALIASES[raw.toLowerCase()] || "";
}

export function countryName(code) {
  const match = COUNTRIES.find(
    (country) => country.code === normalizeCountry(code)
  );
  return match ? match.name : "";
}

/*
 * Which country's format does this postal code look like?
 *
 * Returns "" unless exactly one country matches. Any bare five digits fits the
 * US, Pakistan, Germany, France and Saudi Arabia at once, so guessing there
 * would produce a confidently wrong warning. Only distinctive shapes - M5V 2T6,
 * SW1A 1AA, 1012 AB - ever come back from this.
 */
export function detectPostalCountry(postal) {
  const value = String(postal || "").trim();
  if (!value) return "";
  const hits = Object.keys(POSTAL_RULES).filter((code) => {
    const rule = POSTAL_RULES[code];
    return rule.pattern && rule.pattern.test(value);
  });
  return hits.length === 1 ? hits[0] : "";
}

export function regionLabel(country) {
  const rule = POSTAL_RULES[normalizeCountry(country)];
  return (rule && rule.region) || "Region";
}

export function isPickup(shippingMethod) {
  if (!shippingMethod) return false;
  const id =
    typeof shippingMethod === "string" ? shippingMethod : shippingMethod.id;
  return String(id || "").toLowerCase() === "pickup";
}

/* -------------------------------------------------------------- summary -- */

/*
 * Turn a { field: message } map into the ordered list the summary block reads
 * from. Key order in the label map is presentation order, so the summary always
 * reads top-to-bottom in the same sequence the customer sees the fields --
 * being sent back up to a field you already passed is disorienting.
 *
 * Exported because the pages merge server-side errors into the same map before
 * summarizing, and the ordering has to stay identical either way.
 */
export function summarizeFields(fields = {}, labels = {}) {
  return Object.keys(labels)
    .filter((field) => fields[field])
    .map((field) => ({ field, label: labels[field], message: fields[field] }));
}

function summarize(fields, labels, notes = []) {
  const missing = summarizeFields(fields, labels);
  return { fields, missing, notes, valid: missing.length === 0 };
}

/* ------------------------------------------------------------- register -- */

export const REGISTER_LABELS = {
  name: "Name",
  email: "Email",
  password: "Password",
  confirmPassword: "Confirm password",
};

export function validateRegister(form = {}) {
  const fields = {};
  const name = String(form.name || "").trim();
  const email = String(form.email || "").trim();
  const password = String(form.password || "");
  const confirmPassword = String(form.confirmPassword || "");

  if (!name) {
    fields.name = "Please add the name this account should be under.";
  } else if (name.length < 2) {
    fields.name = "That is a little short - please use at least 2 characters.";
  } else if (name.length > NAME_MAX) {
    fields.name = `Please keep the name under ${NAME_MAX} characters.`;
  }

  const emailIssue = emailProblem(email);
  if (emailIssue) fields.email = emailIssue;

  const passwordIssue = passwordProblem(password, { email, name });
  if (passwordIssue) fields.password = passwordIssue;

  if (!confirmPassword) {
    fields.confirmPassword =
      "Please type the password a second time so we know it is what you meant.";
  } else if (confirmPassword !== password) {
    fields.confirmPassword = "These two passwords do not match yet.";
  }

  const notes = [];
  const suggestion = emailSuggestion(email);
  if (suggestion) notes.push(suggestion);

  return summarize(fields, REGISTER_LABELS, notes);
}

/* ------------------------------------------------------------- checkout -- */

export const CHECKOUT_LABELS = {
  cart: "Your bag",
  customerEmail: "Email",
  customerName: "Name",
  country: "Country",
  address1: "Address",
  city: "City",
  region: "Region",
  zip: "Postal code",
};

export function validateCheckout(form = {}, options = {}) {
  const { shippingMethod = "", cartCount = 1 } = options;
  const pickup = isPickup(shippingMethod);
  const fields = {};
  const notes = [];

  if (cartCount < 1) {
    fields.cart = "Your bag is empty - add a lot before checking out.";
  }

  const email = String(form.customerEmail || "").trim();
  const emailIssue = emailProblem(email);
  if (emailIssue) fields.customerEmail = emailIssue;

  const name = String(form.customerName || "").trim();
  if (!name) {
    fields.customerName = "Please add the name this order is for.";
  } else if (name.length < 2) {
    fields.customerName =
      "That is a little short - please use at least 2 characters.";
  } else if (name.length > NAME_MAX) {
    fields.customerName = `Please keep the name under ${NAME_MAX} characters.`;
  }

  if (pickup) {
    // Nothing about the address matters for a pickup, so asking for it would be
    // the form inventing work. Say so rather than silently ignoring what they
    // already typed.
    if (form.address1 || form.city || form.zip) {
      notes.push(
        "You have chosen local pickup, so the delivery address you entered will not be used. Switch the method if you would like this delivered."
      );
    }
  } else {
    const country = normalizeCountry(form.country);
    const rule = POSTAL_RULES[country] || {};

    if (!country) {
      fields.country = String(form.country || "").trim()
        ? "We do not ship to that country yet - please pick one from the list."
        : "Please choose the country we are shipping to.";
    }

    if (!String(form.address1 || "").trim()) {
      fields.address1 = "Please add the street address, including the number.";
    }
    if (!String(form.city || "").trim()) {
      fields.city = "Please add the town or city.";
    }

    if (rule.region && !String(form.region || "").trim()) {
      fields.region = `We need the ${rule.region.toLowerCase()} for deliveries to ${countryName(
        country
      )}.`;
    }

    const postal = String(form.zip || "").trim();
    if (!postal) {
      if (!rule.optional) {
        fields.zip = rule.hint
          ? `Please add the postal code. ${rule.hint}`
          : "Please add the postal code.";
      }
    } else if (rule.pattern && !rule.pattern.test(postal)) {
      const looksLike = detectPostalCountry(postal);
      if (looksLike && looksLike !== country) {
        // "a Canada postal code" reads badly and a demonym table for every
        // country is not worth maintaining, so the country name goes after the
        // noun instead.
        fields.zip = `That looks like a postal code for ${countryName(
          looksLike
        )}, but the country is set to ${countryName(country)}.`;
      } else {
        fields.zip = `That postal code does not look right. ${rule.hint}`;
      }
    } else if (!rule.pattern && !rule.optional && postal.length < 2) {
      fields.zip = "That postal code looks too short.";
    }
  }

  const suggestion = emailSuggestion(email);
  if (suggestion) notes.push(suggestion);

  return summarize(fields, CHECKOUT_LABELS, notes);
}
