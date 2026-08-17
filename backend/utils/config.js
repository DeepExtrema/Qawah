/**
 * Central place to read environment configuration.
 *
 * Every value has a development-friendly default so a fresh clone runs with
 * only MONGO_URI and JWT_SECRET set, but nothing is hard-coded at the call
 * site. Deploying only means setting PUBLIC_API_URL and CLIENT_ORIGIN.
 */

const PORT = Number(process.env.PORT) || 5001;

// Environment variables the application cannot start without.
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

/*
 * Netlify injects the deployed site's address as URL, and the unique
 * per-deploy address as DEPLOY_PRIME_URL. Using them as the fallback means a
 * Netlify deployment works with no manually configured origin at all, while an
 * explicitly set variable still wins.
 */
const NETLIFY_SITE_URL = trimSlash(
  process.env.PUBLIC_API_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL
);

// Origin the browser uses to reach this API. On Netlify the API is proxied
// under /api on the site's own domain, so this is the site itself. Uploaded
// and seeded image URLs are built from it, which is why it must not stay
// pointing at localhost once deployed.
const PUBLIC_API_URL = NETLIFY_SITE_URL || `http://localhost:${PORT}`;

// Origin allowed through CORS (the Next.js app). Same-origin requests on
// Netlify carry no Origin header and bypass CORS entirely; this matters for
// local development, where the frontend and API sit on different ports.
const CLIENT_ORIGIN =
  trimSlash(process.env.CLIENT_ORIGIN) ||
  NETLIFY_SITE_URL ||
  "http://localhost:3000";

/**
 * URL for a seeded product image file.
 *
 * Deliberately relative. These 18 files ship in the repository under
 * frontend/public/products, so the path resolves against whichever origin is
 * serving the page: localhost:3000 in development, the Netlify domain in
 * production. Storing an absolute URL would bake the seeding machine's
 * hostname into the database and break every image once deployed.
 */
function productImageUrl(filename) {
  return `/products/${filename}`;
}

/**
 * URL for an image an administrator uploaded.
 *
 * Also relative, for the same reason as productImageUrl: an absolute URL would
 * pin the row to whichever host happened to serve the upload. Uploads live in
 * MongoDB rather than on disk, so this path is served by the API. The frontend
 * resolves a /api/... path against its configured API origin, which is the
 * same origin in production and localhost:5001 in development.
 *
 * The version suffix busts any cached copy when an image is replaced.
 */
function uploadedImageUrl(productId, version) {
  const suffix = version ? `?v=${version}` : "";
  return `/api/products/${productId}/image${suffix}`;
}

module.exports = {
  PORT,
  REQUIRED_ENV,
  PUBLIC_API_URL,
  CLIENT_ORIGIN,
  productImageUrl,
  uploadedImageUrl,
};
