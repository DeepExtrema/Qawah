"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import ProductImage from "./ProductImage";
import { money } from "../lib/lots";

const NAV = [
  { href: "/coffee", label: "Coffee" },
  { href: "/subscribe", label: "Subscribe" },
  { href: "/gear", label: "Gear" },
  { href: "/wholesale", label: "Wholesale" },
  { href: "/learn", label: "Learn" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { cart, subtotal, count } = useCart();
  const { user, logout } = useAuth();
  const [q, setQ] = useState("");

  function handleSignOut() {
    logout();
    // Account, orders and admin pages all require a session, so staying put
    // would leave the visitor on a page that immediately tells them to log in.
    router.push("/");
  }

  function onSearch(event) {
    event.preventDefault();
    const term = q.trim();
    router.push(term ? `/coffee?q=${encodeURIComponent(term)}` : "/coffee");
  }

  const shipFree = subtotal >= 40;
  const preview = cart.slice(-4).reverse();

  return (
    <header>
      <div className="announce">
        <span className="cp">
          ROASTED TUESDAYS · SHIPS WEDNESDAY · FREE OVER $40
        </span>
        {user ? (
          <span className="announce-account">
            <Link href="/account" className="announce-login">
              {user.name ? String(user.name).toUpperCase() : "TRADE ACCOUNT"}
            </Link>
            <button type="button" className="announce-login link-btn" onClick={handleSignOut}>
              SIGN OUT
            </button>
          </span>
        ) : (
          <span className="announce-account">
            <Link href="/login" className="announce-login">
              TRADE LOGIN
            </Link>
            <Link href="/register" className="announce-login">
              REGISTER
            </Link>
          </span>
        )}
      </div>

      <nav className="nv" aria-label="Primary">
        <Link href="/" className="brand">
          QAHWA SUPPLY
        </Link>

        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              pathname === item.href || pathname.startsWith(item.href + "/")
                ? "nv-link is-active"
                : "nv-link"
            }
          >
            {item.label}
          </Link>
        ))}

        <form className="search-box" onSubmit={onSearch} role="search">
          <label htmlFor="lot-search" className="sr-only">
            Search lots
          </label>
          <input
            id="lot-search"
            type="search"
            placeholder="SEARCH LOTS"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
          />
        </form>

        <Link
          href="/wishlist"
          className={pathname === "/wishlist" ? "nv-link is-active" : "nv-link"}
        >
          Saved
        </Link>
        <Link
          href={user ? "/account" : "/login"}
          className={
            pathname === "/account" || pathname === "/profile"
              ? "nv-link is-active"
              : "nv-link"
          }
        >
          {user ? "Account" : "Sign in"}
        </Link>
        {user?.role === "admin" && (
          <Link
            href="/admin"
            className={pathname.startsWith("/admin") ? "nv-link is-active" : "nv-link"}
          >
            Desk
          </Link>
        )}

        <div className="bag-wrap">
          <Link href="/cart" className="ch bag-chip">
            Bag · {count}
          </Link>
          <div className="mini-cart" role="region" aria-label="Mini cart">
            <div className="cp">MINI-CART · HOVER FROM HEADER</div>
            {preview.length === 0 ? (
              <p style={{ marginTop: 10, fontSize: 13.5 }}>Bag is empty.</p>
            ) : (
              preview.map((item) => (
                <div className="mini-row" key={item._id}>
                  <ProductImage
                    src={item.imageUrl}
                    alt={item.name}
                    label=""
                    width={42}
                    height={42}
                  />
                  <div style={{ flex: 1 }}>
                    {item.name}
                    {item.size ? ` ${item.size}` : ""}
                    <div className="cp">
                      ×{item.quantity} · {money(item.price)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div className="hr" style={{ margin: "10px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{money(subtotal, true)}</span>
              <span className="cp">
                {shipFree ? "FREE SHIPPING ✓" : "FREE OVER $40"}
              </span>
            </div>
            <div className="mini-actions">
              <Link href="/cart" className="bt">
                View bag
              </Link>
              <Link href="/checkout" className="bt bp">
                Checkout
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
