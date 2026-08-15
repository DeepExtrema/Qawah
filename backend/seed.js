require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("./models/Product");

const products = [
  {
    name: "Haraaz Red · Udaini",
    description: "Natural Yemeni coffee with stone fruit, cardamom, and cocoa notes.",
    price: 21,
    category: "Coffee",
    imageUrl: "",
    inventory: 42,
  },
  {
    name: "Dawairi Lot 04",
    description: "Washed Yemeni coffee with honey, apricot, and black tea notes.",
    price: 26,
    category: "Coffee",
    imageUrl: "",
    inventory: 30,
  },
  {
    name: "Tuffahi Nº 7",
    description: "Natural Yemeni coffee with apple, jasmine, and brown sugar notes.",
    price: 24,
    category: "Coffee",
    imageUrl: "",
    inventory: 18,
  },
  {
    name: "Yislah Highland",
    description: "Honey-process Yemeni coffee with dried fig, molasses, and walnut notes.",
    price: 22,
    category: "Coffee",
    imageUrl: "",
    inventory: 22,
  },
  {
    name: "Bura'a Reserve",
    description: "Washed Yemeni reserve coffee with black cherry, cane sugar, and bergamot notes.",
    price: 29,
    category: "Coffee",
    imageUrl: "",
    inventory: 15,
  },
  {
    name: "Sana'a Espresso",
    description: "Yemeni espresso blend with caramel, orange zest, and cocoa notes.",
    price: 20,
    category: "Coffee",
    imageUrl: "",
    inventory: 60,
  },
  {
    name: "Bani Matar Dark",
    description: "Dark-roasted Yemeni coffee with molasses, clove, and roasted almond notes.",
    price: 21,
    category: "Coffee",
    imageUrl: "",
    inventory: 28,
  },
  {
    name: "Mokha Harasi",
    description: "Dark Yemeni coffee with dark chocolate, tobacco, and dried date notes.",
    price: 23,
    category: "Coffee",
    imageUrl: "",
    inventory: 36,
  },
  {
    name: "Dhikr Blend",
    description: "Dark Yemeni blend with cocoa, dried fig, and smoky notes.",
    price: 19,
    category: "Coffee",
    imageUrl: "",
    inventory: 50,
  },
  {
    name: "Haraaz Nº 2",
    description: "Medium-roast Yemeni coffee with red grape, cocoa, and tamarind notes.",
    price: 22,
    category: "Coffee",
    imageUrl: "",
    inventory: 0,
  },
  {
    name: "Yirgacheffe Konga",
    description: "Washed Ethiopian coffee with bergamot, jasmine, and lemon notes.",
    price: 27,
    category: "Coffee",
    imageUrl: "",
    inventory: 26,
  },
  {
    name: "Sidamo Natural",
    description: "Natural Ethiopian coffee with blueberry, red wine, and dark chocolate notes.",
    price: 25,
    category: "Coffee",
    imageUrl: "",
    inventory: 20,
  },
  {
    name: "Guji Highland",
    description: "Natural Ethiopian coffee with strawberry, cane sugar, and floral notes.",
    price: 28,
    category: "Coffee",
    imageUrl: "",
    inventory: 12,
  },
  {
    name: "Java Estate Dark",
    description: "Dark Java coffee with cedar, dark caramel, and earthy notes.",
    price: 20,
    category: "Coffee",
    imageUrl: "",
    inventory: 24,
  },
  {
    name: "Qishr",
    description: "Traditional dried coffee-cherry husk brewed with ginger and spices.",
    price: 14,
    category: "Coffee",
    imageUrl: "",
    inventory: 80,
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    await Product.deleteMany({});
    console.log("Old products removed");

    await Product.insertMany(products);
    console.log("Products added successfully");

    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
}

seedDatabase();