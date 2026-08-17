const Product = require("../models/Product");
const InventoryEvent = require("../models/InventoryEvent");
const AppError = require("../utils/AppError");

async function applyDelta(productId, delta, { reason, orderId, userId } = {}) {
  const product = await Product.findByIdAndUpdate(
    productId,
    { $inc: { inventory: delta } },
    { new: true }
  );

  if (!product) {
    throw new AppError("Product not found.", 404, "NOT_FOUND");
  }

  product.soldOut = product.inventory <= 0;
  await product.save();

  await InventoryEvent.create({
    productId,
    delta,
    reason: reason || "admin",
    orderId: orderId || null,
    userId: userId || null,
  });

  return product;
}

async function decrementForOrder(items, { orderId, userId }) {
  for (const item of items) {
    await applyDelta(item.productId, -item.quantity, {
      reason: "order",
      orderId,
      userId,
    });
  }
}

async function restockForOrder(items, { orderId, userId, reason = "restock" }) {
  for (const item of items) {
    await applyDelta(item.productId, item.quantity, {
      reason,
      orderId,
      userId,
    });
  }
}

async function setInventory(productId, inventory, { userId } = {}) {
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found.", 404, "NOT_FOUND");
  }
  const next = Math.max(0, Number(inventory) || 0);
  const delta = next - (product.inventory || 0);
  if (delta === 0) return product;
  return applyDelta(productId, delta, { reason: "admin", userId });
}

module.exports = {
  applyDelta,
  decrementForOrder,
  restockForOrder,
  setInventory,
};
