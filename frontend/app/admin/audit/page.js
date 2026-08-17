"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";

export default function AdminAuditPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    apiFetch("/api/admin/audit").then(({ response, data }) => {
      if (response.ok) setRows(data.data || []);
    });
  }, []);

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: 16, paddingBottom: 36 }}>
        <h1>Audit log</h1>
        <div className="table-scroll" style={{ marginTop: 16 }}>
          <table className="admin-table">
            <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th><th>Id</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id}>
                  <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}</td>
                  <td>{row.actorId?.email || "n/a"}</td>
                  <td>{row.action}</td>
                  <td>{row.entity}</td>
                  <td>{row.entityId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
