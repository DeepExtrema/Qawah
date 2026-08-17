"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

export default function AdminCustomersPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    apiFetch("/api/admin/customers").then(({ response, data }) => {
      if (response.ok) setRows(data.data || []);
    });
  }, []);

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: 16, paddingBottom: 36 }}>
        <h1>Customers</h1>
        <div className="table-scroll" style={{ marginTop: 16 }}>
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id}>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
