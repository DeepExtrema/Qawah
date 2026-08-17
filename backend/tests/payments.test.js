const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const PaymentService = require("../services/PaymentService");

/**
 * A stand-in for a Mongoose Order document.
 *
 * chargeSandbox only needs `save()`, so the payment rules can be tested
 * without a live MongoDB — these assertions run anywhere, including CI.
 */
function fakeOrder(overrides = {}) {
  const order = {
    _id: "651111111111111111111111",
    status: "Processing",
    paymentStatus: "pending",
    totalPrice: 56,
    discountCode: "",
    paymentIntentId: "",
    saved: 0,
    async save() {
      this.saved += 1;
      return this;
    },
    ...overrides,
  };
  return order;
}

describe("payment amount conversion", () => {
  it("converts dollars to whole cents", () => {
    assert.equal(PaymentService.dollarsToCents(21), 2100);
    assert.equal(PaymentService.dollarsToCents(30.5), 3050);
  });

  it("rounds sub-cent values instead of truncating them", () => {
    // 21.005 must not silently become 2100 and lose half a cent.
    assert.equal(PaymentService.dollarsToCents(21.005), 2101);
    assert.equal(PaymentService.dollarsToCents(0), 0);
  });
});

describe("provider selection", () => {
  const original = process.env.STRIPE_SECRET_KEY;

  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = original;
  });

  it("defaults to the sandbox gateway when no Stripe key is set", () => {
    assert.equal(PaymentService.isStripeEnabled(), false);
    assert.equal(PaymentService.activeProvider(), "sandbox");
  });

  it("switches to stripe once a key is configured", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_example";
    assert.equal(PaymentService.isStripeEnabled(), true);
    assert.equal(PaymentService.activeProvider(), "stripe");
  });
});

describe("sandbox gateway outcomes", () => {
  it("marks an order paid on a successful charge", async () => {
    const order = fakeOrder();
    const result = await PaymentService.chargeSandbox(order, "success");

    assert.equal(result.ok, true);
    assert.equal(order.paymentStatus, "paid");
    assert.equal(order.status, "Paid");
    // A reference is always recorded, so support can trace the transaction.
    assert.match(order.paymentIntentId, /^sand_[a-f0-9]{16}$/);
  });

  it("records a failure and surfaces a clear message on decline", async () => {
    const order = fakeOrder();
    await assert.rejects(
      () => PaymentService.chargeSandbox(order, "decline"),
      (error) => {
        assert.equal(error.status, 400);
        assert.equal(error.code, "PAYMENT_DECLINED");
        assert.match(error.message, /declined/i);
        return true;
      }
    );
    // The order stays recoverable — failed, not cancelled — so the customer
    // can retry rather than having to rebuild their cart.
    assert.equal(order.paymentStatus, "failed");
    assert.equal(order.status, "Processing");
  });

  it("is idempotent — paying an already-paid order does not double-charge", async () => {
    const order = fakeOrder({ paymentStatus: "paid", status: "Paid" });
    const result = await PaymentService.chargeSandbox(order, "success");

    assert.equal(result.alreadyPaid, true);
    assert.equal(order.saved, 0, "must not write the order again");
  });

  it("refuses to charge a cancelled order", async () => {
    const order = fakeOrder({ status: "Cancelled" });
    await assert.rejects(
      () => PaymentService.chargeSandbox(order, "success"),
      (error) => {
        assert.equal(error.code, "ORDER_CANCELLED");
        return true;
      }
    );
    assert.equal(order.paymentStatus, "pending");
  });
});

describe("stripe adapter is guarded when unconfigured", () => {
  const original = process.env.STRIPE_SECRET_KEY;

  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = original;
  });

  it("returns a 503 instead of crashing when Stripe is not set up", async () => {
    await assert.rejects(
      () => PaymentService.createStripeIntent(fakeOrder()),
      (error) => {
        assert.equal(error.status, 503);
        assert.equal(error.code, "STRIPE_DISABLED");
        return true;
      }
    );
  });

  it("rejects a confirmation with no payment reference", async () => {
    await assert.rejects(
      () => PaymentService.confirmStripePayment(fakeOrder(), ""),
      (error) => {
        assert.equal(error.code, "VALIDATION");
        return true;
      }
    );
  });
});
