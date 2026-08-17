/**
 * Turns a stored product imageUrl into a src the browser can actually load.
 *
 * Image URLs are stored as relative paths so a product row is not pinned to
 * whichever host wrote it. Two kinds exist:
 *
 *   /products/<slug>.png              a seeded catalogue file, shipped in
 *                                     frontend/public and served by the CDN
 *   /api/products/<id>/image?v=...    an administrator upload, stored in
 *                                     MongoDB and served by the API
 *
 * The /api form has to be resolved against the API origin, because in local
 * development the API is a separate process on port 5001. In production the
 * API is proxied on the same domain, so the origin is empty and the path is
 * already correct.
 *
 * This also repairs legacy rows written before URLs became relative, which
 * hold an absolute http://localhost:5001/... value. Those render as broken
 * images on any machine that is not the one that seeded them, so rather than
 * trusting every database to have been migrated, the bad origin is stripped
 * here as well.
 */

// Hosts that only ever mean "the machine that wrote this row", never a real
// destination for a visitor.
const LOCAL_HOST = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i;

export function resolveImageSrc(src, apiOrigin = "") {
  if (!src || typeof src !== "string") return "";

  let path = src.trim();
  if (!path) return "";

  // Legacy absolute URL pointing at a developer machine: keep only the path.
  if (LOCAL_HOST.test(path)) {
    path = path.replace(LOCAL_HOST, "");
    if (!path.startsWith("/")) path = `/${path}`;
  } else if (/^https?:\/\//i.test(path)) {
    // A genuine remote URL (for example a CDN). Leave it alone.
    return path;
  }

  // API-served images need the API origin in development, where the API is on
  // a different port. Static files under /products are served by the site.
  if (path.startsWith("/api/")) {
    return `${apiOrigin}${path}`;
  }

  return path.startsWith("/") ? path : `/${path}`;
}
