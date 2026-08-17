/**
 * Path translation between Netlify Functions and Express.
 *
 * A Netlify redirect rewrites the URL before the function sees it, so a
 * request for /api/products arrives with an event path of
 * /.netlify/functions/api/products. Express declares its routes under /api,
 * so the original path has to be restored or every route would 404.
 *
 * Kept in its own module so the rule is unit-testable without loading Express,
 * Mongoose, or the serverless adapter.
 */

const FUNCTION_PREFIX = "/.netlify/functions/api";

/**
 * @param {{rawUrl?: string, path?: string}} event Netlify function event
 * @returns {string} the path Express should route on
 */
function originalPath(event) {
  // rawUrl holds the URL the browser actually requested and is the reliable
  // source when Netlify provides it.
  if (event && event.rawUrl) {
    try {
      return new URL(event.rawUrl).pathname;
    } catch {
      /* malformed; fall through to the prefix fallback */
    }
  }

  const raw = (event && event.path) || "/";
  if (raw.startsWith(FUNCTION_PREFIX)) {
    const rest = raw.slice(FUNCTION_PREFIX.length) || "/";
    // Everything reaching this function came through the /api/* rewrite, so
    // the remainder is whatever followed /api, unless it already carries it.
    return rest.startsWith("/api") ? rest : `/api${rest === "/" ? "" : rest}`;
  }
  return raw;
}

module.exports = { FUNCTION_PREFIX, originalPath };
