const mongoose = require("mongoose");

/*
 * One row per (lot, email) pair: someone who asked to hear when a sold-out lot
 * is roasted again.
 *
 * productKey is a string rather than an ObjectId ref because the storefront
 * identifies lots by slug. The catalogue falls back to a static list when the
 * API is unreachable, so requiring a real product document here would make the
 * waitlist unusable in exactly the situation it is most needed.
 */
const waitlistEntrySchema = new mongoose.Schema(
  {
    productKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    productName: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    // Set when a signed-in customer joins; null for guests.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Flipped once the restock mail goes out, so a later roast does not
    // notify the same person twice for the same lot.
    notifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Joining twice is a no-op rather than a duplicate row.
waitlistEntrySchema.index({ productKey: 1, email: 1 }, { unique: true });
waitlistEntrySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("WaitlistEntry", waitlistEntrySchema);
