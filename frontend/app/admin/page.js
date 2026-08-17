"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import { money } from "../../lib/lots";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState("Loading desk…");

  useEffect(() => {
    async function load() {
      const { response, data } = await apiFetch("/api/admin/stats");
      if (!response.ok) {
        setMessage(data.error?.message || data.message || "Unable to load stats.");
        return;
      }
      setStats(data.data);
      setMessage("");
    }
    load();
  }, []);

  if (message) {
    return (
      <main className="page">
        <div className="shell empty">
          <p>{message}</p>
        </div>
      </main>
    );
  }

  const by = stats.byStatus || {};

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: 16, paddingBottom: 36 }}>
        <div className="section-head">
          <h1>Sales desk</h1>
          <span className="cp">PAID TOTALS · LIVE INVENTORY</span>
        </div>
        <div className="stat-grid">
          <div className="b stat">
            <div className="cp">REVENUE</div>
            <div className="display">{money(stats.revenue, true)}</div>
            <div className="cp" style={{ marginTop: 3 }}>
              {stats.paidOrders} PAID ORDERS
            </div>
          </div>
          <div className="b stat">
            <div className="cp">ORDERS</div>
            <div className="display">{stats.orderCount}</div>
            <div className="cp" style={{ marginTop: 3 }}>
              ALL STATUSES
            </div>
          </div>
          <div className="b stat">
            <div className="cp">LOW STOCK</div>
            <div className="display">{stats.lowInventory?.length || 0}</div>
            <div className="cp" style={{ marginTop: 3 }}>
              8 BAGS OR FEWER
            </div>
          </div>
        </div>

        <div className="cp" style={{ marginTop: 18 }}>
          BY STATUS
        </div>
        <div className="b sheet">
          {["Processing", "Paid", "Failed", "Cancelled", "Delivered"].map((status) => (
            <div className="sheet-row" key={status}>
              <span style={{ flex: 2 }}>{status}</span>
              <span style={{ flex: 1 }}>{by[status] || 0}</span>
            </div>
          ))}
        </div>

        {stats.lowInventory?.length > 0 && (
          <>
            <div className="cp" style={{ marginTop: 18 }}>
              LOW INVENTORY
            </div>
            <div className="b sheet">
              {stats.lowInventory.map((lot) => (
                <div className="sheet-row" key={lot._id}>
                  <span style={{ flex: 2 }}>{lot.name}</span>
                  <span style={{ flex: 1 }}>{lot.inventory} bags</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
          <Link href="/admin/products" className="bt bp">
            Manage products
          </Link>
          <Link href="/admin/inventory" className="bt">
            Inventory history
          </Link>
        </div>
      </div>
    </main>
  );
}
