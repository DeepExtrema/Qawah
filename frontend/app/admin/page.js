"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

export default function AdminPage() {
  const { user, loaded } = useAuth();

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [productMessage, setProductMessage] = useState("");
  const [orderMessage, setOrderMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "Coffee",
    imageUrl: "",
    inventory: "",
  });

  useEffect(() => {
    if (!loaded || !user || user.role !== "admin") {
      return;
    }

    loadProducts();
    loadOrders();
  }, [loaded, user]);

  async function loadProducts() {
    try {
      const response = await fetch(
        "http://localhost:5001/api/products"
      );

      const data = await response.json();

      if (response.ok) {
        setProducts(data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function loadOrders() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5001/api/orders",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setOrderMessage(
          data.message || "Unable to load orders."
        );
        return;
      }

      setOrders(data);
      setOrderMessage("");
    } catch (error) {
      setOrderMessage("Unable to connect to the server.");
    }
  }

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleAddProduct(event) {
    event.preventDefault();

    setProductMessage("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5001/api/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name,
            description: form.description,
            price: Number(form.price),
            category: form.category,
            imageUrl: form.imageUrl,
            inventory: Number(form.inventory),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setProductMessage(
          data.message || "Unable to add product."
        );
        return;
      }

      setProductMessage("Product added successfully!");

      setForm({
        name: "",
        description: "",
        price: "",
        category: "Coffee",
        imageUrl: "",
        inventory: "",
      });

      loadProducts();
    } catch (error) {
      setProductMessage("Unable to connect to the server.");
    }
  }

  async function updateProduct(product) {
    const name = prompt("Product name:", product.name);
    if (name === null) return;

    const description = prompt(
      "Description:",
      product.description
    );
    if (description === null) return;

    const price = prompt("Price:", product.price);
    if (price === null) return;

    const category = prompt(
      "Category:",
      product.category
    );
    if (category === null) return;

    const inventory = prompt(
      "Inventory:",
      product.inventory
    );
    if (inventory === null) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5001/api/products/${product._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            description,
            price: Number(price),
            category,
            imageUrl: product.imageUrl || "",
            inventory: Number(inventory),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setProductMessage(
          data.message || "Unable to update product."
        );
        return;
      }

      setProductMessage("Product updated successfully!");
      loadProducts();
    } catch (error) {
      setProductMessage("Unable to connect to the server.");
    }
  }

  async function deleteProduct(productId) {
    const confirmed = confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5001/api/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setProductMessage(
          data.message || "Unable to delete product."
        );
        return;
      }

      setProductMessage("Product deleted successfully!");
      loadProducts();
    } catch (error) {
      setProductMessage("Unable to connect to the server.");
    }
  }

  async function updateOrderStatus(orderId, status) {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5001/api/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setOrderMessage(
          data.message || "Unable to update order."
        );
        return;
      }

      setOrderMessage("Order status updated!");
      loadOrders();
    } catch (error) {
      setOrderMessage("Unable to connect to the server.");
    }
  }

  if (!loaded) {
    return (
      <main>
        <p>Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main>
        <h1>Admin Dashboard</h1>
        <p>Please log in.</p>
        <Link href="/login">Login</Link>
      </main>
    );
  }

  if (user.role !== "admin") {
    return (
      <main>
        <h1>Access Denied</h1>
        <p>You do not have permission to view this page.</p>
        <Link href="/">Back to store</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Admin Dashboard</h1>

      <p>Welcome, {user.name}</p>

      <Link href="/">← Back to Store</Link>

      <hr />

      <section>
        <h2>Add Product</h2>

        <form onSubmit={handleAddProduct}>
          <div>
            <label htmlFor="name">Product Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="price">Price</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="category">Category</label>
            <input
              id="category"
              name="category"
              type="text"
              value={form.category}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="imageUrl">Image URL</label>
            <input
              id="imageUrl"
              name="imageUrl"
              type="text"
              value={form.imageUrl}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="inventory">Inventory</label>
            <input
              id="inventory"
              name="inventory"
              type="number"
              min="0"
              value={form.inventory}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit">Add Product</button>
        </form>

        {productMessage && <p>{productMessage}</p>}
      </section>

      <hr />

      <section>
        <h2>Products</h2>

        <p>Total products: {products.length}</p>

        {products.map((product) => (
          <div key={product._id}>
            <h3>{product.name}</h3>

            <p>{product.description}</p>

            <p>Price: ${product.price}</p>

            <p>Category: {product.category}</p>

            <p>Inventory: {product.inventory}</p>

            <button onClick={() => updateProduct(product)}>
              Edit
            </button>

            {" "}

            <button onClick={() => deleteProduct(product._id)}>
              Delete
            </button>

            <hr />
          </div>
        ))}
      </section>

      <section>
        <h2>Manage Orders</h2>

        {orderMessage && <p>{orderMessage}</p>}

        {orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          orders.map((order) => (
            <div key={order._id}>
              <h3>Order {order._id}</h3>

              <p>
                <strong>Customer:</strong> {order.customerName}
              </p>

              <p>
                <strong>Email:</strong> {order.customerEmail}
              </p>

              <p>
                <strong>Total:</strong> $
                {order.totalPrice.toFixed(2)}
              </p>

              <p>
                <strong>Status:</strong> {order.status}
              </p>

              <select
                value={order.status}
                onChange={(event) =>
                  updateOrderStatus(
                    order._id,
                    event.target.value
                  )
                }
              >
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <h4>Items</h4>

              {order.items.map((item) => (
                <p key={item.productId}>
                  {item.name} — {item.quantity} × ${item.price}
                </p>
              ))}

              <hr />
            </div>
          ))
        )}
      </section>
    </main>
  );
}