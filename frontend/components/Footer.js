"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function Footer() {
  const { user, loaded } = useAuth();

  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-col">
          <span className="cp">QAHWA SUPPLY</span>
          <span>Yemeni-lineage coffee, roasted Tuesdays in Brooklyn.</span>
          <span className="cp">SHIPS WEDNESDAY · FREE OVER $40</span>
        </div>
        <div className="footer-col">
          <span className="cp">SHOP</span>
          <Link href="/coffee">Coffee</Link>
          <Link href="/gear">Gear</Link>
          <Link href="/subscribe">Subscribe</Link>
          <Link href="/cart">Bag</Link>
          <Link href="/wishlist">Saved lots</Link>
        </div>
        <div className="footer-col">
          <span className="cp">LEARN</span>
          <Link href="/learn">Brew guides</Link>
          <Link href="/learn">Ibrik &amp; qahwa</Link>
          <Link href="/learn">Qishr</Link>
        </div>
        <div className="footer-col">
          <span className="cp">TRADE</span>
          <Link href="/wholesale">Wholesale</Link>
          {/* Offering "Trade login" and "Open an account" to somebody who is
              already signed in sent them to a sign-up form they did not need.
              Until the session is known, show neither rather than guessing. */}
          {loaded && user ? (
            <>
              <Link href="/account">Account</Link>
              <Link href="/profile">Profile</Link>
              <Link href="/orders">Orders</Link>
            </>
          ) : null}
          {loaded && !user ? (
            <>
              <Link href="/login">Trade login</Link>
              <Link href="/register">Open an account</Link>
            </>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
