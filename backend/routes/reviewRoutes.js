const express = require("express");
const Review = require("../models/Review");
const Order = require("../models/Order");
const protect = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const ProductService = require("../services/ProductService");
const { clampRating, requireObjectId } = require("../utils/validate");

const router = express.Router();

const REVIEWABLE = ["Paid", "Delivered"];

async function findPurchase(userId, productId) {
  return Order.findOne({
    userId,
    status: { $in: REVIEWABLE },
    "items.productId": productId,
  }).sort({ createdAt: -1 });
}

router.get(
  "/products/:id/reviews",
  asyncHandler(async (req, res) => {
    const summary = await ProductService.reviewSummary(req.params.id);
    res.json({
      data: {
        reviews: summary.reviews,
        average: summary.average,
        count: summary.count,
      },
    });
  })
);

router.get(
  "/reviews/eligible/:productId",
  protect,
  asyncHandler(async (req, res) => {
    const product = await ProductService.findByIdOrSlug(req.params.productId);
    if (!product) throw new AppError("Product not found.", 404, "NOT_FOUND");
    const existing = await Review.findOne({
      userId: req.user.userId,
      productId: product._id,
    });
    const order = await findPurchase(req.user.userId, product._id);
    res.json({
      data: {
        eligible: Boolean(order) && !existing,
        hasReview: Boolean(existing),
        orderId: order?._id || null,
      },
    });
  })
);

router.post(
  "/reviews",
  protect,
  asyncHandler(async (req, res) => {
    const productId = requireObjectId(req.body.productId, "productId");
    const rating = clampRating(req.body.rating);
    const body = String(req.body.body || "").trim().slice(0, 2000);

    const order = await findPurchase(req.user.userId, productId);
    if (!order) {
      throw new AppError(
        "Reviews are available after a paid or delivered order of this lot.",
        403,
        "NOT_PURCHASED"
      );
    }

    try {
      const review = await Review.create({
        userId: req.user.userId,
        productId,
        orderId: order._id,
        rating,
        body,
      });
      res.status(201).json({ data: review });
    } catch (error) {
      if (error.code === 11000) {
        throw new AppError("You already reviewed this lot.", 400, "DUPLICATE_REVIEW");
      }
      throw error;
    }
  })
);

module.exports = router;
