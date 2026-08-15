const express = require("express");
const Product = require("../models/Product");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const products = await Product.find();

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Unable to retrieve products",
    });
  }
});

router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      imageUrl,
      inventory,
    } = req.body;

    if (!name || !description || price === undefined || !category) {
      return res.status(400).json({
        message: "Please complete all required product fields.",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      imageUrl: imageUrl || "",
      inventory: inventory || 0,
    });

    res.status(201).json({
      message: "Product created successfully.",
      product,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to create product.",
    });
  }
});

router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      imageUrl,
      inventory,
    } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price,
        category,
        imageUrl,
        inventory,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    res.status(200).json({
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to update product.",
    });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    res.status(200).json({
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to delete product.",
    });
  }
});

module.exports = router;

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({
      message: "Invalid product ID",
    });
  }
});