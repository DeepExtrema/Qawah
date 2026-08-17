"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { apiError, apiFetch } from "../../lib/api";
import { money } from "../../lib/lots";

const NAV = [
  "Dashboard",
  "Orders",
  "Addresses",
  "Invoices · Net-30",
  "Team access",
  "Spec sheets",
];

export default function AccountPage() {
  const { user, loaded, logout } = useAuth();
  const { addToCart } = useCart();
  const [tab, setTab] = useState("Dashboard");
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [note, setNote] = useState("");
  const [addrForm, setAddrForm] = useState({
    label: "Home",
    line1: "",
    city: "",
    region: "",
    postal: "",
    country: "US",
    isDefault: false,
  });
  const [addrError, setAddrError] = useState("");

  useEffect(() => {
    if (!user) return;
    apiFetch("/api/orders/my-orders").then(({ response, data }) => {
      if (response.ok) setOrders(data.data || []);
    });
    apiFetch("/api/addresses").then(({ response, data }) => {
      if (response.ok) setAddresses(data.data || []);
    });
  }, [user]);

  async function saveAddress(event) {
    event.preventDefault();
    setAddrError("");
    const { response, data } = await apiFetch("/api/addresses", {
      method: "POST",
      body: JSON.stringify(addrForm),
    });
    if (!response.ok) {
      setAddrError(apiError(data, "Could not save address."));
      return;
    }
    setAddresses((current) => [data.data, ...current]);
    setAddrForm({ label: "Home", line1: "", city: "", region: "", postal: "", country: "US", isDefault: false });
  }

  async function removeAddress(id) {
    await apiFetch(`/api/addresses/${id}`, { method: "DELETE" });
    setAddresses((current) => current.filter((row) => row._id !== id));
  }

  if (!loaded) {
    return (
      <main className="page">
        <div className="shell empty"><p className="cp">LOADING</p></div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page">
        <div className="shell empty">
          <h1>Account</h1>
          <p style={{ marginTop: 8 }}>Log in to see orders and addresses.</p>
          <Link href="/login" className="bt bp" style={{ marginTop: 16 }}>Trade login</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell">
        <div className="crumbs">
          <span className="cp">{String(user.name || "TRADE").toUpperCase()} · ACCOUNT</span>
          <button type="button" className="cp" style={{ marginLeft: "auto", background: "none", border: 0 }} onClick={logout}>
            LOG OUT
          </button>
        </div>
        <div className="side-layout">
          <aside className="side">
            <div className="side-nav" style={{ marginTop: 0 }}>
              {NAV.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={tab === item ? "is-on" : ""}
                  onClick={() => setTab(item)}
                >
                  {item === "Addresses" ? `Addresses (${addresses.length})` : item}
                </button>
              ))}
              {user.role === "admin" && (
                <Link href="/admin">Trade desk</Link>
              )}
            </div>
          </aside>

          <section className="side-main">
            {(tab === "Dashboard" || tab === "Orders") && (
              <>
                <div className="stat-grid">
                  <div className="b stat">
                    <div className="cp">ORDERS</div>
                    <div className="display">{orders.length}</div>
                  </div>
                  <div className="b stat">
                    <div className="cp">ADDRESSES</div>
                    <div className="display">{addresses.length}</div>
                  </div>
                  <div className="b stat">
                    <div className="cp">ROLE</div>
                    <div className="display">{user.role}</div>
                  </div>
                </div>
                <div className="cp" style={{ marginTop: 16 }}>RECENT ORDERS</div>
                <div>
                  {orders.length === 0 && <p style={{ fontSize: 13.5 }}>No orders yet.</p>}
                  {orders.map((o) => (
                    <div className="order-row" key={o._id}>
                      <span style={{ flex: 1 }}>
                        #{String(o._id).slice(-6)} · {new Date(o.createdAt).toLocaleDateString()}
                      </span>
                      <span style={{ flex: 1 }}>{o.items?.length || 0} items</span>
                      <span style={{ flex: 1 }}>{money(o.totalPrice, true)}</span>
                      <span className="cp" style={{ flex: 1 }}>{o.status}</span>
                      <Link href={`/orders/confirmation/${o._id}`} className="cp">VIEW</Link>
                      <button
                        type="button"
                        className="cp"
                        style={{ background: "none", border: 0 }}
                        onClick={() => {
                          (o.items || []).forEach((item) =>
                            addToCart({
                              _id: item.productId,
                              name: item.name,
                              price: item.price,
                              quantity: item.quantity,
                              grind: item.grind,
                              size: item.size,
                            })
                          );
                          setNote("Added to bag");
                        }}
                      >
                        REORDER
                      </button>
                    </div>
                  ))}
                </div>
                {note ? <p className="msg">{note}</p> : null}
              </>
            )}

            {tab === "Addresses" && (
              <>
                <form className="b" style={{ padding: 14 }} onSubmit={saveAddress}>
                  <div className="form-grid-2">
                    <div>
                      <label className="cp" htmlFor="label">Label</label>
                      <input id="label" className="input" value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })} />
                    </div>
                    <div className="span-2">
                      <label className="cp" htmlFor="line1">Address</label>
                      <input id="line1" className="input" required autoComplete="address-line1" value={addrForm.line1} onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })} />
                    </div>
                    <div>
                      <label className="cp" htmlFor="city">City</label>
                      <input id="city" className="input" required autoComplete="address-level2" value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} />
                    </div>
                    <div>
                      <label className="cp" htmlFor="postal">Postal</label>
                      <input id="postal" className="input" required autoComplete="postal-code" value={addrForm.postal} onChange={(e) => setAddrForm({ ...addrForm, postal: e.target.value })} />
                    </div>
                    <div>
                      <label className="cp" htmlFor="region">Region</label>
                      <input id="region" className="input" autoComplete="address-level1" value={addrForm.region} onChange={(e) => setAddrForm({ ...addrForm, region: e.target.value })} />
                    </div>
                    <div>
                      <label className="cp" htmlFor="country">Country</label>
                      <input id="country" className="input" autoComplete="country-name" value={addrForm.country} onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })} />
                    </div>
                  </div>
                  <label className="check-row">
                    <input type="checkbox" checked={addrForm.isDefault} onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })} />
                    Default address
                  </label>
                  <button type="submit" className="bt bp" style={{ marginTop: 10 }}>Save address</button>
                  {addrError ? <p className="field-error">{addrError}</p> : null}
                </form>
                <div style={{ marginTop: 16 }}>
                  {addresses.map((row) => (
                    <div className="order-row" key={row._id}>
                      <span style={{ flex: 2 }}>
                        {row.label} — {row.line1}, {row.city} {row.postal}
                        {row.isDefault ? " · default" : ""}
                      </span>
                      <button type="button" className="cp" style={{ background: "none", border: 0 }} onClick={() => removeAddress(row._id)}>
                        REMOVE
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "Invoices · Net-30" && (
              <p style={{ fontSize: 13.5 }}>Invoices appear after paid trade orders.</p>
            )}
            {tab === "Team access" && (
              <p style={{ fontSize: 13.5 }}>Team seats stay on the trade desk.</p>
            )}
            {tab === "Spec sheets" && (
              <p style={{ fontSize: 13.5 }}>Download PDFs from each lot page.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
