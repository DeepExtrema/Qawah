/**
 * The Netlify Function that serves the API.
 *
 * All the logic lives in backend/serverless.js. Keeping it there rather than
 * here means express, mongoose, and serverless-http resolve from
 * backend/node_modules, which the Netlify build installs.
 *
 * netlify.toml rewrites /api/* to this function.
 */

module.exports = require("../../backend/serverless");
