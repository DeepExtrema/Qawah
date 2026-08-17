"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { apiError, apiFetch } from "../../../../lib/api";
import { money } from "../../../../lib/lots";

function ConfirmationInner() {
  const params = useParams();
  const search = useSearchParams();
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState("Loading confirmation…");
  const [cancelMsg, setCancelMsg] = useState("");

  useEffect(() => {
    async function load() {
      const token = search.get("token") || "";
      const email = search.get("email") || "";
      const qs = new URLSearchParams();
      if (token) qs.set("token", token);
      if (email) qs.set("email", email);
      const { response, data } = await apiFetch(
        `/api/orders/${params.id}/confirmation?${qs.toString()}`
      );
      if (!response.ok) {
        setMessage(apiError(data, "This confirmation is not available."));
        return;
      }
      setOrder(data.data);
      setMessage("");
    }
    load();
  }, [params.id, search]);

  async function cancel() {
    setCancelMsg("");
    const token = search.get("token") || "";
    const email = search.get("email") || "";
    const { response, data } = await apiFetch(`/api/orders/${params.id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ token, email, reason: "Customer cancelled from confirmation" }),
    });
    if (!response.ok) {
      setCancelMsg(apiError(data, "Could not cancel."));
      return;
    }
    setOrder(data.data);
    setCancelMsg("Order cancelled. Inventory returned to the shelf.");
  }

  if (message) {
    return (
      <main className="page">
        <div className="shell empty">
          <h1>Confirmation</h1>
          <p style={{ marginTop: 8 }}>{message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell">
        <article className="b email-letter">
          <div className="cp">FROM QAHWA SUPPLY · BROOKLYN</div>
          <h1 className="display" style={{ fontSize: 26, marginTop: 8 }}>
            Order confirmation
          </h1>
          <p style={{ marginTop: 8, fontSize: 13.5 }}>
            Hello {order.customerName}. We have the bag
            {order.paymentStatus === "paid" ? " and the payment cleared" : ""}.
          </p>
          <p className="cp" style={{ marginTop: 8 }}>
            #{String(order._id).slice(-8).toUpperCase()} · {order.status} · {order.paymentStatus}
          </p>
          <div className="hr" style={{ margin: "14px 0" }} />
          {order.items.map((item) => (
            <div key={`${item.productId}-${item.size}-${item.grind}`} className="order-row">
              <span style={{ flex: 2 }}>
                {item.name}
                {item.size ? ` · ${item.size}` : ""}
                {item.grind ? ` · ${item.grind}` : ""}
              </span>
              <span>×{item.quantity}</span>
              <span>{money(item.price * item.quantity, true)}</span>
            </div>
          ))}
          <div className="hr" style={{ margin: "14px 0" }} />
          <div className="totals-row">
            <span>Subtotal</span>
            <span>{money(order.subtotal, true)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="totals-row">
              <span>Discount {order.discountCode}</span>
              <span>−{money(order.discountAmount, true)}</span>
            </div>
          )}
          <div className="totals-row">
            <span>Dispatch</span>
            <span>{money(order.shippingCost, true)}</span>
          </div>
          <div className="totals-row" style={{ fontSize: 17, marginTop: 6 }}>
            <span>Total</span>
            <span>{money(order.totalPrice, true)}</span>
          </div>
          <p className="cp" style={{ marginTop: 16 }}>
            ROASTED TUESDAY · LEAVES WEDNESDAY 09:00
          </p>
          <p style={{ marginTop: 8, fontSize: 13.5 }}>
            {order.shippingMethod === "roast"
              ? "Roast-day dispatch is booked for Wednesday."
              : order.shippingMethod === "pickup"
                ? "Local pickup in Brooklyn. We will hold the bag."
                : "Standard dispatch, 3–5 days after roast."}
          </p>
          <p style={{ marginTop: 8, fontSize: 13.5 }}>
            Ships to {order.address}.
          </p>
          {order.status !== "Cancelled" && order.status !== "Delivered" && (
            <button type="button" className="bt" style={{ marginTop: 16 }} onClick={cancel}>
              Cancel order
            </button>
          )}
          {cancelMsg ? <p className="msg">{cancelMsg}</p> : null}
          <Link href="/coffee" className="bt bp" style={{ marginTop: 14 }}>
            Back to lots
          </Link>
        </article>
      </div>
    </main>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main className="page">
          <div className="shell empty">
            <p className="cp">LOADING</p>
          </div>
        </main>
      }
    >
      <ConfirmationInner />
    </Suspense>
  );
}
