const crypto = require("crypto");
const Order = require("../models/Order");
const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const DiscountService = require("./DiscountService");
const InventoryService = require("./InventoryService");
const {
  computeTotals,
  getShippingOption,
  canCancelOrder,
} = require("./orderTotals");
const { requirePositiveQuantity, isObjectId } = require("../utils/validate");

function formatAddress(address) {
  if (!address) return "";
  if (typeof address === "string") return address.trim();
  return [address.line1, address.city, address.region, address.postal, address.country]
    .filter(Boolean)
    .join(", ");
}

async function buildPricedItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new AppError("Your cart is empty.", 400, "EMPTY_CART");
  }

  const priced = [];
  for (const item of rawItems) {
    const productId = item.productId || item._id;
    if (!isObjectId(productId)) {
      throw new AppError("A product in your cart could not be found.", 404, "NOT_FOUND");
    }
    const quantity = requirePositiveQuantity(item.quantity);
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError("A product in your cart could not be found.", 404, "NOT_FOUND");
    }
    if (product.soldOut || product.inventory < quantity) {
      throw new AppError(
        `Not enough inventory for ${product.name}.`,
        400,
        "OUT_OF_STOCK"
      );
    }
    priced.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity,
      grind: item.grind || "",
      size: item.size || "",
    });
  }
  return priced;
}

async function quote({ items, shippingMethod, discountCode }) {
  const pricedItems = await buildPricedItems(items);
  const shipping = getShippingOption(shippingMethod);
  const subtotal = pricedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let discount = null;
  if (discountCode) {
    const validated = await DiscountService.validateCode(discountCode, subtotal);
    discount = validated.discount;
  }
  const totals = computeTotals({
    lineItems: pricedItems,
    shippingCost: shipping.price,
    discount,
    tax: 0,
  });
  return {
    items: pricedItems,
    shipping,
    discountCode: discount ? discount.code : "",
    totals,
  };
}

async function createOrder({
  userId,
  customerName,
  customerEmail,
  address,
  items,
  shippingMethod,
  discountCode,
  isGuest,
}) {
  const quoted = await quote({ items, shippingMethod, discountCode });
  const confirmationToken = crypto.randomBytes(24).toString("hex");
  const email = String(customerEmail || "").toLowerCase().trim();

  const order = await Order.create({
    userId: userId || null,
    customerName,
    customerEmail: email,
    guestEmail: isGuest ? email : "",
    address: formatAddress(address),
    items: quoted.items,
    shippingMethod: quoted.shipping.id,
    shippingCost: quoted.totals.shippingCost,
    discountCode: quoted.discountCode,
    discountAmount: quoted.totals.discountAmount,
    subtotal: quoted.totals.subtotal,
    tax: quoted.totals.tax,
    totalPrice: quoted.totals.totalPrice,
    status: "Processing",
    paymentStatus: "pending",
    confirmationToken,
  });

  await InventoryService.decrementForOrder(quoted.items, {
    orderId: order._id,
    userId: userId || null,
  });

  return { order, confirmationToken };
}

async function cancelOrder(order, { reason, userId } = {}) {
  if (!canCancelOrder(order)) {
    throw new AppError(
      "This order can no longer be cancelled. Cancellation is allowed within 2 hours if it has not shipped.",
      400,
      "CANCEL_WINDOW"
    );
  }

  order.status = "Cancelled";
  order.cancelledAt = new Date();
  order.cancelReason = reason || "Customer cancelled";
  await order.save();

  await InventoryService.restockForOrder(order.items, {
    orderId: order._id,
    userId: userId || order.userId,
    reason: "restock",
  });

  return order;
}

function canViewOrder(order, { user, token, email } = {}) {
  if (!order) return false;
  if (user?.role === "admin") return true;
  if (user?.userId && order.userId && String(order.userId) === String(user.userId)) {
    return true;
  }
  if (token && order.confirmationToken && token === order.confirmationToken) {
    return true;
  }
  const guest = String(email || "").toLowerCase().trim();
  if (guest && order.guestEmail && guest === String(order.guestEmail).toLowerCase()) {
    return true;
  }
  if (guest && order.customerEmail && guest === String(order.customerEmail).toLowerCase() && !order.userId) {
    return true;
  }
  return false;
}

function publicOrder(order, { includeToken = false } = {}) {
  if (!order) return null;
  const obj = order.toObject ? order.toObject() : { ...order };
  if (!includeToken) {
    delete obj.confirmationToken;
  }
  return obj;
}

module.exports = {
  formatAddress,
  buildPricedItems,
  quote,
  createOrder,
  cancelOrder,
  canViewOrder,
  publicOrder,
};
