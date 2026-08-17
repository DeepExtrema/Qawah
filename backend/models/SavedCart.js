const mongoose = require("mongoose");

const savedCartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    grind: { type: String, default: "" },
    size: { type: String, default: "" },
    name: { type: String, default: "" },
  },
  { _id: false }
);

const savedCartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    sessionId: { type: String, default: "", index: true },
    items: { type: [savedCartItemSchema], default: [] },
  },
  { timestamps: true }
);

savedCartSchema.index({ userId: 1, sessionId: 1 });

module.exports = mongoose.model("SavedCart", savedCartSchema);
