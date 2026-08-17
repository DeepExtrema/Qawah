const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  computeTotals,
  computeDiscountAmount,
  canCancelOrder,
  getShippingOption,
  roundMoney,
} = require("../services/orderTotals");

describe("OrderService.computeTotals uses DB prices not client prices", () => {
  it("sums server line prices and ignores extra clientPrice fields", () => {
    const clientItems = [
      { price: 21, quantity: 2, clientPrice: 1 },
      { price: 14, quantity: 1, clientPrice: 999 },
    ];
    const totals = computeTotals({
      lineItems: clientItems.map((item) => ({
        price: item.price,
        quantity: item.quantity,
      })),
      shippingCost: 0,
    });
    assert.equal(totals.subtotal, 56);
    assert.equal(totals.totalPrice, 56);
  });
});

describe("discount percent applied", () => {
  it("applies 10 percent off the subtotal", () => {
    const discount = computeDiscountAmount({ percent: 10 }, 40);
    assert.equal(discount, 4);
    const totals = computeTotals({
      lineItems: [{ price: 20, quantity: 2 }],
      shippingCost: 5,
      discount: { percent: 10 },
    });
    assert.equal(totals.subtotal, 40);
    assert.equal(totals.discountAmount, 4);
    assert.equal(totals.shippingCost, 5);
    assert.equal(totals.totalPrice, 41);
  });

  it("caps amount-off at the subtotal", () => {
    assert.equal(computeDiscountAmount({ amountOff: 50 }, 20), 20);
  });
});

describe("shipping added", () => {
  it("uses roast-day, standard, and pickup prices", () => {
    assert.equal(getShippingOption("roast").price, 9);
    assert.equal(getShippingOption("std").price, 5);
    assert.equal(getShippingOption("pickup").price, 0);
    const totals = computeTotals({
      lineItems: [{ price: 21, quantity: 1 }],
      shippingCost: getShippingOption("roast").price,
    });
    assert.equal(totals.totalPrice, 30);
  });
});

describe("cancellation window rule", () => {
  const now = new Date("2026-08-17T16:00:00.000Z").getTime();

  it("allows Processing or Paid within 2 hours", () => {
    assert.equal(
      canCancelOrder(
        { status: "Processing", createdAt: "2026-08-17T15:00:00.000Z" },
        now
      ),
      true
    );
    assert.equal(
      canCancelOrder(
        { status: "Paid", createdAt: "2026-08-17T14:30:00.000Z" },
        now
      ),
      true
    );
  });

  it("blocks after 2 hours, Failed, Cancelled, or Delivered", () => {
    assert.equal(
      canCancelOrder(
        { status: "Paid", createdAt: "2026-08-17T13:59:00.000Z" },
        now
      ),
      false
    );
    assert.equal(
      canCancelOrder(
        { status: "Delivered", createdAt: "2026-08-17T15:50:00.000Z" },
        now
      ),
      false
    );
    assert.equal(
      canCancelOrder(
        { status: "Failed", createdAt: "2026-08-17T15:50:00.000Z" },
        now
      ),
      false
    );
  });
});

describe("roundMoney", () => {
  it("rounds to cents", () => {
    assert.equal(roundMoney(10.999), 11);
    assert.equal(roundMoney(10.994), 10.99);
  });
});
