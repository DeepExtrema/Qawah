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
const addressRoutes = require("./routes/addressRoutes");
const recentRoutes = require("./routes/recentRoutes");
const discountRoutes = require("./routes/discountRoutes");
const cartRoutes = require("./routes/cartRoutes");
const shippingRoutes = require("./routes/shippingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const errorHandler = require("./middleware/errorHandler");
const { PORT, CLIENT_ORIGIN } = require("./utils/config");

const app = express();

app.use(
  cors({
    origin: CLIENT_ORIGIN,
  })
);
app.use(express.json());
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
app.use("/api/addresses", addressRoutes);
app.use("/api/recent", recentRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/shipping-options", shippingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

// Fail fast on missing configuration. Without this, a missing JWT_SECRET only
// surfaces as a confusing 500 the first time someone tries to log in.
const missing = ["MONGO_URI", "JWT_SECRET"].filter((key) => !process.env[key]);
if (missing.length) {
  console.error(
    `[config] Missing required environment variable(s): ${missing.join(", ")}\n` +
      "Copy backend/.env.example to backend/.env and fill in the values."
  );
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
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
