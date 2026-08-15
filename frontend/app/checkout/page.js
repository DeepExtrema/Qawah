"use client";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "../../context/CartContext";

export default function CheckoutPage() {
  const { cart, subtotal, clearCart } = useCart();
  const { user, loaded } = useAuth();

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    address: "",
  });

  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((currentForm) => ({
        ...currentForm,
        customerName: user.name,
        customerEmail: user.email,
      }));
    }
  }, [user]);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (cart.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please log in before checking out.");
        setLoading(false);
        return;
      }

      const response = await fetch("http://localhost:5001/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          items: cart.map((item) => ({
            productId: item._id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Checkout failed.");
        return;
      }

      setOrderId(data.order._id);
      setMessage("Order placed successfully!");
      clearCart();
    } catch (error) {
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
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
        <h1>Checkout</h1>

        <p>You must be logged in before checking out.</p>

        <Link href="/login">
          Login
        </Link>

        <br />
        <br />

        <Link href="/cart">
          ← Back to Cart
        </Link>
      </main>
    );
  }

  if (orderId) {
    return (
      <main>
        <h1>Order Confirmed</h1>
        <p>{message}</p>

        <p>
          <strong>Order ID:</strong> {orderId}
        </p>

        <Link href="/">Return to store</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Checkout</h1>

      <p>Order total: ${subtotal.toFixed(2)}</p>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="customerName">Name</label>
          <input
            id="customerName"
            name="customerName"
            type="text"
            value={form.customerName}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="customerEmail">Email</label>
          <input
            id="customerEmail"
            name="customerEmail"
            type="email"
            value={form.customerEmail}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="address">Shipping Address</label>
          <input
            id="address"
            name="address"
            type="text"
            value={form.address}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={loading || cart.length === 0}>
          {loading ? "Placing Order..." : "Place Order"}
        </button>
      </form>

      {message && <p>{message}</p>}

      <br />

      <Link href="/cart">← Back to Cart</Link>
    </main>
  );
}