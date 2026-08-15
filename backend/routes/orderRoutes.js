const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

router.post("/", protect, async (req, res) => {
  try {
    const { customerName, customerEmail, address, items } = req.body;

    if (!customerName || !customerEmail || !address) {
      return res.status(400).json({
        message: "Please complete all customer fields.",
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "Your cart is empty.",
      });
    }

    let totalPrice = 0;
    const orderItems = [];

    // First: validate every product
    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          message: "A product in your cart could not be found.",
        });
      }

      if (item.quantity < 1) {
        return res.status(400).json({
          message: "Quantity must be at least 1.",
        });
      }

      if (item.quantity > product.inventory) {
        return res.status(400).json({
          message: `Not enough inventory for ${product.name}.`,
        });
      }

      totalPrice += product.price * item.quantity;

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });
    }

    // Second: create the order
    const order = await Order.create({
      userId: req.user.userId,
      customerName,
      customerEmail,
      address,
      items: orderItems,
      totalPrice,
    });

    // Third: reduce inventory
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: {
            inventory: -item.quantity,
          },
        }
      );
    }

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to create order.",
    });
  }
});

router.get("/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to retrieve your orders.",
    });
  }
});

router.patch("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status.",
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    res.status(200).json({
      message: "Order status updated.",
      order,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to update order status.",
    });
  }
});

router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to retrieve order.",
    });
  }
});

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to retrieve orders.",
    });
  }
});

module.exports = router;
