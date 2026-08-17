const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const Category = require("../models/Category");
const DiscountCode = require("../models/DiscountCode");
const InventoryEvent = require("../models/InventoryEvent");
const AuditLog = require("../models/AuditLog");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { writeAudit } = require("../middleware/audit");
const { productImageUrl } = require("../utils/config");
const InventoryService = require("../services/InventoryService");
const DiscountService = require("../services/DiscountService");
const {
  requireString,
  requireObjectId,
  normalizeCode,
  slugify,
  toNumber,
} = require("../utils/validate");

const router = express.Router();

router.use(protect, adminOnly);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ok = ["image/png", "image/jpeg", "image/webp"].includes(file.mimetype);
    if (!ok) {
      cb(new AppError("Use a PNG, JPG, or WEBP under 5 MB.", 400, "INVALID_IMAGE"));
      return;
    }
    cb(null, true);
  },
});

router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const paidFilter = {
      $or: [{ paymentStatus: "paid" }, { status: { $in: ["Paid", "Delivered"] } }],
    };
    const [revenueAgg, statusCounts, lowInventory, orderCount] = await Promise.all([
      Order.aggregate([
        { $match: paidFilter },
        { $group: { _id: null, revenue: { $sum: "$totalPrice" }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Product.find({ inventory: { $gt: 0, $lte: 8 } }).sort({ inventory: 1 }).lean(),
      Order.countDocuments(),
    ]);

    const byStatus = {
      Processing: 0,
      Paid: 0,
      Failed: 0,
      Cancelled: 0,
      Delivered: 0,
    };
    statusCounts.forEach((row) => {
      byStatus[row._id] = row.count;
    });

    res.json({
      data: {
        revenue: revenueAgg[0]?.revenue || 0,
        paidOrders: revenueAgg[0]?.count || 0,
        orderCount,
        byStatus,
        lowInventory,
      },
    });
  })
);

router.get(
  "/customers",
  asyncHandler(async (req, res) => {
    const customers = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ data: customers });
  })
);

router.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const rows = await Category.find().sort({ name: 1 });
    res.json({ data: rows });
  })
);

router.post(
  "/categories",
  asyncHandler(async (req, res) => {
    const name = requireString(req.body.name, "Name", 80);
    const slug = slugify(req.body.slug || name);
    if (!slug) throw new AppError("Slug is required.", 400, "VALIDATION");
    const category = await Category.create({ name, slug });
    await writeAudit(req, {
      action: "create",
      entity: "Category",
      entityId: category._id,
      meta: { name },
    });
    res.status(201).json({ data: category });
  })
);

router.put(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    const id = requireObjectId(req.params.id);
    const category = await Category.findById(id);
    if (!category) throw new AppError("Category not found.", 404, "NOT_FOUND");
    if (req.body.name) category.name = requireString(req.body.name, "Name", 80);
    if (req.body.slug) category.slug = slugify(req.body.slug);
    await category.save();
    await writeAudit(req, {
      action: "update",
      entity: "Category",
      entityId: category._id,
    });
    res.json({ data: category });
  })
);

router.delete(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    const id = requireObjectId(req.params.id);
    const category = await Category.findByIdAndDelete(id);
    if (!category) throw new AppError("Category not found.", 404, "NOT_FOUND");
    await writeAudit(req, {
      action: "delete",
      entity: "Category",
      entityId: id,
    });
    res.json({ data: { ok: true } });
  })
);

router.get(
  "/discounts",
  asyncHandler(async (req, res) => {
    const rows = await DiscountCode.find().sort({ createdAt: -1 });
    res.json({ data: rows.map(DiscountService.publicDiscount) });
  })
);

router.post(
  "/discounts",
  asyncHandler(async (req, res) => {
    const code = normalizeCode(req.body.code);
    if (!code) throw new AppError("Code is required.", 400, "VALIDATION");
    const discount = await DiscountCode.create({
      code,
      percent: toNumber(req.body.percent, 0),
      amountOff: toNumber(req.body.amountOff, 0),
      active: req.body.active !== false,
      minSubtotal: toNumber(req.body.minSubtotal, 0),
      expiresAt: req.body.expiresAt || null,
      maxUses: toNumber(req.body.maxUses, 0),
    });
    await writeAudit(req, {
      action: "create",
      entity: "DiscountCode",
      entityId: discount._id,
      meta: { code },
    });
    res.status(201).json({ data: DiscountService.publicDiscount(discount) });
  })
);

router.put(
  "/discounts/:id",
  asyncHandler(async (req, res) => {
    const id = requireObjectId(req.params.id);
    const discount = await DiscountCode.findById(id);
    if (!discount) throw new AppError("Discount not found.", 404, "NOT_FOUND");
    if (req.body.code) discount.code = normalizeCode(req.body.code);
    if (req.body.percent !== undefined) discount.percent = toNumber(req.body.percent, 0);
    if (req.body.amountOff !== undefined) discount.amountOff = toNumber(req.body.amountOff, 0);
    if (req.body.active !== undefined) discount.active = Boolean(req.body.active);
    if (req.body.minSubtotal !== undefined) discount.minSubtotal = toNumber(req.body.minSubtotal, 0);
    if (req.body.expiresAt !== undefined) discount.expiresAt = req.body.expiresAt || null;
    if (req.body.maxUses !== undefined) discount.maxUses = toNumber(req.body.maxUses, 0);
    await discount.save();
    await writeAudit(req, {
      action: "update",
      entity: "DiscountCode",
      entityId: discount._id,
    });
    res.json({ data: DiscountService.publicDiscount(discount) });
  })
);

router.delete(
  "/discounts/:id",
  asyncHandler(async (req, res) => {
    const id = requireObjectId(req.params.id);
    const discount = await DiscountCode.findByIdAndDelete(id);
    if (!discount) throw new AppError("Discount not found.", 404, "NOT_FOUND");
    await writeAudit(req, {
      action: "delete",
      entity: "DiscountCode",
      entityId: id,
    });
    res.json({ data: { ok: true } });
  })
);

router.post(
  "/products/bulk",
  asyncHandler(async (req, res) => {
    const updates = Array.isArray(req.body.updates) ? req.body.updates : [];
    const results = [];
    for (const row of updates) {
      if (!row || !row.id) continue;
      const product = await InventoryService.setInventory(row.id, row.inventory, {
        userId: req.user.userId,
      });
      results.push(product);
    }
    await writeAudit(req, {
      action: "bulk-inventory",
      entity: "Product",
      meta: { count: results.length },
    });
    res.json({ data: results });
  })
);

router.post(
  "/products/:id/image",
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError("Choose a PNG, JPG, or WEBP image (max 5 MB).", 400, "NO_FILE");
    }
    const product = await Product.findById(requireObjectId(req.params.id));
    if (!product) throw new AppError("Product not found.", 404, "NOT_FOUND");

    const extMap = {
      "image/png": ".png",
      "image/jpeg": ".jpg",
      "image/webp": ".webp",
    };
    const ext = extMap[req.file.mimetype] || ".png";
    const slug = product.slug || String(product._id);
    const dir = path.join(__dirname, "../public/products");
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${slug}${ext}`;
    fs.writeFileSync(path.join(dir, filename), req.file.buffer);

    product.imageUrl = productImageUrl(filename);
    await product.save();
    await writeAudit(req, {
      action: "upload-image",
      entity: "Product",
      entityId: product._id,
      meta: { filename },
    });
    res.json({ data: product, message: "Image saved." });
  })
);

router.get(
  "/inventory",
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.productId) {
      filter.productId = requireObjectId(req.query.productId, "productId");
    }
    const rows = await InventoryEvent.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("productId", "name slug")
      .lean();
    res.json({ data: rows });
  })
);

router.get(
  "/audit",
  asyncHandler(async (req, res) => {
    const rows = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("actorId", "name email role")
      .lean();
    res.json({ data: rows });
  })
);

module.exports = router;
