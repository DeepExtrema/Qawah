const express = require("express");
const jwt = require("jsonwebtoken");
const WaitlistEntry = require("../models/WaitlistEntry");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const { requireEmail } = require("../utils/validate");
const { buildWaitlistEntry, normalizeProductKey } = require("../utils/waitlist");

const router = express.Router();

/*
 * Optional authentication.
 *
 * Joining a waitlist has to work for signed-out visitors - a sold-out lot is
 * the first thing a new customer sees, and forcing an account there defeats
 * the point. So a missing or expired token is not an error on POST, it just
 * means this is a guest join. `protect` still guards listing.
 */
function attachUser(req, res, next) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    } catch {
      /* fall through as a guest */
    }
  }
  next();
}

/*
 * Signed-in customers get their address from their account rather than the
 * request body, so a session cannot be used to sign somebody else up.
 */
async function resolveEmail(req) {
  if (req.user?.userId) {
    const account = await User.findById(req.user.userId).select("email");
    if (account?.email) return account.email;
  }
  return req.body?.email ?? req.query?.email;
}

router.post(
  "/",
  attachUser,
  asyncHandler(async (req, res) => {
    const entry = buildWaitlistEntry({
      productKey: req.body.productKey,
      productName: req.body.productName,
      email: await resolveEmail(req),
      userId: req.user?.userId,
    });

    const update = { $setOnInsert: { notifiedAt: null } };
    const set = {};
    // Only overwrite the stored name when the client actually sent one, so a
    // later join from a page that omits it cannot blank out a good value.
    if (entry.productName) set.productName = entry.productName;
    // Claims a guest's earlier signup once they sign in and join again.
    if (entry.userId) set.userId = entry.userId;
    if (Object.keys(set).length > 0) update.$set = set;

    const saved = await WaitlistEntry.findOneAndUpdate(
      { productKey: entry.productKey, email: entry.email },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      data: {
        id: saved._id,
        productKey: saved.productKey,
        productName: saved.productName,
        email: saved.email,
      },
    });
  })
);

router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const account = await User.findById(req.user.userId).select("email");
    // Match on the account id or its address, so lots joined as a guest and
    // then signed into still show as joined.
    const or = [{ userId: req.user.userId }];
    if (account?.email) or.push({ email: account.email });

    const rows = await WaitlistEntry.find({ $or: or }).sort({ createdAt: -1 });
    res.json({
      data: rows.map((row) => ({
        id: row._id,
        productKey: row.productKey,
        productName: row.productName,
        email: row.email,
      })),
    });
  })
);

router.delete(
  "/:productKey",
  attachUser,
  asyncHandler(async (req, res) => {
    const productKey = normalizeProductKey(req.params.productKey);
    // Guests identify themselves by the address they joined with. That is the
    // same trust model as a plain unsubscribe link: enough to leave a list,
    // never enough to read one (GET requires a real session).
    const email = requireEmail(await resolveEmail(req));

    await WaitlistEntry.findOneAndDelete({ productKey, email });
    res.json({ data: { ok: true } });
  })
);

module.exports = router;
