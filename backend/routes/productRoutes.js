const express = require("express");
const Product = require("../models/Product");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { writeAudit } = require("../middleware/audit");
const ProductService = require("../services/ProductService");
const InventoryService = require("../services/InventoryService");
const ProductImage = require("../models/ProductImage");
const { requireObjectId } = require("../utils/validate");
const { toBuffer } = require("../utils/binary");

const router = express.Router();

const PRODUCT_FIELDS = [
  "name",
  "description",
  "price",
  "category",
  "imageUrl",
  "images",
  "inventory",
  "slug",
  "roast",
  "origin",
  "process",
  "altitude",
  "altitudeM",
  "caffeine",
  "varietal",
  "agtron",
  "harvest",
  "density",
  "notes",
  "score",
  "roastDate",
  "soldOut",
  "tradeTier",
  "grindDefault",
  "recipes",
  "lotLine",
  "processDetail",
  "agtronLabel",
  "cardMeta",
  "cardMeta2",
  "homeTag",
  "displayName",
  "sizeLabel",
];

function pickProductFields(body) {
  const data = {};
  for (const field of PRODUCT_FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }
  return data;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const products = await Product.find();
    res.status(200).json(products);
  })
);

router.post(
  "/",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const data = pickProductFields(req.body);

    if (!data.name || !data.description || data.price === undefined || !data.category) {
      throw new AppError("Please complete all required product fields.", 400, "VALIDATION");
    }

    if (data.imageUrl === undefined) data.imageUrl = "";
    if (data.inventory === undefined) data.inventory = 0;
    data.soldOut = data.inventory <= 0;

    const product = await Product.create(data);
    if (product.inventory > 0) {
      await InventoryService.applyDelta(product._id, 0, {
        reason: "admin",
        userId: req.user.userId,
      }).catch(() => {});
    }
    await writeAudit(req, {
      action: "create",
      entity: "Product",
      entityId: product._id,
      meta: { name: product.name },
    });

    res.status(201).json({
      message: "Product created successfully.",
      product,
    });
  })
);

router.get(
  "/:id/reviews",
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
  "/:id/recommendations",
  asyncHandler(async (req, res) => {
    const recs = await ProductService.recommendations(req.params.id, 4);
    res.json({ data: recs });
  })
);

/*
 * Serves an administrator-uploaded product image.
 *
 * This is the one endpoint that does not return the usual { data } envelope:
 * it responds with raw image bytes, because the URL is used directly as an
 * <img src>. Seeded images are static files under /products/<slug>.png and do
 * not pass through here.
 */
router.get(
  "/:id/image",
  asyncHandler(async (req, res) => {
    const image = await ProductImage.findOne({
      productId: requireObjectId(req.params.id),
    }).lean();
    if (!image) {
      throw new AppError("Image not found.", 404, "NOT_FOUND");
    }

    // .lean() skips document hydration, so a Buffer field comes back as the
    // driver's BSON Binary wrapper rather than a Node Buffer. Sending that
    // directly makes Express treat it as a plain object and JSON-encode it,
    // which silently corrupts the image.
    const bytes = toBuffer(image.data);

    res.set("Content-Type", image.contentType);
    res.set("Content-Length", String(bytes.length));
    // Safe to cache hard: the stored URL carries a ?v= stamp that changes
    // whenever an administrator replaces the image.
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.end(bytes);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await ProductService.findByIdOrSlug(req.params.id);
    if (!product) {
      throw new AppError("Product not found", 404, "NOT_FOUND");
    }
    res.status(200).json(product);
  })
);

router.put(
  "/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const data = pickProductFields(req.body);
    const existing = await Product.findById(req.params.id);
    if (!existing) throw new AppError("Product not found.", 404, "NOT_FOUND");

    if (data.inventory !== undefined && data.inventory !== existing.inventory) {
      await InventoryService.setInventory(existing._id, data.inventory, {
        userId: req.user.userId,
      });
      delete data.inventory;
    }

    Object.assign(existing, data);
    if (typeof existing.inventory === "number") {
      existing.soldOut = existing.inventory <= 0;
    }
    const product = await existing.save();
    await writeAudit(req, {
      action: "update",
      entity: "Product",
      entityId: product._id,
    });

    res.status(200).json({
      message: "Product updated successfully.",
      product,
    });
  })
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw new AppError("Product not found.", 404, "NOT_FOUND");
    await writeAudit(req, {
      action: "delete",
      entity: "Product",
      entityId: product._id,
      meta: { name: product.name },
    });
    res.status(200).json({
      message: "Product deleted successfully.",
    });
  })
);

module.exports = router;
