"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductImage from "../../components/ProductImage";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { apiError, apiFetch, apiFieldErrors } from "../../lib/api";
import { money } from "../../lib/lots";
import {
  CHECKOUT_LABELS,
  COUNTRIES,
  POSTAL_RULES,
  isPickup,
  normalizeCountry,
  regionLabel,
  summarizeFields,
  validateCheckout,
} from "../../lib/formRules";

const FALLBACK_METHODS = [
  { id: "roast", label: "Roast-day dispatch (Wed)", price: 9 },
  { id: "std", label: "Standard (3-5 days)", price: 5 },
  { id: "pickup", label: "Local pickup (Brooklyn)", price: 0 },
];

// Fields that exist as inputs and can therefore be jumped to from the summary.
// "cart" is a state of the bag, not a box on this page.
const JUMPABLE = new Set([
  "customerEmail",
  "customerName",
  "country",
  "address1",
  "city",
  "region",
  "zip",
]);

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
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [alertNonce, setAlertNonce] = useState(0);
  const alertRef = useRef(null);
  /*
   * Blur-validation inserts an error message under the field being left, which
   * pushes everything below it down. When the blur is caused by pressing the
   * submit button, that happens between pointerdown and pointerup: the button
   * moves out from under the cursor, mouseup lands on the form instead, and the
   * browser fires click on their common ancestor rather than on the button. The
   * press is swallowed and the form appears to do nothing.
   *
   * pointerdown fires before blur, so this flag is already set when it matters.
   * It is a ref and not state on purpose - setting state here would re-render
   * and cause the very shift it exists to prevent.
   */
  const submitPressRef = useRef(false);


  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        customerName: user.name || f.customerName,
        customerEmail: user.email || f.customerEmail,
      }));
    }
  }, [user]);

  // Bring the summary to the reader rather than waiting to be found. On a form
  // this tall the offending field is routinely below the fold, and the browser's
  // own bubble anchors there.
  useEffect(() => {
    if (alertNonce === 0) return;
    const node = alertRef.current;
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    node.focus({ preventScroll: true });
  }, [alertNonce]);

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
      // A stored address may predate the country list, so anything unrecognised
      // lands on "Somewhere else" rather than silently reverting to the US.
      country: normalizeCountry(row.country) || (row.country ? "OTHER" : "US"),
    }));
  }

  const ship = methods.find((m) => m.id === method) || methods[0];
  const dispatch = ship ? ship.price : 0;
  const discountAmount = discount?.discountAmount || 0;
  const total = Math.max(0, subtotal - discountAmount + dispatch);

  const pickup = isPickup(method);
  const countryCode = normalizeCountry(form.country);
  const postalHint = (POSTAL_RULES[countryCode] || {}).hint || "";
  const regionName = regionLabel(form.country);

  const check = validateCheckout(form, {
    shippingMethod: method,
    cartCount: cart.length,
  });

  const fieldErrors = {};
  Object.keys(CHECKOUT_LABELS).forEach((field) => {
    if (serverErrors[field]) fieldErrors[field] = serverErrors[field];
    else if (check.fields[field] && (submitted || touched[field])) {
      fieldErrors[field] = check.fields[field];
    }
  });

  const hasServerError = Object.keys(serverErrors).length > 0;
  const summary =
    submitted || hasServerError ? summarizeFields(fieldErrors, CHECKOUT_LABELS) : [];
  const summaryTitle =
    summary.length === 1
      ? "One thing to sort out before we can take payment:"
      : `${summary.length} things to sort out before we can take payment:`;

  function focusField(field) {
    const node = document.getElementById(field);
    if (!node) return;
    node.focus();
    node.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleChange(event) {
    submitPressRef.current = false;
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setServerErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function handleBlur(event) {
    if (submitPressRef.current) return;
    const { name } = event.target;
    setTouched((current) => ({ ...current, [name]: true }));
  }

  function describedBy(field, extra) {
    const ids = [fieldErrors[field] ? `${field}-error` : "", extra || ""]
      .filter(Boolean)
      .join(" ");
    return ids || undefined;
  }

  function inputClass(field, base = "input") {
    return fieldErrors[field] ? `${base} is-bad` : base;
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
      const error = new Error(apiError(data, "Unable to place order."));
      error.fields = apiFieldErrors(data);
      throw error;
    }
    const order = data.data?.order;
    const token = data.data?.confirmationToken || order?.confirmationToken;
    return { order, token };
  }

  async function pay(outcome) {
    setMessage("");

    // A pending order has already cleared validation and been accepted by the
    // API; this is a retry of the payment step alone.
    if (!pendingOrder) {
      setSubmitted(true);
      const verdict = validateCheckout(form, {
        shippingMethod: method,
        cartCount: cart.length,
      });
      if (!verdict.valid) {
        setAlertNonce((current) => current + 1);
        return;
      }
    }

    setPayBusy(outcome);
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
      if (error.fields && Object.keys(error.fields).length > 0) {
        setServerErrors(error.fields);
        setAlertNonce((current) => current + 1);
      }
      setMessage(error.message || "Unable to complete payment.");
    } finally {
      setPayBusy("");
    }
  }

  /*
   * Wired to the button's onClick as well as the form's onSubmit. onSubmit
   * alone was not firing for a real mouse click on the register page's submit
   * button, so pressing it did visibly nothing. A handler on the button covers
   * both paths: implicit submission (Enter inside a field) is specified to
   * fire a click on the default submit button too. preventDefault cancels the
   * submission, so onSubmit does not fire afterwards and pay() is not called
   * twice.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    submitPressRef.current = false;
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

      {/* noValidate: the browser reports one problem at a time, anchored to a
          field that is usually below the fold on a form this long. The summary
          at the top of the column replaces it. */}
      <form className="shell chk" onSubmit={handleSubmit} noValidate>
        <div className="chk-form">
          {summary.length > 0 ? (
            <div className="form-alert" role="alert" tabIndex={-1} ref={alertRef}>
              <p className="form-alert-title">{summaryTitle}</p>
              <ul>
                {summary.map((item) => (
                  <li key={item.field}>
                    {JUMPABLE.has(item.field) ? (
                      <>
                        <button
                          type="button"
                          className="form-alert-jump"
                          onClick={() => focusField(item.field)}
                        >
                          {item.label}
                        </button>{" "}
                        — {item.message}
                      </>
                    ) : (
                      item.message
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {check.notes.map((note) => (
            <div className="form-note" key={note}>
              {note}
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
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
            className={inputClass("customerEmail")}
            type="email"
            autoComplete="email"
            value={form.customerEmail}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(fieldErrors.customerEmail)}
            aria-describedby={describedBy("customerEmail")}
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
            className={inputClass("customerName")}
            type="text"
            autoComplete="name"
            value={form.customerName}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(fieldErrors.customerName)}
            aria-describedby={describedBy("customerName")}
          />
          {fieldErrors.customerName ? (
            <p id="customerName-error" className="field-error">
              {fieldErrors.customerName}
            </p>
          ) : null}

          {/* Method comes before the address because it decides whether there is
              an address to collect at all. */}
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

          {pickup ? (
            <>
              <div className="cp" style={{ marginTop: 14 }}>
                COLLECTION
              </div>
              <p style={{ marginTop: 8, fontSize: 13.5 }}>
                Collect from the Brooklyn roastery. No address needed — we will email
                you when the bag is ready.
              </p>
            </>
          ) : (
            <>
              <div className="cp" style={{ marginTop: 14 }}>
                SHIP TO
              </div>
              {addresses.length > 0 && (
                <>
                  <label
                    htmlFor="saved-address"
                    className="cp"
                    style={{ display: "block", marginTop: 7 }}
                  >
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
                {/* Country first: it decides the postal format and whether a
                    state or province is part of the address. A free-text box
                    here made both of those unenforceable. */}
                <div className="span-2">
                  <label htmlFor="country" className="cp">
                    Country
                  </label>
                  <select
                    id="country"
                    name="country"
                    className={inputClass("country", "select")}
                    value={form.country}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="country"
                    aria-invalid={Boolean(fieldErrors.country)}
                    aria-describedby={describedBy("country")}
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.country ? (
                    <p id="country-error" className="field-error">
                      {fieldErrors.country}
                    </p>
                  ) : null}
                </div>
                <div className="span-2">
                  <label htmlFor="address1" className="cp">
                    Address
                  </label>
                  <input
                    id="address1"
                    name="address1"
                    className={inputClass("address1")}
                    autoComplete="address-line1"
                    value={form.address1}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={Boolean(fieldErrors.address1)}
                    aria-describedby={describedBy("address1")}
                  />
                  {fieldErrors.address1 ? (
                    <p id="address1-error" className="field-error">
                      {fieldErrors.address1}
                    </p>
                  ) : null}
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
                <div>
                  <label htmlFor="city" className="cp">
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    className={inputClass("city")}
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={Boolean(fieldErrors.city)}
                    aria-describedby={describedBy("city")}
                  />
                  {fieldErrors.city ? (
                    <p id="city-error" className="field-error">
                      {fieldErrors.city}
                    </p>
                  ) : null}
                </div>
                <div>
                  {/* Labelled with the word the destination actually uses, so a
                      Canadian is asked for a Province and not a State. */}
                  <label htmlFor="region" className="cp">
                    {regionName}
                  </label>
                  <input
                    id="region"
                    name="region"
                    className={inputClass("region")}
                    autoComplete="address-level1"
                    value={form.region}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={Boolean(fieldErrors.region)}
                    aria-describedby={describedBy("region")}
                  />
                  {fieldErrors.region ? (
                    <p id="region-error" className="field-error">
                      {fieldErrors.region}
                    </p>
                  ) : null}
                </div>
                <div className="span-2">
                  <label htmlFor="zip" className="cp">
                    Postal code
                  </label>
                  <input
                    id="zip"
                    name="zip"
                    className={inputClass("zip")}
                    autoComplete="postal-code"
                    value={form.zip}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={Boolean(fieldErrors.zip)}
                    aria-describedby={describedBy("zip", postalHint ? "zip-hint" : "")}
                  />
                  {fieldErrors.zip ? (
                    <p id="zip-error" className="field-error">
                      {fieldErrors.zip}
                    </p>
                  ) : null}
                  {/* The expected shape, shown before it is got wrong. */}
                  {postalHint && !fieldErrors.zip ? (
                    <p id="zip-hint" className="field-hint">
                      {postalHint}
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          )}

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
            {/* Deliberately not disabled while the form is incomplete: a button
                that does nothing explains nothing. Pressing it produces the
                summary at the top, which does. */}
            <button
              type="submit"
              className="bt bp"
              disabled={Boolean(payBusy)}
              onPointerDown={() => {
                submitPressRef.current = true;
              }}
              onClick={handleSubmit}
            >
              {payBusy === "success" ? "Paying…" : `Pay (test success) · ${money(total, true)}`}
            </button>
            <button
              type="button"
              className="bt"
              disabled={Boolean(payBusy)}
              onPointerDown={() => {
                submitPressRef.current = true;
              }}
              onClick={() => {
                submitPressRef.current = false;
                pay("decline");
              }}
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
