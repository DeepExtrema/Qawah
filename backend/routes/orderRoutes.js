const express = require("express");
const Order = require("../models/Order");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const optionalAuth = require("../middleware/optionalAuth");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const OrderService = require("../services/OrderService");
const { writeAudit } = require("../middleware/audit");
const { requireString, requireEmail, requireObjectId } = require("../utils/validate");

const router = express.Router();

const ADMIN_STATUSES = ["Processing", "Paid", "Failed", "Cancelled", "Delivered"];

router.post(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const customerName = requireString(req.body.customerName, "Name", 120);
    const customerEmail = requireEmail(req.body.customerEmail || req.body.guestEmail);
    const address = req.body.address || req.body.shippingAddress;
    const formatted = OrderService.formatAddress(address);
    if (!formatted) {
      throw new AppError("Please complete the shipping address.", 400, "VALIDATION");
    }

    const isGuest = !req.user?.userId;
    if (isGuest && !customerEmail) {
      throw new AppError("Guest checkout needs an email and address.", 400, "GUEST_REQUIRED");
    }

    const { order, confirmationToken } = await OrderService.createOrder({
      userId: req.user?.userId || null,
      customerName,
      customerEmail,
      address,
      items: req.body.items,
      shippingMethod: req.body.shippingMethod || "std",
      discountCode: req.body.discountCode || req.body.code,
      isGuest,
    });

    res.status(201).json({
      message: "Order created successfully",
      data: {
        order: OrderService.publicOrder(order, { includeToken: true }),
        confirmationToken,
      },
    });
  })
);

router.get(
  "/my-orders",
  protect,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json({ data: orders });
  })
);

router.post(
  "/:id/cancel",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(requireObjectId(req.params.id));
    if (!order) throw new AppError("Order not found.", 404, "NOT_FOUND");
    if (
      !OrderService.canViewOrder(order, {
        user: req.user,
        token: req.body.token || req.query.token,
        email: req.body.email || req.query.email,
      })
    ) {
      throw new AppError("Not authorized to cancel this order.", 403, "FORBIDDEN");
    }
    const updated = await OrderService.cancelOrder(order, {
      reason: req.body.reason,
      userId: req.user?.userId,
    });
    res.json({
      message: "Order cancelled.",
      data: OrderService.publicOrder(updated),
    });
  })
);

router.get(
  "/:id/confirmation",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(requireObjectId(req.params.id));
    if (!order) throw new AppError("Order not found.", 404, "NOT_FOUND");
    if (
      !OrderService.canViewOrder(order, {
        user: req.user,
        token: req.query.token,
        email: req.query.email,
      })
    ) {
      throw new AppError("Order not found.", 404, "NOT_FOUND");
    }
    res.json({ data: OrderService.publicOrder(order) });
  })
);

router.patch(
  "/:id/status",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!ADMIN_STATUSES.includes(status)) {
      throw new AppError("Invalid order status.", 400, "VALIDATION");
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) throw new AppError("Order not found.", 404, "NOT_FOUND");
    await writeAudit(req, {
      action: "status",
      entity: "Order",
      entityId: order._id,
      meta: { status },
    });
    res.status(200).json({
      message: "Order status updated.",
      data: order,
    });
  })
);

router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw new AppError("Order not found.", 404, "NOT_FOUND");
    if (
      !OrderService.canViewOrder(order, {
        user: req.user,
        token: req.query.token,
        email: req.query.email,
      })
    ) {
      throw new AppError("Order not found.", 404, "NOT_FOUND");
    }
    res.status(200).json({ data: OrderService.publicOrder(order) });
  })
);

router.get(
  "/",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ data: orders });
  })
);

module.exports = router;
