const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    grind: {
      type: String,
      default: "",
    },
    size: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    guestEmail: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      required: true,
    },
    shippingMethod: {
      type: String,
      default: "std",
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    discountCode: {
      type: String,
      default: "",
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
    },
    status: {
      type: String,
      enum: ["Processing", "Paid", "Failed", "Cancelled", "Delivered"],
      default: "Processing",
    },
    paymentIntentId: {
      type: String,
      default: "",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelReason: {
      type: String,
      default: "",
    },
    confirmationToken: {
      type: String,
      default: "",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
