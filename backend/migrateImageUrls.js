/**
 * One-off migration: make stored product image URLs relative.
 *
 * Early versions of the seed wrote absolute URLs built from PUBLIC_API_URL, so
 * every product row carried the hostname of whichever machine ran the seed.
 * Locally that meant http://localhost:5001/products/haraaz-red.png stored in
 * the database. Deployed, the browser asks the visitor's own machine for that
 * address and every catalogue image breaks.
 *
 * This rewrites those rows to relative paths, which resolve against whichever
 * origin is serving the page.
 *
 *   node migrateImageUrls.js          apply the change
 *   node migrateImageUrls.js --dry    report what would change, touch nothing
 *
 * Safe to run repeatedly: rows that are already relative are skipped, so a
 * second run reports zero changes. Nothing is deleted and no other field is
 * touched, unlike a full re-seed, which also rotates the demo account
 * passwords.
 */

require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("./models/Product");

// Any http(s) origin pointing at a local development machine.
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i;

/**
 * @returns {string|null} the rewritten URL, or null if it needs no change
 */
function relativise(imageUrl) {
  if (typeof imageUrl !== "string" || !imageUrl.trim()) return null;
  const value = imageUrl.trim();

  if (value.startsWith("/")) return null; // already relative

  if (LOCAL_ORIGIN.test(value)) {
    const path = value.replace(LOCAL_ORIGIN, "");
    return path.startsWith("/") ? path : `/${path}`;
  }

  // A genuine remote URL, for example a real CDN. Leave it alone.
  return null;
}

async function main() {
  const dryRun = process.argv.includes("--dry");

  if (!process.env.MONGO_URI) {
    console.error("[config] MONGO_URI is not set. Copy .env.example to .env first.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const products = await Product.find().select("name imageUrl").lean();
  const changes = [];

  for (const product of products) {
    const next = relativise(product.imageUrl);
    if (next) changes.push({ _id: product._id, name: product.name, from: product.imageUrl, to: next });
  }

  console.log(`Scanned ${products.length} products.`);

  if (changes.length === 0) {
    console.log("Nothing to migrate: every image URL is already portable.");
    await mongoose.connection.close();
    return;
  }

  console.log(`${changes.length} need updating:\n`);
  for (const change of changes) {
    console.log(`  ${change.name}`);
    console.log(`    from: ${change.from}`);
    console.log(`    to:   ${change.to}`);
  }

  if (dryRun) {
    console.log("\nDry run: nothing was written. Re-run without --dry to apply.");
    await mongoose.connection.close();
    return;
  }

  const result = await Product.bulkWrite(
    changes.map((change) => ({
      updateOne: { filter: { _id: change._id }, update: { $set: { imageUrl: change.to } } },
    }))
  );

  console.log(`\nUpdated ${result.modifiedCount} products.`);
  await mongoose.connection.close();
}

// Exported for tests; only runs when invoked directly.
module.exports = { relativise };

if (require.main === module) {
  main().catch((error) => {
    console.error("Migration failed:", error.message);
    process.exit(1);
  });
}
