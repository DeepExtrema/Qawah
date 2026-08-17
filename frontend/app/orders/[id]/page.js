"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { apiError, apiFetch } from "../../../lib/api";

export default function OrderDetailsPage() {
  const { user, loaded } = useAuth();
  const params = useParams();

  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState("Loading order...");

  useEffect(() => {
    if (!loaded) return;

    if (!user) {
      setMessage("Please log in to view this order.");
      return;
    }

    async function loadOrder() {
      try {
        const { response, data } = await apiFetch(`/api/orders/${params.id}`);

        if (!response.ok) {
          setMessage(apiError(data, "Unable to load order."));
          return;
        }

        setOrder(data.data);
        setMessage("");
      } catch (error) {
        setMessage("Unable to connect to the server.");
      }
    }

    loadOrder();
  }, [loaded, user, params.id]);

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
        <h1>Order Details</h1>
        <p>Please log in to view this order.</p>
        <Link href="/login">Login</Link>
      </main>
    );
  }

  if (message) {
    return (
      <main>
        <h1>Order Details</h1>
        <p>{message}</p>
        <Link href="/orders">
          ← Back to Order History
        </Link>
      </main>
    );
  }

  return (
    <main>
      <h1>Order Details</h1>

      <p>
        <strong>Order ID:</strong> {order._id}
      </p>

      <p>
        <strong>Date:</strong>{" "}
        {new Date(order.createdAt).toLocaleString()}
      </p>

      <p>
        <strong>Status:</strong> {order.status}
      </p>

      <p>
        <strong>Name:</strong> {order.customerName}
      </p>

      <p>
        <strong>Email:</strong> {order.customerEmail}
      </p>

      <p>
        <strong>Shipping Address:</strong> {order.address}
      </p>

      <h2>Items</h2>

      {order.items.map((item) => (
        <div key={item.productId}>
          <h3>{item.name}</h3>

          <p>Quantity: {item.quantity}</p>

          <p>Price: ${item.price}</p>

          <p>
            Item Total: $
            {(item.price * item.quantity).toFixed(2)}
          </p>

          <hr />
        </div>
      ))}

      <h2>
        Total: ${order.totalPrice.toFixed(2)}
      </h2>

      <Link href="/orders">
        ← Back to Order History
      </Link>
    </main>
  );
}