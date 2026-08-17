/**
 * Central place to read environment configuration.
 *
 * Every value has a development-friendly default so a fresh clone runs with
 * only MONGO_URI and JWT_SECRET set, but nothing is hard-coded at the call
 * site. Deploying only means setting PUBLIC_API_URL and CLIENT_ORIGIN.
 */

const PORT = Number(process.env.PORT) || 5001;

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

// Origin the browser uses to reach this API. Product images are served from
// here, so the stored imageUrl must point at the deployed host, not localhost.
const PUBLIC_API_URL =
  trimSlash(process.env.PUBLIC_API_URL) || `http://localhost:${PORT}`;

// Origin allowed through CORS (the Next.js app).
const CLIENT_ORIGIN =
  trimSlash(process.env.CLIENT_ORIGIN) || "http://localhost:3000";

function productImageUrl(filename) {
  return `${PUBLIC_API_URL}/products/${filename}`;
}

module.exports = {
  PORT,
  PUBLIC_API_URL,
  CLIENT_ORIGIN,
  productImageUrl,
};
