const mongoose = require("mongoose");

const recentlyViewedSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    sessionId: { type: String, default: "", index: true },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    viewedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

recentlyViewedSchema.index({ userId: 1, productId: 1 });
recentlyViewedSchema.index({ sessionId: 1, productId: 1 });

module.exports = mongoose.model("RecentlyViewed", recentlyViewedSchema);
