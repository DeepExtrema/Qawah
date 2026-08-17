"use client";

import AdminBar from "../../components/AdminBar";
import { useAuth } from "../../context/AuthContext";
import Link from "next/link";

export default function AdminLayout({ children }) {
  const { user, loaded } = useAuth();

  if (!loaded) {
    return (
      <main className="page">
        <div className="shell empty">
          <p className="cp">LOADING</p>
        </div>
      </main>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <main className="page">
        <div className="shell empty">
          <h1 className="display" style={{ fontSize: 24 }}>
            Trade staff only
          </h1>
          <p className="cp" style={{ marginTop: 8 }}>
            THIS DESK IS FOR QAHWA SUPPLY ADMIN
          </p>
          <p style={{ marginTop: 10, fontSize: 13.5 }}>
            Sign in with an administrator account to manage lots, inventory, and discounts.
          </p>
          <Link href="/login" className="bt bp" style={{ marginTop: 16 }}>
            Trade login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <AdminBar />
      {children}
    </>
  );
}
