const express = require("express");
const Order = require("../models/Order");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const optionalAuth = require("../middleware/optionalAuth");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const OrderService = require("../services/OrderService");
const { writeAudit } = require("../middleware/audit");
const {
  requireObjectId,
  emailIssue,
  nameIssue,
  postalIssue,
  normalizeCountry,
  rejectFields,
  POSTAL_RULES,
} = require("../utils/validate");

const router = express.Router();

const ADMIN_STATUSES = ["Processing", "Paid", "Failed", "Cancelled", "Delivered"];

router.post(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const address = req.body.address || req.body.shippingAddress;
    const shippingMethod = req.body.shippingMethod || "std";
    const pickup = String(shippingMethod).toLowerCase() === "pickup";

    // Every problem at once, keyed by the field name the checkout form uses, so
    // a rejected order marks the offending inputs instead of returning a single
    // sentence about an address the customer then has to re-read line by line.
    const fields = {};

    const nameProblem = nameIssue(req.body.customerName, "name this order is for");
    if (nameProblem) fields.customerName = nameProblem;

    const emailProblem = emailIssue(req.body.customerEmail || req.body.guestEmail);
    if (emailProblem) fields.customerEmail = emailProblem;

    if (pickup) {
      // Collected in Brooklyn, so there is nothing to validate.
    } else if (typeof address === "string") {
      // Legacy callers pass a pre-joined string. Nothing structured to check.
      if (!address.trim()) {
        fields.address1 = "Please add the street address, including the number.";
      }
    } else {
      const shipTo = address || {};
      const country = normalizeCountry(shipTo.country);
      const rule = POSTAL_RULES[country] || {};

      if (!country) {
        fields.country = "Please choose the country we are shipping to.";
      }
      if (!String(shipTo.line1 || "").trim()) {
        fields.address1 = "Please add the street address, including the number.";
      }
      if (!String(shipTo.city || "").trim()) {
        fields.city = "Please add the town or city.";
      }
      if (rule.region && !String(shipTo.region || "").trim()) {
        fields.region = `We need the ${rule.region.toLowerCase()} for this delivery.`;
      }
      const postalProblem = postalIssue(shipTo.postal, country);
      if (postalProblem) fields.zip = postalProblem;
    }

    rejectFields(fields);

    const customerName = String(req.body.customerName).trim();
    const customerEmail = String(req.body.customerEmail || req.body.guestEmail)
      .trim()
      .toLowerCase();
    const isGuest = !req.user?.userId;

    const { order, confirmationToken } = await OrderService.createOrder({
      userId: req.user?.userId || null,
      customerName,
      customerEmail,
      address,
      items: req.body.items,
      shippingMethod,
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
