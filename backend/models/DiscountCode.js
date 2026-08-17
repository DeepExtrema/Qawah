const mongoose = require("mongoose");

const discountCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    percent: { type: Number, default: 0, min: 0, max: 100 },
    amountOff: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
    minSubtotal: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, default: null },
    usageCount: { type: Number, default: 0, min: 0 },
    maxUses: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DiscountCode", discountCodeSchema);
