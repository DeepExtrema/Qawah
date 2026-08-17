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

function requireEmail(value) {
  const email = requireString(value, "Email", 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError("Please enter a valid email.", 400, "VALIDATION");
  }
  return email;
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
  isNonEmptyString,
  requireString,
  requireEmail,
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
