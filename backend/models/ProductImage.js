const mongoose = require("mongoose");

/**
 * An administrator-uploaded product image.
 *
 * The bytes live in MongoDB rather than on the filesystem because the
 * production API runs as a serverless function, where the filesystem is
 * read-only and does not survive between invocations. Storing the image as a
 * document means an upload persists in exactly one place that both local
 * development and the deployed site already talk to.
 *
 * Uploads are capped at 5 MB by multer before they reach this model, well
 * under MongoDB's 16 MB document limit.
 */
const productImageSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      // One current image per product; a re-upload replaces the existing one.
      unique: true,
    },
    contentType: {
      type: String,
      required: true,
      enum: ["image/png", "image/jpeg", "image/webp"],
    },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductImage", productImageSchema);
