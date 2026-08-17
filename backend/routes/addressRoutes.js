const express = require("express");
const Address = require("../models/Address");
const protect = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { requireString, requireObjectId } = require("../utils/validate");

const router = express.Router();

router.use(protect);

async function clearDefault(userId) {
  await Address.updateMany({ userId }, { $set: { isDefault: false } });
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const rows = await Address.find({ userId: req.user.userId }).sort({
      isDefault: -1,
      createdAt: -1,
    });
    res.json({ data: rows });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const line1 = requireString(req.body.line1, "Address", 200);
    const city = requireString(req.body.city, "City", 80);
    const postal = requireString(req.body.postal, "Postal code", 20);
    const payload = {
      userId: req.user.userId,
      label: String(req.body.label || "Home").trim().slice(0, 40),
      line1,
      city,
      region: String(req.body.region || "").trim().slice(0, 80),
      postal,
      country: String(req.body.country || "US").trim().slice(0, 80),
      isDefault: Boolean(req.body.isDefault),
    };
    if (payload.isDefault) await clearDefault(req.user.userId);
    const count = await Address.countDocuments({ userId: req.user.userId });
    if (count === 0) payload.isDefault = true;
    const address = await Address.create(payload);
    res.status(201).json({ data: address });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = requireObjectId(req.params.id);
    const address = await Address.findOne({ _id: id, userId: req.user.userId });
    if (!address) throw new AppError("Address not found.", 404, "NOT_FOUND");

    if (req.body.line1 !== undefined) address.line1 = requireString(req.body.line1, "Address", 200);
    if (req.body.city !== undefined) address.city = requireString(req.body.city, "City", 80);
    if (req.body.postal !== undefined) address.postal = requireString(req.body.postal, "Postal code", 20);
    if (req.body.label !== undefined) address.label = String(req.body.label).trim().slice(0, 40);
    if (req.body.region !== undefined) address.region = String(req.body.region).trim().slice(0, 80);
    if (req.body.country !== undefined) address.country = String(req.body.country).trim().slice(0, 80);
    if (req.body.isDefault) {
      await clearDefault(req.user.userId);
      address.isDefault = true;
    } else if (req.body.isDefault === false) {
      address.isDefault = false;
    }
    await address.save();
    res.json({ data: address });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = requireObjectId(req.params.id);
    const address = await Address.findOneAndDelete({
      _id: id,
      userId: req.user.userId,
    });
    if (!address) throw new AppError("Address not found.", 404, "NOT_FOUND");
    res.json({ data: { ok: true } });
  })
);

module.exports = router;
