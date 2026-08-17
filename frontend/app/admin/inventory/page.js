"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

export default function AdminInventoryPage() {
  const [rows, setRows] = useState([]);
  const [productId, setProductId] = useState("");

  async function load(id = productId) {
    const qs = id ? `?productId=${encodeURIComponent(id)}` : "";
    const { response, data } = await apiFetch(`/api/admin/inventory${qs}`);
    if (response.ok) setRows(data.data || []);
  }

  useEffect(() => { load(""); }, []);

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: 16, paddingBottom: 36 }}>
        <h1>Inventory history</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(productId);
          }}
          style={{ display: "flex", gap: 8, marginTop: 12 }}
        >
          <label htmlFor="pid" className="sr-only">Product id</label>
          <input id="pid" className="input" value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="product id" />
          <button type="submit" className="bt">Filter</button>
        </form>
        <div className="table-scroll" style={{ marginTop: 16 }}>
          <table className="admin-table">
            <thead><tr><th>When</th><th>Product</th><th>Delta</th><th>Reason</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id}>
                  <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}</td>
                  <td>{row.productId?.name || row.productId}</td>
                  <td>{row.delta}</td>
                  <td>{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
