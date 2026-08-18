/**
 * Builds the Express application and owns the database connection.
 *
 * This module deliberately does NOT call app.listen(). Keeping the app
 * separate from the process that serves it means the exact same code runs
 * in two places:
 *
 *   - server.js         a long-lived Node process for local development
 *   - netlify/functions serverless invocations in production
 *
 * It also makes the app importable by tests without opening a port.
 */

require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const waitlistRoutes = require("./routes/waitlistRoutes");
const addressRoutes = require("./routes/addressRoutes");
const recentRoutes = require("./routes/recentRoutes");
const discountRoutes = require("./routes/discountRoutes");
const cartRoutes = require("./routes/cartRoutes");
const shippingRoutes = require("./routes/shippingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const errorHandler = require("./middleware/errorHandler");
const { CLIENT_ORIGIN, REQUIRED_ENV } = require("./utils/config");

const app = express();

// Same-origin requests (the Netlify deployment, where the API is proxied under
// /api on the site's own domain) send no Origin header and need no CORS at all.
// The allow-list only matters for local development across ports.
app.use(cors({ origin: CLIENT_ORIGIN }));
// Default 100kb limit is intentional. Image uploads arrive as multipart and are
// handled by multer, so nothing legitimate needs a larger JSON body.
app.use(express.json());

// Seeded product images. On Netlify these same files are also served straight
// from the CDN out of frontend/public/products, so this route is mainly for
// local development.
app.use("/products", express.static(path.join(__dirname, "public/products")));

app.get("/", (req, res) => {
  res.send("QAHWA SUPPLY API is running");
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    db: mongoose.connection.readyState,
  });
});

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/waitlist", waitlistRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/recent", recentRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/shipping-options", shippingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

/**
 * Returns the names of any required environment variables that are missing.
 * Callers decide what to do about it: server.js exits, the serverless handler
 * returns a 500 with a clear message instead of killing the container.
 */
function missingEnv() {
  return REQUIRED_ENV.filter((key) => !process.env[key]);
}

/*
 * Cached connection.
 *
 * A serverless container is reused across many invocations. Calling
 * mongoose.connect() per request would open a new pool every time and quickly
 * exhaust the Atlas connection limit, so the promise is created once and
 * re-awaited on every later invocation. Awaiting a resolved promise is free.
 */
let connectionPromise = null;

function connectToDatabase() {
  // 1 = connected, 2 = connecting. Both mean there is nothing to do.
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGO_URI, {
        // Fail fast rather than hanging until the function times out.
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 5,
      })
      .catch((error) => {
        // Clear the cache so the next invocation can retry instead of
        // re-awaiting a permanently rejected promise.
        connectionPromise = null;
        throw error;
      });
  }
  return connectionPromise;
}

module.exports = { app, connectToDatabase, missingEnv };
