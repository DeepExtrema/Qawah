"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductImage from "../../components/ProductImage";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { apiError, apiFetch } from "../../lib/api";
import { money } from "../../lib/lots";

const FALLBACK_METHODS = [
  { id: "roast", label: "Roast-day dispatch (Wed)", price: 9 },
  { id: "std", label: "Standard (3-5 days)", price: 5 },
  { id: "pickup", label: "Local pickup (Brooklyn)", price: 0 },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, clearCart, count } = useCart();
  const { user, loaded } = useAuth();
  const [methods, setMethods] = useState(FALLBACK_METHODS);
  const [method, setMethod] = useState("roast");
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState("");
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(null);
  const [discountError, setDiscountError] = useState("");
  const [message, setMessage] = useState("");
  const [payBusy, setPayBusy] = useState("");
  const [pendingOrder, setPendingOrder] = useState(null);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    address1: "",
    address2: "",
    city: "",
    region: "",
    zip: "",
    country: "US",
  });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        customerName: user.name || f.customerName,
        customerEmail: user.email || f.customerEmail,
      }));
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const ship = await apiFetch("/api/shipping-options");
        if (!cancelled && ship.response.ok && Array.isArray(ship.data.data)) {
          setMethods(ship.data.data);
        }
      } catch {
        /* keep fallback */
      }
      if (user) {
        try {
          const addr = await apiFetch("/api/addresses");
          if (!cancelled && addr.response.ok) {
            const rows = addr.data.data || [];
            setAddresses(rows);
            const def = rows.find((row) => row.isDefault) || rows[0];
            if (def) applyAddress(def);
          }
        } catch {
          /* none */
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  function applyAddress(row) {
    if (!row) return;
    setAddressId(row._id);
    setForm((f) => ({
      ...f,
      address1: row.line1 || "",
      city: row.city || "",
      region: row.region || "",
      zip: row.postal || "",
      country: row.country || "US",
    }));
  }

  const ship = methods.find((m) => m.id === method) || methods[0];
  const dispatch = ship ? ship.price : 0;
  const discountAmount = discount?.discountAmount || 0;
  const total = Math.max(0, subtotal - discountAmount + dispatch);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
    setFieldErrors((current) => ({ ...current, [event.target.name]: "" }));
  }

  function validateForm() {
    const errors = {};
    if (!form.customerName.trim()) errors.customerName = "Name is required.";
    if (!form.customerEmail.trim()) errors.customerEmail = "Email is required.";
    if (!form.address1.trim()) errors.address1 = "Address is required.";
    if (!form.city.trim()) errors.city = "City is required.";
    if (!form.zip.trim()) errors.zip = "Postal code is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function applyDiscount(event) {
    event.preventDefault();
    setDiscountError("");
    if (!code.trim()) {
      setDiscount(null);
      return;
    }
    try {
      const { response, data } = await apiFetch("/api/discounts/validate", {
        method: "POST",
        body: JSON.stringify({ code, subtotal }),
      });
      if (!response.ok) {
        setDiscount(null);
        setDiscountError(apiError(data, "That code is not valid."));
        return;
      }
      setDiscount(data.data);
    } catch {
      setDiscountError("Unable to check that code.");
    }
  }

  async function createOrder() {
    const address = {
      line1: [form.address1, form.address2].filter(Boolean).join(", "),
      city: form.city,
      region: form.region,
      postal: form.zip,
      country: form.country,
    };
    const { response, data } = await apiFetch("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        guestEmail: form.customerEmail,
        address,
        shippingMethod: method,
        discountCode: discount?.code || "",
        items: cart.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
          grind: item.grind,
          size: item.size,
        })),
      }),
    });
    if (!response.ok) {
      throw new Error(apiError(data, "Unable to place order."));
    }
    const order = data.data?.order;
    const token = data.data?.confirmationToken || order?.confirmationToken;
    return { order, token };
  }

  async function pay(outcome) {
    if (cart.length === 0 && !pendingOrder) {
      setMessage("Bag is empty.");
      return;
    }
    if (!validateForm() && !pendingOrder) return;
    setPayBusy(outcome);
    setMessage("");
    try {
      let current = pendingOrder;
      if (!current) {
        current = await createOrder();
        setPendingOrder(current);
      }
      const { response, data } = await apiFetch("/api/payments/sandbox", {
        method: "POST",
        body: JSON.stringify({
          orderId: current.order._id,
          outcome,
          token: current.token,
          email: form.customerEmail,
        }),
      });
      if (!response.ok) {
        setMessage(apiError(data, "Payment declined."));
        return;
      }
      const orderId = current.order._id;
      const token = current.token;
      clearCart();
      const qs = new URLSearchParams();
      if (token) qs.set("token", token);
      if (form.customerEmail) qs.set("email", form.customerEmail);
      router.push(`/orders/confirmation/${orderId}?${qs.toString()}`);
    } catch (error) {
      setMessage(error.message || "Unable to complete payment.");
    } finally {
      setPayBusy("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await pay("success");
  }

  if (!loaded) {
    return (
      <main className="page">
        <div className="shell empty">
          <p className="cp">LOADING</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 0",
            borderBottom: "1.4px solid #2b2b2b",
          }}
        >
          <span className="cp" style={{ marginLeft: "auto" }}>
            CONTACT · DELIVERY · PAYMENT
          </span>
        </div>
      </div>

      <form className="shell chk" onSubmit={handleSubmit}>
        <div className="chk-form">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="cp">CONTACT</span>
            {user ? (
              <span className="cp">{user.email}</span>
            ) : (
              <Link href="/login" className="cp">
                LOG IN
              </Link>
            )}
          </div>
          {!user && (
            <p style={{ marginTop: 8, fontSize: 13.5 }}>
              Guest checkout is open. Add an email and address, no account required.
            </p>
          )}
          <label htmlFor="customerEmail" className="cp" style={{ display: "block", marginTop: 8 }}>
            Email
          </label>
          <input
            id="customerEmail"
            name="customerEmail"
            className="input"
            type="email"
            required
            autoComplete="email"
            value={form.customerEmail}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.customerEmail)}
            aria-describedby={fieldErrors.customerEmail ? "customerEmail-error" : undefined}
          />
          {fieldErrors.customerEmail ? (
            <p id="customerEmail-error" className="field-error">
              {fieldErrors.customerEmail}
            </p>
          ) : null}
          <label htmlFor="customerName" className="cp" style={{ display: "block", marginTop: 8 }}>
            Name
          </label>
          <input
            id="customerName"
            name="customerName"
            className="input"
            type="text"
            required
            autoComplete="name"
            value={form.customerName}
            onChange={handleChange}
            aria-invalid={Boolean(fieldErrors.customerName)}
            aria-describedby={fieldErrors.customerName ? "customerName-error" : undefined}
          />
          {fieldErrors.customerName ? (
            <p id="customerName-error" className="field-error">
              {fieldErrors.customerName}
            </p>
          ) : null}

          <div className="cp" style={{ marginTop: 14 }}>
            SHIP TO
          </div>
          {addresses.length > 0 && (
            <>
              <label htmlFor="saved-address" className="cp" style={{ display: "block", marginTop: 7 }}>
                Saved address
              </label>
              <select
                id="saved-address"
                className="select"
                value={addressId}
                onChange={(event) => {
                  const row = addresses.find((item) => item._id === event.target.value);
                  applyAddress(row);
                }}
              >
                {addresses.map((row) => (
                  <option key={row._id} value={row._id}>
                    {row.label}: {row.line1}, {row.city}
                  </option>
                ))}
              </select>
            </>
          )}
          <div className="form-grid-2">
            <div className="span-2">
              <label htmlFor="address1" className="cp">
                Address
              </label>
              <input
                id="address1"
                name="address1"
                className="input"
                required
                autoComplete="address-line1"
                value={form.address1}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.address1)}
                aria-describedby={fieldErrors.address1 ? "address1-error" : undefined}
              />
              {fieldErrors.address1 ? (
                <p id="address1-error" className="field-error">
                  {fieldErrors.address1}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="city" className="cp">
                City
              </label>
              <input
                id="city"
                name="city"
                className="input"
                required
                autoComplete="address-level2"
                value={form.city}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.city)}
                aria-describedby={fieldErrors.city ? "city-error" : undefined}
              />
              {fieldErrors.city ? (
                <p id="city-error" className="field-error">
                  {fieldErrors.city}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="zip" className="cp">
                Postal code
              </label>
              <input
                id="zip"
                name="zip"
                className="input"
                required
                autoComplete="postal-code"
                value={form.zip}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.zip)}
                aria-describedby={fieldErrors.zip ? "zip-error" : undefined}
              />
              {fieldErrors.zip ? (
                <p id="zip-error" className="field-error">
                  {fieldErrors.zip}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="region" className="cp">
                Region
              </label>
              <input
                id="region"
                name="region"
                className="input"
                autoComplete="address-level1"
                value={form.region}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="country" className="cp">
                Country
              </label>
              <input
                id="country"
                name="country"
                className="input"
                autoComplete="country-name"
                value={form.country}
                onChange={handleChange}
              />
            </div>
            <div className="span-2">
              <label htmlFor="address2" className="cp">
                Apartment, café, masjid (optional)
              </label>
              <input
                id="address2"
                name="address2"
                className="input"
                autoComplete="address-line2"
                value={form.address2}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="cp" style={{ marginTop: 14 }}>
            METHOD
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 7 }}>
            {methods.map((m) => (
              <button
                key={m.id}
                type="button"
                className={method === m.id ? "b ship-opt is-on" : "b ship-opt"}
                onClick={() => setMethod(m.id)}
              >
                <span>{m.label}</span>
                <span style={{ marginLeft: "auto" }}>
                  {m.price === 0 ? "Free" : money(m.price)}
                </span>
              </button>
            ))}
          </div>

          <div className="cp" style={{ marginTop: 14 }}>
            DISCOUNT
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 7 }}>
            <label htmlFor="discount-code" className="sr-only">
              Discount code
            </label>
            <input
              id="discount-code"
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              placeholder="QAHWA10"
            />
            <button type="button" className="bt" onClick={applyDiscount}>
              Apply
            </button>
          </div>
          {discountError ? <p className="field-error">{discountError}</p> : null}
          {discount ? (
            <p className="msg">
              {discount.code} applied · −{money(discount.discountAmount, true)}
            </p>
          ) : null}

          <div className="cp" style={{ marginTop: 14 }}>
            PAYMENT
          </div>
          <p style={{ marginTop: 8, fontSize: 13.5 }}>
            Test payments only. No card numbers are stored. Use the sandbox buttons below.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            <button
              type="submit"
              className="bt bp"
              disabled={payBusy || cart.length === 0}
            >
              {payBusy === "success" ? "Paying…" : `Pay (test success) · ${money(total, true)}`}
            </button>
            <button
              type="button"
              className="bt"
              disabled={payBusy || cart.length === 0}
              onClick={() => pay("decline")}
            >
              {payBusy === "decline" ? "Declining…" : "Pay (test decline)"}
            </button>
          </div>
          {cart.length === 0 && (
            <p className="cp" style={{ marginTop: 8 }}>
              BAG IS EMPTY · ADD A LOT FIRST
            </p>
          )}
          {message ? (
            <p className="field-error" role="alert" style={{ marginTop: 10 }}>
              {message}
            </p>
          ) : null}
        </div>

        <aside className="chk-sum">
          <div className="cp">{count} ITEMS</div>
          {cart.map((item) => (
            <div
              key={item._id}
              style={{
                display: "flex",
                gap: 9,
                marginTop: 10,
                alignItems: "center",
              }}
            >
              <ProductImage src={item.imageUrl} alt={item.name} label="" width={38} height={38} />
              <div style={{ flex: 1 }}>
                {item.name}
                {item.size ? ` ${item.size}` : ""}
              </div>
              <span>{money(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="hr" style={{ margin: "11px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal</span>
            <span>{money(subtotal, true)}</span>
          </div>
          {discountAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
              <span>Discount</span>
              <span>−{money(discountAmount, true)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
            <span>Dispatch</span>
            <span>{money(dispatch, true)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 16 }}>
            <span>Total</span>
            <span>{money(total, true)}</span>
          </div>
          <div className="cp" style={{ marginTop: 14 }}>
            ROASTED TUE · LEAVES WED 09:00
          </div>
        </aside>
      </form>
    </main>
  );
}
