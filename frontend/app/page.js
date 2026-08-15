"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthStatus from "../components/AuthStatus";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("http://localhost:5001/api/products");
        const data = await response.json();

        if (!response.ok) {
          setMessage("Unable to load products.");
          return;
        }

        setProducts(data);
      } catch (error) {
        setMessage("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const categories = [
    "All",
    ...new Set(products.map((product) => product.category)),
  ];

  let filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  if (sort === "low-high") {
    filteredProducts = [...filteredProducts].sort(
      (a, b) => a.price - b.price
    );
  }

  if (sort === "high-low") {
    filteredProducts = [...filteredProducts].sort(
      (a, b) => b.price - a.price
    );
  }

  return (
    <main>
      <h1>QAHWA SUPPLY</h1>

      <AuthStatus />

      <nav className="page-nav">
        <Link href="/cart">View Cart</Link>
        <Link href="/orders">Order History</Link>
      </nav>

      <h2>Our Coffee</h2>

      <section className="filters">
        <div className="filter-group">
          <label htmlFor="search">Search Products</label>
          <input
            id="search"
            type="text"
            placeholder="Search coffee..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sort">Sort by Price</label>
          <select
            id="sort"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="">Default</option>
            <option value="low-high">Price: Low to High</option>
            <option value="high-low">Price: High to Low</option>
          </select>
        </div>
      </section>

      {loading && <p>Loading products...</p>}
      {message && <p>{message}</p>}

      {!loading && !message && filteredProducts.length === 0 && (
        <p>No products found.</p>
      )}

      <section className="product-grid">
        {filteredProducts.map((product) => (
          <div key={product._id} className="product-card">
            <h3>
              <Link href={`/products/${product._id}`}>
                {product.name}
              </Link>
            </h3>

            <p>{product.description}</p>
            <p>Category: {product.category}</p>
            <p>Price: ${product.price}</p>
            <p>Inventory: {product.inventory}</p>

            {product.inventory > 0 ? (
              <p>In Stock</p>
            ) : (
              <p>Sold Out</p>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}