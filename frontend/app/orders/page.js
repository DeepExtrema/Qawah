"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

export default function OrdersPage() {
  const { user, loaded } = useAuth();

  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("Loading orders...");

  useEffect(() => {
    if (!loaded) return;

    if (!user) {
      setMessage("Please log in to view your orders.");
      return;
    }

    async function loadOrders() {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5001/api/orders/my-orders",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message || "Unable to load orders.");
          return;
        }

        setOrders(data);
        setMessage("");
      } catch (error) {
        setMessage("Unable to connect to the server.");
      }
    }

    loadOrders();
  }, [user, loaded]);

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
        <h1>Order History</h1>

        <p>Please log in to view your orders.</p>

        <Link href="/login">
          Login
        </Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Your Order History</h1>

      {message && <p>{message}</p>}

      {!message && orders.length === 0 && (
        <p>You have not placed any orders yet.</p>
      )}

      {orders.map((order) => (
        <div key={order._id}>
          <h2>
          <Link href={`/orders/${order._id}`}>
            Order {order._id}
          </Link>
        </h2>

          <p>
            <strong>Status:</strong> {order.status}
          </p>

          <p>
            <strong>Total:</strong> ${order.totalPrice.toFixed(2)}
          </p>

          <p>
            <strong>Date:</strong>{" "}
            {new Date(order.createdAt).toLocaleString()}
          </p>

          <h3>Items</h3>

          {order.items.map((item) => (
            <p key={item.productId}>
              {item.name} — {item.quantity} × ${item.price}
            </p>
          ))}

          <hr />
        </div>
      ))}

      <Link href="/">
        Back to store
      </Link>
    </main>
  );
}