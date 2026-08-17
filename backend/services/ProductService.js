const Product = require("../models/Product");
const Review = require("../models/Review");
const AppError = require("../utils/AppError");
const { isObjectId } = require("../utils/validate");

async function findByIdOrSlug(id) {
  if (!id) return null;
  if (isObjectId(id)) {
    const byId = await Product.findById(id);
    if (byId) return byId;
  }
  return Product.findOne({ slug: id });
}

async function recommendations(productId, limit = 4) {
  const product = await findByIdOrSlug(productId);
  if (!product) {
    throw new AppError("Product not found.", 404, "NOT_FOUND");
  }

  const or = [];
  if (product.origin) or.push({ origin: product.origin });
  if (product.roast) or.push({ roast: product.roast });
  if (product.category) or.push({ category: product.category });

  const query = { _id: { $ne: product._id } };
  if (or.length) query.$or = or;

  let recs = await Product.find(query).limit(limit);
  if (recs.length < limit) {
    const extra = await Product.find({
      _id: { $nin: [product._id, ...recs.map((r) => r._id)] },
    }).limit(limit - recs.length);
    recs = recs.concat(extra);
  }
  return recs;
}

async function reviewSummary(productId) {
  const product = await findByIdOrSlug(productId);
  if (!product) {
    throw new AppError("Product not found.", 404, "NOT_FOUND");
  }
  const reviews = await Review.find({ productId: product._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const count = await Review.countDocuments({ productId: product._id });
  const avgAgg = await Review.aggregate([
    { $match: { productId: product._id } },
    { $group: { _id: "$productId", average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const average = avgAgg[0] ? Math.round(avgAgg[0].average * 10) / 10 : 0;
  return { product, reviews, average, count };
}

module.exports = {
  findByIdOrSlug,
  recommendations,
  reviewSummary,
};
