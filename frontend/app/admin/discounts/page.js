"use client";

import { useEffect, useState } from "react";
import { apiError, apiFetch } from "../../../lib/api";

const EMPTY = { code: "", percent: "10", amountOff: "0", minSubtotal: "0", maxUses: "0", active: true };

export default function AdminDiscountsPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState("");

  async function load() {
    const { response, data } = await apiFetch("/api/admin/discounts");
    if (response.ok) setRows(data.data || []);
  }
  useEffect(() => { load(); }, []);

  async function save(event) {
    event.preventDefault();
    const { response, data } = await apiFetch("/api/admin/discounts", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        percent: Number(form.percent),
        amountOff: Number(form.amountOff),
        minSubtotal: Number(form.minSubtotal),
        maxUses: Number(form.maxUses),
      }),
    });
    if (!response.ok) {
      setMessage(apiError(data, "Could not save."));
      return;
    }
    setForm(EMPTY);
    load();
  }

  async function toggle(row) {
    await apiFetch(`/api/admin/discounts/${row.id || row._id}`, {
      method: "PUT",
      body: JSON.stringify({ active: !row.active }),
    });
    load();
  }

  async function remove(id) {
    await apiFetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: 16, paddingBottom: 36 }}>
        <h1>Discount codes</h1>
        <form className="b" style={{ padding: 14, marginTop: 12 }} onSubmit={save}>
          <div className="form-grid-2">
            <div>
              <label className="cp" htmlFor="code">Code</label>
              <input id="code" className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </div>
            <div>
              <label className="cp" htmlFor="percent">Percent</label>
              <input id="percent" className="input" type="number" value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })} />
            </div>
            <div>
              <label className="cp" htmlFor="amountOff">Amount off</label>
              <input id="amountOff" className="input" type="number" value={form.amountOff} onChange={(e) => setForm({ ...form, amountOff: e.target.value })} />
            </div>
            <div>
              <label className="cp" htmlFor="minSubtotal">Min subtotal</label>
              <input id="minSubtotal" className="input" type="number" value={form.minSubtotal} onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="bt bp" style={{ marginTop: 10 }}>Create</button>
          {message ? <p className="field-error">{message}</p> : null}
        </form>
        <div className="table-scroll" style={{ marginTop: 16 }}>
          <table className="admin-table">
            <thead><tr><th>Code</th><th>Off</th><th>Min</th><th>Uses</th><th>Active</th><th></th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id || row._id}>
                  <td>{row.code}</td>
                  <td>{row.percent ? `${row.percent}%` : `$${row.amountOff}`}</td>
                  <td>{row.minSubtotal}</td>
                  <td>{row.usageCount}/{row.maxUses || "∞"}</td>
                  <td>{row.active ? "yes" : "no"}</td>
                  <td>
                    <button type="button" className="bt bt-sm" onClick={() => toggle(row)}>Toggle</button>{" "}
                    <button type="button" className="bt bt-sm" onClick={() => remove(row.id || row._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
