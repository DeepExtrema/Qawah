const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    body: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
