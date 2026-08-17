"use client";

import Link from "next/link";
import { useState } from "react";
import ProductImage from "../../components/ProductImage";
import { useCart } from "../../context/CartContext";
import { GRINDS, money } from "../../lib/lots";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    setGrind,
    subtotal,
    count,
  } = useCart();
  const [code, setCode] = useState("");

  const shipping = subtotal >= 40 || subtotal === 0 ? 0 : 9;
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <main className="page">
        <div className="shell empty">
          <h1 className="display" style={{ fontSize: 22 }}>
            Bag · 0 items
          </h1>
          <p style={{ marginTop: 10, fontSize: 13.5 }}>
            Nothing in the bag yet. Lots roast Tuesdays and ship Wednesday.
          </p>
          <Link href="/coffee" className="bt bp" style={{ marginTop: 16 }}>
            Shop lots
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: 16, paddingBottom: 36 }}>
        <h1 className="display" style={{ fontSize: 22 }}>
          Bag · {count} {count === 1 ? "item" : "items"}
        </h1>

        <div className="b sheet">
          <div className="sheet-head">
            <span className="cp" style={{ flex: 2.4 }}>
              ITEM
            </span>
            <span className="cp" style={{ flex: 1 }}>
              GRIND
            </span>
            <span className="cp" style={{ flex: 0.7 }}>
              QTY
            </span>
            <span className="cp" style={{ flex: 0.7 }}>
              EACH
            </span>
            <span className="cp" style={{ flex: 0.7 }}>
              TOTAL
            </span>
            <span className="cp" style={{ width: 28 }} />
          </div>

          {cart.map((item) => {
            const hasGrind = item.category === "coffee";
            return (
              <div className="sheet-row" key={item._id}>
                <span
                  style={{
                    flex: 2.4,
                    display: "flex",
                    gap: 9,
                    alignItems: "center",
                  }}
                >
                  <ProductImage
                    src={item.imageUrl}
                    alt={item.name}
                    label=""
                    width={34}
                    height={34}
                  />
                  <span>
                    {item.name}
                    {item.size ? ` ${item.size}` : ""}
                  </span>
                </span>
                <span style={{ flex: 1 }}>
                  {hasGrind ? (
                    <>
                      <label htmlFor={`grind-${item._id}`} className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                        Grind for {item.name}
                      </label>
                      <select
                        id={`grind-${item._id}`}
                        className="select"
                        style={{ height: 26, marginTop: 0, width: "auto" }}
                        value={item.grind || "Whole bean"}
                        onChange={(e) => setGrind(item._id, e.target.value)}
                      >
                        {GRINDS.map((g) => (
                          <option key={g} value={g}>
                            {g.replace(" bean", "").replace(" / powder", "")}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    "—"
                  )}
                </span>
                <span style={{ flex: 0.7 }}>
                  <span className="stepper" style={{ height: 26, marginTop: 0, width: 88, padding: "0 6px" }}>
                    <button
                      type="button"
                      aria-label={`Decrease ${item.name}`}
                      onClick={() => decreaseQuantity(item._id)}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Increase ${item.name}`}
                      onClick={() => increaseQuantity(item._id)}
                    >
                      +
                    </button>
                  </span>
                </span>
                <span style={{ flex: 0.7 }}>{money(item.price)}</span>
                <span style={{ flex: 0.7 }}>
                  {money(item.price * item.quantity)}
                </span>
                <button
                  type="button"
                  className="cp"
                  style={{ width: 28, background: "none", border: 0 }}
                  aria-label={`Remove ${item.name}`}
                  onClick={() => removeFromCart(item._id)}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        <div className="cart-layout">
          <div className="b po-box">
            <label className="cp" htmlFor="po">
              PO / DISCOUNT CODE
            </label>
            <input
              id="po"
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="totals">
            <div className="totals-row">
              <span>Subtotal</span>
              <span>{money(subtotal, true)}</span>
            </div>
            <div className="totals-row">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : money(shipping)}</span>
            </div>
            <div className="hr" style={{ margin: "9px 0" }} />
            <div className="totals-row" style={{ fontSize: 17 }}>
              <span>Total</span>
              <span>{money(total, true)}</span>
            </div>
            <Link
              href="/checkout"
              className="bt bp"
              style={{ width: "100%", marginTop: 10 }}
            >
              Checkout
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
