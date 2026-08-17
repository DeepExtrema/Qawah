const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    // Longer origin narrative shown on the product page. Optional, so gear and
    // any product added later through the admin console does not have to have
    // one before it can be saved.
    story: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    inventory: {
      type: Number,
      default: 0,
    },
    slug: String,
    roast: String,
    origin: String,
    process: String,
    altitude: String,
    altitudeM: Number,
    caffeine: String,
    varietal: String,
    agtron: Number,
    harvest: String,
    density: String,
    notes: [String],
    score: Number,
    roastDate: String,
    soldOut: {
      type: Boolean,
      default: false,
    },
    tradeTier: Boolean,
    grindDefault: String,
    recipes: {
      filter: String,
      ibrik: String,
    },
    lotLine: String,
    processDetail: String,
    agtronLabel: String,
    cardMeta: String,
    cardMeta2: String,
    homeTag: String,
    displayName: String,
    sizeLabel: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
