const CANCEL_WINDOW_MS = 2 * 60 * 60 * 1000;

const SHIPPING_OPTIONS = [
  { id: "roast", label: "Roast-day dispatch (Wed)", price: 9 },
  { id: "std", label: "Standard (3-5 days)", price: 5 },
  { id: "pickup", label: "Local pickup (Brooklyn)", price: 0 },
];

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function getShippingOption(methodId) {
  return (
    SHIPPING_OPTIONS.find((option) => option.id === methodId) ||
    SHIPPING_OPTIONS.find((option) => option.id === "std")
  );
}

function computeDiscountAmount(discount, subtotal) {
  const safeSubtotal = roundMoney(subtotal);
  if (!discount) return 0;
  let amount = 0;
  if (Number(discount.percent) > 0) {
    amount = safeSubtotal * (Number(discount.percent) / 100);
  } else if (Number(discount.amountOff) > 0) {
    amount = Number(discount.amountOff);
  }
  return roundMoney(Math.min(Math.max(amount, 0), safeSubtotal));
}

function computeTotals({ lineItems, shippingCost = 0, discount = null, tax = 0 }) {
  const items = Array.isArray(lineItems) ? lineItems : [];
  const subtotal = roundMoney(
    items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + price * quantity;
    }, 0)
  );
  const discountAmount = computeDiscountAmount(discount, subtotal);
  const ship = roundMoney(shippingCost);
  const taxAmount = roundMoney(tax);
  const totalPrice = roundMoney(subtotal - discountAmount + ship + taxAmount);
  return {
    subtotal,
    discountAmount,
    shippingCost: ship,
    tax: taxAmount,
    totalPrice,
  };
}

function canCancelOrder(order, now = Date.now()) {
  if (!order) return false;
  if (!["Processing", "Paid"].includes(order.status)) return false;
  if (order.status === "Delivered") return false;
  const created = new Date(order.createdAt).getTime();
  if (!Number.isFinite(created)) return false;
  return now - created <= CANCEL_WINDOW_MS;
}

module.exports = {
  CANCEL_WINDOW_MS,
  SHIPPING_OPTIONS,
  roundMoney,
  getShippingOption,
  computeDiscountAmount,
  computeTotals,
  canCancelOrder,
};
