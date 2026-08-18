/*
 * Validation for waitlist joins, kept separate from the route so it can be
 * unit tested without a database.
 */

const { requireString, requireEmail, isObjectId } = require("./validate");

/*
 * The client keys a lot by slug ("haraaz-2") when it is running off the mock
 * catalogue and by Mongo id once /api/products has answered, so this accepts
 * either. Lowercasing means "Haraaz-2" and "haraaz-2" cannot split one lot's
 * list into two.
 */
function normalizeProductKey(value) {
  return requireString(value, "productKey", 120).toLowerCase();
}

function buildWaitlistEntry({ productKey, email, productName, userId } = {}) {
  return {
    productKey: normalizeProductKey(productKey),
    email: requireEmail(email),
    productName:
      typeof productName === "string" ? productName.trim().slice(0, 200) : "",
    // Guests join without an account, so an absent or malformed id is not an
    // error - it just means this row has no user attached.
    userId: isObjectId(userId) ? String(userId) : null,
  };
}

module.exports = { normalizeProductKey, buildWaitlistEntry };
