/**
 * Serverless adapter for the Express API.
 *
 * This lives inside backend/ rather than in netlify/functions/ so that
 * `serverless-http`, `express`, and `mongoose` all resolve from
 * backend/node_modules. netlify/functions/api.js is a one-line re-export of
 * this module, which is what Netlify actually deploys.
 *
 * The Express app itself is untouched. app.js exports it without calling
 * listen(), and serverless-http adapts the function's request and response
 * objects to the ones Express expects.
 */

const serverless = require("serverless-http");
const { app, connectToDatabase, missingEnv } = require("./app");
const { originalPath } = require("./utils/functionPath");

// Built once per container, not per request.
const handler = serverless(app, {
  // Product images are returned as raw bytes, so they must survive the
  // function boundary base64-encoded rather than being mangled as UTF-8.
  binary: ["image/*", "application/octet-stream"],
});

function jsonError(statusCode, message, code) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    // The same envelope the Express error handler uses, so the frontend's
    // apiError() helper reads these exactly like any other failure.
    body: JSON.stringify({ error: { message, code }, message }),
  };
}

exports.handler = async (event, context) => {
  /*
   * Return as soon as the handler resolves instead of waiting for the event
   * loop to drain. Without this every call blocks until the function times
   * out, because the pooled MongoDB connection is deliberately left open for
   * the next invocation.
   */
  context.callbackWaitsForEmptyEventLoop = false;

  const missing = missingEnv();
  if (missing.length) {
    // Misconfiguration is reported, not crashed on. Crashing would hand the
    // browser an opaque 502 with nothing useful in it.
    console.error(`[config] Missing environment variable(s): ${missing.join(", ")}`);
    return jsonError(
      500,
      "The server is not configured correctly. Set MONGO_URI and JWT_SECRET in the Netlify site settings.",
      "CONFIG_MISSING"
    );
  }

  try {
    await connectToDatabase();
  } catch (error) {
    console.error("[db] Connection failed:", error.message);
    return jsonError(
      503,
      "Could not reach the database. Please try again in a moment.",
      "DB_UNAVAILABLE"
    );
  }

  return handler({ ...event, path: originalPath(event) }, context);
};
