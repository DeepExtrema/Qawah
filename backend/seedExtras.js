const Category = require("./models/Category");
const DiscountCode = require("./models/DiscountCode");

async function upsertProductsBySlug(Product, products) {
  for (const product of products) {
    if (!product.slug) continue;
    await Product.findOneAndUpdate(
      { slug: product.slug },
      { $set: product },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

async function seedTier3Extras() {
  const categories = [
    { name: "Coffee", slug: "coffee" },
    { name: "Husk", slug: "husk" },
    { name: "Gear", slug: "gear" },
  ];
  for (const category of categories) {
    await Category.findOneAndUpdate(
      { slug: category.slug },
      { $set: category },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  await DiscountCode.findOneAndUpdate(
    { code: "QAHWA10" },
    {
      $set: {
        code: "QAHWA10",
        percent: 10,
        amountOff: 0,
        active: true,
        minSubtotal: 20,
      },
      $setOnInsert: { usageCount: 0, maxUses: 0 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

module.exports = { upsertProductsBySlug, seedTier3Extras };
