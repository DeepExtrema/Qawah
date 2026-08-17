/**
 * Payment layer.
 *
 * Two providers behind one interface:
 *   - "sandbox" (default) — a self-contained test gateway. No card data ever
 *     reaches the server; the client asks for a success or a decline outcome.
 *   - "stripe" — activated by setting STRIPE_SECRET_KEY to a sk_test_ key.
 *     Card details go straight from the browser to Stripe; this server only
 *     ever sees a PaymentIntent id.
 *
 * In both cases the amount charged is derived from the Order document that the
 * backend priced, never from anything the client sent.
 */

const crypto = require("crypto");
const AppError = require("../utils/AppError");
const DiscountService = require("./DiscountService");
const { roundMoney } = require("./orderTotals");

function isStripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function activeProvider() {
  return isStripeEnabled() ? "stripe" : "sandbox";
}

function getStripe() {
  if (!isStripeEnabled()) {
    throw new AppError(
      "Stripe is not configured on this server.",
      503,
      "STRIPE_DISABLED"
    );
  }
  // Required lazily so the package is only loaded when a key is present.
  return require("stripe")(process.env.STRIPE_SECRET_KEY);
}

function dollarsToCents(amount) {
  return Math.round(roundMoney(amount) * 100);
}

/** Shared guard: an order must be payable before either provider touches it. */
function assertPayable(order) {
  if (!order) {
    throw new AppError("Order not found.", 404, "NOT_FOUND");
  }
  if (order.status === "Cancelled") {
    throw new AppError("This order was cancelled.", 400, "ORDER_CANCELLED");
  }
}

async function markPaid(order, paymentIntentId) {
  order.paymentStatus = "paid";
  order.status = "Paid";
  if (paymentIntentId) order.paymentIntentId = paymentIntentId;
  await order.save();
  // A discount only burns a use once payment actually clears.
  if (order.discountCode) {
    await DiscountService.incrementUsage(order.discountCode);
  }
  return order;
}

async function chargeSandbox(order, outcome) {
  assertPayable(order);
  if (order.paymentStatus === "paid") {
    return { ok: true, order, alreadyPaid: true };
  }

  if (outcome === "decline") {
    order.paymentStatus = "failed";
    await order.save();
    throw new AppError(
      "Payment declined. Try another method or the test-success button.",
      400,
      "PAYMENT_DECLINED"
    );
  }

  order.paymentIntentId =
    order.paymentIntentId || `sand_${crypto.randomBytes(8).toString("hex")}`;
  await markPaid(order, order.paymentIntentId);
  return { ok: true, order };
}

/**
 * Create (or reuse) a Stripe PaymentIntent for an order.
 * The amount comes from order.totalPrice, which the backend computed.
 */
async function createStripeIntent(order) {
  assertPayable(order);
  if (order.paymentStatus === "paid") {
    throw new AppError("This order is already paid.", 400, "ALREADY_PAID");
  }

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create({
    amount: dollarsToCents(order.totalPrice),
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: { orderId: String(order._id) },
  });

  order.paymentIntentId = intent.id;
  await order.save();
  return intent;
}

/**
 * Confirm a Stripe payment.
 *
 * The client tells us which intent to look at, but we re-read that intent from
 * Stripe and verify three things ourselves before crediting the order:
 *   1. the intent actually belongs to this order,
 *   2. Stripe reports it as succeeded,
 *   3. the amount captured matches the total this backend calculated.
 * A client claiming "paid" is never sufficient.
 */
async function confirmStripePayment(order, paymentIntentId) {
  assertPayable(order);
  if (order.paymentStatus === "paid") {
    return { ok: true, order, alreadyPaid: true };
  }

  const intentId = String(paymentIntentId || order.paymentIntentId || "");
  if (!intentId) {
    throw new AppError("Missing payment reference.", 400, "VALIDATION");
  }

  const stripe = getStripe();
  const intent = await stripe.paymentIntents.retrieve(intentId);

  if (String(intent.metadata?.orderId || "") !== String(order._id)) {
    throw new AppError(
      "This payment does not belong to that order.",
      403,
      "INTENT_MISMATCH"
    );
  }

  if (intent.status !== "succeeded") {
    order.paymentStatus = "failed";
    await order.save();
    throw new AppError(
      "Payment was not completed. Please try another card.",
      400,
      "PAYMENT_DECLINED"
    );
  }

  const expected = dollarsToCents(order.totalPrice);
  if (Number(intent.amount_received) !== expected) {
    throw new AppError(
      "Payment amount did not match the order total.",
      400,
      "AMOUNT_MISMATCH"
    );
  }

  await markPaid(order, intent.id);
  return { ok: true, order };
}

module.exports = {
  isStripeEnabled,
  activeProvider,
  dollarsToCents,
  chargeSandbox,
  createStripeIntent,
  confirmStripePayment,
  markPaid,
};
