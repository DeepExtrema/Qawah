const express = require("express");
const RecentlyViewed = require("../models/RecentlyViewed");
const Product = require("../models/Product");
const optionalAuth = require("../middleware/optionalAuth");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { requireObjectId } = require("../utils/validate");

const router = express.Router();
const LIMIT = 8;

function viewerQuery(req) {
  if (req.user?.userId) return { userId: req.user.userId };
  const sessionId = String(req.headers["x-session-id"] || "").trim();
  if (!sessionId) return null;
  return { sessionId };
}

router.use(optionalAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = viewerQuery(req);
    if (!query) return res.json({ data: [] });
    const rows = await RecentlyViewed.find(query)
      .sort({ viewedAt: -1 })
      .limit(LIMIT)
      .populate("productId");
    const products = rows.filter((row) => row.productId).map((row) => row.productId);
    res.json({ data: products });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const productId = requireObjectId(req.body.productId, "productId");
    const product = await Product.findById(productId);
    if (!product) throw new AppError("Product not found.", 404, "NOT_FOUND");

    const sessionId = String(req.headers["x-session-id"] || "").trim();
    const userId = req.user?.userId || null;
    if (!userId && !sessionId) {
      throw new AppError("Missing session.", 400, "NO_SESSION");
    }

    const filter = userId ? { userId, productId } : { sessionId, productId };
    await RecentlyViewed.findOneAndUpdate(
      filter,
      {
        $set: {
          userId,
          sessionId,
          productId,
          viewedAt: new Date(),
        },
      },
      { upsert: true }
    );

    const listQuery = userId ? { userId } : { sessionId };
    const extras = await RecentlyViewed.find(listQuery).sort({ viewedAt: -1 }).skip(LIMIT);
    if (extras.length) {
      await RecentlyViewed.deleteMany({ _id: { $in: extras.map((row) => row._id) } });
    }

    res.status(201).json({ data: { ok: true } });
  })
);

module.exports = router;
