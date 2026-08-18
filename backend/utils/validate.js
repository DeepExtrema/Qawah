const AppError = require("./AppError");

function isNonEmptyString(value, max = 500) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}

function requireString(value, field, max = 500) {
  if (!isNonEmptyString(value, max)) {
    throw new AppError(`${field} is required.`, 400, "VALIDATION");
  }
  return value.trim();
}

/*
 * The rules below are mirrored in frontend/lib/formRules.mjs. They are written
 * out twice on purpose: that file is ESM inside the Next.js package and ships
 * to the browser where anyone can edit it, so it cannot be the authority. The
 * copy here is.
 *
 * Each rule comes in two forms. The `*Issue` functions return a message or an
 * empty string, so a route can collect every problem with a submission and
 * report them together. The `require*` wrappers throw on the first failure, for
 * the routes that only need one field checked.
 */

const PASSWORD_MIN = 8;
const NAME_MAX = 120;
const EMAIL_MAX = 320;

function emailIssue(value) {
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
  if (domain.includes("..")) return "The part after the @ has two dots in a row.";
  if (domain.slice(domain.lastIndexOf(".") + 1).length < 2) {
    return "The bit after the last dot looks too short - did you mean .com?";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "That does not look like a valid email address.";
  }
  return "";
}

function requireEmail(value) {
  const issue = emailIssue(value);
  if (issue) throw new AppError(issue, 400, "VALIDATION", { email: issue });
  return String(value).trim().toLowerCase();
}

function nameIssue(value, label = "name", max = NAME_MAX) {
  const name = String(value || "").trim();
  if (!name) return `Please add the ${label}.`;
  if (name.length < 2) {
    return "That is a little short - please use at least 2 characters.";
  }
  if (name.length > max) return `Please keep the ${label} under ${max} characters.`;
  return "";
}

function requireName(value, label = "name", max = NAME_MAX) {
  const issue = nameIssue(value, label, max);
  if (issue) throw new AppError(issue, 400, "VALIDATION", { name: issue });
  return String(value).trim();
}

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

function passwordIssue(value, context = {}) {
  const password = String(value || "");
  if (!password) return "Please choose a password.";

  const reasons = [];
  if (password.length < PASSWORD_MIN) {
    const unit = password.length === 1 ? "character" : "characters";
    reasons.push(
      `it needs at least ${PASSWORD_MIN} characters (this one has ${password.length} ${unit})`
    );
  }
  if (isCommonPassword(password)) {
    reasons.push("it is one of the passwords guessed first in an attack");
  }
  if (containsPersonal(password, context)) {
    reasons.push("it repeats your own name or email address");
  }
  if (reasons.length === 0) return "";

  const joined =
    reasons.length === 1
      ? reasons[0]
      : `${reasons.slice(0, -1).join(", ")} and ${reasons[reasons.length - 1]}`;
  return `That password will not work yet - ${joined}.`;
}

function requirePassword(value, context = {}) {
  const issue = passwordIssue(value, context);
  if (issue) throw new AppError(issue, 400, "VALIDATION", { password: issue });
  return String(value);
}

/*
 * Postal formats for the countries the storefront ships to. `optional` marks a
 * country with no postal system; a country absent from the table is required
 * but only length-checked, so an unanticipated destination is never blocked.
 */
const POSTAL_RULES = {
  US: { pattern: /^\d{5}(-\d{4})?$/, hint: "US ZIP codes are five digits, like 11201.", region: "State" },
  CA: { pattern: /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/, hint: "Canadian postal codes look like M5V 2T6.", region: "Province" },
  GB: { pattern: /^[A-Za-z]{1,2}\d[A-Za-z\d]? ?\d[A-Za-z]{2}$/, hint: "UK postcodes look like SW1A 1AA." },
  IE: { pattern: /^[A-Za-z]\d[A-Za-z\d] ?[A-Za-z\d]{4}$/, hint: "Irish Eircodes look like D02 AF30." },
  PK: { pattern: /^\d{5}$/, hint: "Pakistani postal codes are five digits, like 74000." },
  SA: { pattern: /^\d{5}(-\d{4})?$/, hint: "Saudi postal codes are five digits, like 11564." },
  AE: { optional: true, hint: "The UAE does not use postal codes." },
  AU: { pattern: /^\d{4}$/, hint: "Australian postcodes are four digits, like 3000.", region: "State" },
  DE: { pattern: /^\d{5}$/, hint: "German postal codes are five digits, like 10115." },
  FR: { pattern: /^\d{5}$/, hint: "French postal codes are five digits, like 75001." },
  NL: { pattern: /^\d{4} ?[A-Za-z]{2}$/, hint: "Dutch postal codes look like 1012 AB." },
  OTHER: { hint: "" },
};

function normalizeCountry(value) {
  const raw = String(value || "").trim().toUpperCase();
  return POSTAL_RULES[raw] ? raw : "";
}

function postalIssue(value, country) {
  const rule = POSTAL_RULES[normalizeCountry(country)] || {};
  const postal = String(value || "").trim();

  if (!postal) {
    if (rule.optional) return "";
    return rule.hint ? `Please add the postal code. ${rule.hint}` : "Please add the postal code.";
  }
  if (rule.pattern && !rule.pattern.test(postal)) {
    return `That postal code does not look right. ${rule.hint}`.trim();
  }
  if (!rule.pattern && !rule.optional && postal.length < 2) {
    return "That postal code looks too short.";
  }
  return "";
}

function requirePostal(value, country) {
  const issue = postalIssue(value, country);
  if (issue) throw new AppError(issue, 400, "VALIDATION", { zip: issue });
  return String(value || "").trim();
}

/*
 * Report every problem with a submission at once, keyed by field.
 *
 * Checking one rule at a time and returning on the first failure turns a form
 * into a guessing game: fix the name, resubmit, learn the email is wrong, fix
 * that, resubmit, learn the password is too short. Routes collect into a
 * { field: message } object and hand it here; a client pins each entry to its
 * own input. No-op when the object is empty, so it can be called unguarded.
 */
function rejectFields(fields) {
  const keys = Object.keys(fields || {});
  if (keys.length === 0) return;
  throw new AppError(
    keys.length === 1
      ? "One detail still needs your attention."
      : `${keys.length} details still need your attention.`,
    400,
    "VALIDATION",
    fields
  );
}

function toObjectIdString(value) {
  if (!value) return "";
  return String(value);
}

function isObjectId(value) {
  return /^[a-fA-F0-9]{24}$/.test(String(value || ""));
}

function requireObjectId(value, field = "id") {
  if (!isObjectId(value)) {
    throw new AppError(`Invalid ${field}.`, 400, "VALIDATION");
  }
  return String(value);
}

function toInt(value, fallback = 0) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clampRating(value) {
  const n = toInt(value, 0);
  if (n < 1 || n > 5) {
    throw new AppError("Rating must be between 1 and 5.", 400, "VALIDATION");
  }
  return n;
}

function requirePositiveQuantity(value) {
  const n = toInt(value, 0);
  if (n < 1) {
    throw new AppError("Quantity must be at least 1.", 400, "VALIDATION");
  }
  return n;
}

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

function isLowStock(inventory) {
  const n = Number(inventory);
  return n > 0 && n <= 8;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

module.exports = {
  PASSWORD_MIN,
  NAME_MAX,
  EMAIL_MAX,
  POSTAL_RULES,
  isNonEmptyString,
  requireString,
  emailIssue,
  requireEmail,
  nameIssue,
  requireName,
  passwordIssue,
  requirePassword,
  normalizeCountry,
  postalIssue,
  requirePostal,
  rejectFields,
  toObjectIdString,
  isObjectId,
  requireObjectId,
  toInt,
  toNumber,
  clampRating,
  requirePositiveQuantity,
  normalizeCode,
  isLowStock,
  slugify,
};
