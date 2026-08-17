const DiscountCode = require("../models/DiscountCode");
const AppError = require("../utils/AppError");
const { normalizeCode } = require("../utils/validate");
const { computeDiscountAmount, roundMoney } = require("./orderTotals");

function publicDiscount(doc) {
  if (!doc) return null;
  return {
    id: doc._id,
    code: doc.code,
    percent: doc.percent,
    amountOff: doc.amountOff,
    active: doc.active,
    minSubtotal: doc.minSubtotal,
    expiresAt: doc.expiresAt,
    usageCount: doc.usageCount,
    maxUses: doc.maxUses,
  };
}

async function validateCode(code, subtotal) {
  const normalized = normalizeCode(code);
  if (!normalized) {
    throw new AppError("Enter a discount code.", 400, "INVALID_DISCOUNT");
  }

  const doc = await DiscountCode.findOne({ code: normalized });
  if (!doc || !doc.active) {
    throw new AppError("That code is not valid.", 400, "INVALID_DISCOUNT");
  }
  if (doc.expiresAt && doc.expiresAt < new Date()) {
    throw new AppError("That code has expired.", 400, "DISCOUNT_EXPIRED");
  }
  if (doc.maxUses > 0 && doc.usageCount >= doc.maxUses) {
    throw new AppError("That code has been used up.", 400, "DISCOUNT_USED");
  }
  const safeSubtotal = roundMoney(subtotal);
  if (doc.minSubtotal > 0 && safeSubtotal < doc.minSubtotal) {
    throw new AppError(
      `Code requires a $${doc.minSubtotal} subtotal.`,
      400,
      "DISCOUNT_MIN"
    );
  }

  return {
    discount: doc,
    code: doc.code,
    discountAmount: computeDiscountAmount(doc, safeSubtotal),
  };
}

async function incrementUsage(code) {
  if (!code) return;
  await DiscountCode.findOneAndUpdate(
    { code: normalizeCode(code) },
    { $inc: { usageCount: 1 } }
  );
}

module.exports = {
  publicDiscount,
  validateCode,
  incrementUsage,
};
