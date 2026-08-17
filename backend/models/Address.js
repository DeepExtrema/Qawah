const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    label: { type: String, default: "Home", trim: true },
    line1: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    region: { type: String, default: "", trim: true },
    postal: { type: String, required: true, trim: true },
    country: { type: String, default: "US", trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", addressSchema);
