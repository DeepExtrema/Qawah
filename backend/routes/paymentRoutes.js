const express = require("express");
const Order = require("../models/Order");
const optionalAuth = require("../middleware/optionalAuth");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const OrderService = require("../services/OrderService");
const PaymentService = require("../services/PaymentService");
const { requireObjectId } = require("../utils/validate");

const router = express.Router();

/**
 * Load an order and prove the caller may pay it.
 *
 * Guests are allowed through on a confirmation token or their order email,
 * which is what makes guest checkout work without an account.
 */
async function loadPayableOrder(req) {
  const orderId = requireObjectId(req.body.orderId, "orderId");
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found.", 404, "NOT_FOUND");

  const email = req.body.email || req.body.guestEmail;
  const token = req.body.token || req.body.confirmationToken;
  if (!OrderService.canViewOrder(order, { user: req.user, token, email })) {
    throw new AppError("Not authorized to pay this order.", 403, "FORBIDDEN");
  }
  return order;
}

/** Lets the checkout UI know which provider to render. */
router.get("/config", (req, res) => {
  res.json({ data: { provider: PaymentService.activeProvider() } });
});

/** Sandbox gateway, the default flow. `outcome` picks success or decline. */
router.post(
  "/sandbox",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const order = await loadPayableOrder(req);
    const outcome = req.body.outcome === "decline" ? "decline" : "success";

    const result = await PaymentService.chargeSandbox(order, outcome);
    res.json({
      data: OrderService.publicOrder(result.order),
      message: "Payment successful.",
    });
  })
);

/** Stripe: create a PaymentIntent priced from the stored order total. */
router.post(
  "/intent",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const order = await loadPayableOrder(req);
    const intent = await PaymentService.createStripeIntent(order);
    // Only the client secret leaves the server, never the API key.
    res.json({
      data: {
        clientSecret: intent.client_secret,
        amount: intent.amount,
        currency: intent.currency,
      },
    });
  })
);

/** Stripe: verify the intent server-side, then credit the order. */
router.post(
  "/confirm",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const order = await loadPayableOrder(req);
    const result = await PaymentService.confirmStripePayment(
      order,
      req.body.paymentIntentId
    );
    res.json({
      data: OrderService.publicOrder(result.order),
      message: "Payment successful.",
    });
  })
);

module.exports = router;
