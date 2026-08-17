const express = require("express");
const SavedCart = require("../models/SavedCart");
const Product = require("../models/Product");
const optionalAuth = require("../middleware/optionalAuth");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { isObjectId } = require("../utils/validate");

const router = express.Router();

function ownerFilter(req) {
  if (req.user?.userId) return { userId: req.user.userId };
  const sessionId = String(req.headers["x-session-id"] || "").trim();
  if (!sessionId) return null;
  return { sessionId };
}

async function hydrate(items) {
  const result = [];
  for (const item of items || []) {
    if (!isObjectId(item.productId)) continue;
    const product = await Product.findById(item.productId);
    if (!product) continue;
    result.push({
      ...product.toObject(),
      quantity: item.quantity,
      grind: item.grind || product.grindDefault || "",
      size: item.size || product.sizeLabel || "",
      name: item.name || product.name,
    });
  }
  return result;
}

router.use(optionalAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = ownerFilter(req);
    if (!filter) return res.json({ data: { items: [] } });
    const cart = await SavedCart.findOne(filter);
    const items = await hydrate(cart?.items || []);
    res.json({ data: { items } });
  })
);

router.put(
  "/",
  asyncHandler(async (req, res) => {
    const filter = ownerFilter(req);
    if (!filter) throw new AppError("Missing session.", 400, "NO_SESSION");

    const incoming = Array.isArray(req.body.items) ? req.body.items : [];
    const items = incoming
      .filter((item) => isObjectId(item.productId || item._id))
      .map((item) => ({
        productId: item.productId || item._id,
        quantity: Math.max(1, Number.parseInt(item.quantity, 10) || 1),
        grind: item.grind || "",
        size: item.size || "",
        name: item.name || "",
      }));

    const cart = await SavedCart.findOneAndUpdate(
      filter,
      {
        $set: {
          items,
          userId: req.user?.userId || null,
          sessionId: String(req.headers["x-session-id"] || "").trim(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ data: { items: cart.items } });
  })
);

module.exports = router;
