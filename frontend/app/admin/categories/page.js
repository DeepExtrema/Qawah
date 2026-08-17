"use client";

import { useEffect, useState } from "react";
import { apiError, apiFetch } from "../../../lib/api";

export default function AdminCategoriesPage() {
  const [rows, setRows] = useState([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const { response, data } = await apiFetch("/api/admin/categories");
    if (response.ok) setRows(data.data || []);
  }

  useEffect(() => { load(); }, []);

  async function create(event) {
    event.preventDefault();
    const { response, data } = await apiFetch("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      setMessage(apiError(data, "Could not create."));
      return;
    }
    setName("");
    load();
  }

  async function remove(id) {
    await apiFetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: 16, paddingBottom: 36 }}>
        <h1>Categories</h1>
        <form onSubmit={create} style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <label htmlFor="cat-name" className="sr-only">Name</label>
          <input id="cat-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          <button type="submit" className="bt bp">Add</button>
        </form>
        {message ? <p className="field-error">{message}</p> : null}
        <div className="table-scroll" style={{ marginTop: 16 }}>
          <table className="admin-table">
            <thead><tr><th>Name</th><th>Slug</th><th></th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id}>
                  <td>{row.name}</td>
                  <td>{row.slug}</td>
                  <td><button type="button" className="bt bt-sm" onClick={() => remove(row._id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
