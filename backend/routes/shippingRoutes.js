const express = require("express");
const { SHIPPING_OPTIONS } = require("../services/orderTotals");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ data: SHIPPING_OPTIONS });
});

module.exports = router;
