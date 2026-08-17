const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const DiscountService = require("../services/DiscountService");
const { toNumber } = require("../utils/validate");

const router = express.Router();

router.post(
  "/validate",
  asyncHandler(async (req, res) => {
    const subtotal = toNumber(req.body.subtotal, 0);
    const result = await DiscountService.validateCode(req.body.code, subtotal);
    res.json({
      data: {
        code: result.code,
        discountAmount: result.discountAmount,
        percent: result.discount.percent,
        amountOff: result.discount.amountOff,
      },
    });
  })
);

module.exports = router;
