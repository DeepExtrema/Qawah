/**
 * Local development entry point: connects to MongoDB, then listens on a port.
 *
 * Production on Netlify does not use this file. There the same Express app is
 * invoked by netlify/functions/api.js, which has no port to bind.
 */

const { app, connectToDatabase, missingEnv } = require("./app");
const { PORT } = require("./utils/config");

// Fail fast on missing configuration. Without this, a missing JWT_SECRET only
// surfaces as a confusing 500 the first time someone tries to log in.
const missing = missingEnv();
if (missing.length) {
  console.error(
    `[config] Missing required environment variable(s): ${missing.join(", ")}\n` +
      "Copy backend/.env.example to backend/.env and fill in the values."
  );
  process.exit(1);
}

connectToDatabase()
  .then(() => {
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });
