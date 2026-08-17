const express = require("express");
const WishlistItem = require("../models/WishlistItem");
const Product = require("../models/Product");
const protect = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { requireObjectId } = require("../utils/validate");

const router = express.Router();

router.use(protect);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const rows = await WishlistItem.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .populate("productId");
    const items = rows
      .filter((row) => row.productId)
      .map((row) => ({
        id: row._id,
        productId: row.productId._id,
        product: row.productId,
      }));
    res.json({ data: items });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const productId = requireObjectId(req.body.productId, "productId");
    const product = await Product.findById(productId);
    if (!product) throw new AppError("Product not found.", 404, "NOT_FOUND");

    const item = await WishlistItem.findOneAndUpdate(
      { userId: req.user.userId, productId },
      { $setOnInsert: { userId: req.user.userId, productId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ data: item });
  })
);

router.delete(
  "/:productId",
  asyncHandler(async (req, res) => {
    const productId = requireObjectId(req.params.productId, "productId");
    await WishlistItem.findOneAndDelete({
      userId: req.user.userId,
      productId,
    });
    res.json({ data: { ok: true } });
  })
);

module.exports = router;
