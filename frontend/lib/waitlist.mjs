/*
 * Pure helpers for the sold-out waitlist ("Notify me when this is back").
 *
 * Kept free of React and fetch so the identity rules below can be tested
 * directly with `node --test`.
 *
 * Identity: a lot is keyed by its SLUG, not its _id. mergeWithApi() swaps
 * _id from the mock string ("lot-haraaz-2") to a real Mongo id whenever
 * /api/products answers, so an _id-keyed list would split in two the moment
 * the backend came up or went down. The slug is stable in both modes.
 */

export function waitlistKey(product) {
  if (!product) return "";
  return String(product.slug || product.mockId || product._id || "").trim();
}

export function hasJoined(entries, product) {
  const key = waitlistKey(product);
  if (!key) return false;
  return (entries || []).some(
    (entry) => String(entry?.productKey || "") === key
  );
}

export function addJoined(entries, entry) {
  const key = String(entry?.productKey || "").trim();
  if (!key) return entries || [];
  // Newest entry wins, so re-joining with a corrected email replaces the old
  // address instead of leaving a stale duplicate behind.
  return [
    { ...entry, productKey: key },
    ...(entries || []).filter((item) => String(item?.productKey || "") !== key),
  ];
}

export function removeJoined(entries, product) {
  const key = waitlistKey(product);
  if (!key) return entries || [];
  return (entries || []).filter(
    (entry) => String(entry?.productKey || "") !== key
  );
}

export function notifyLabel({ joined, pending } = {}) {
  if (pending) return "Joining…";
  return joined ? "On list" : "Notify";
}
