"use client";

import { useEffect, useState } from "react";
import { API, apiError, apiFetch, authHeaders } from "../../../lib/api";

const EMPTY = {
  name: "",
  description: "",
  price: "",
  category: "coffee",
  inventory: "0",
  slug: "",
  origin: "",
  roast: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const [bulk, setBulk] = useState("");

  async function load() {
    const { response, data } = await apiFetch("/api/products");
    if (response.ok) setProducts(Array.isArray(data) ? data : data.data || []);
  }

  useEffect(() => {
    load();
  }, []);

  function onChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function save(event) {
    event.preventDefault();
    setMessage("");
    const payload = {
      ...form,
      price: Number(form.price),
      inventory: Number(form.inventory),
    };
    const path = editing ? `/api/products/${editing}` : "/api/products";
    const { response, data } = await apiFetch(path, {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setMessage(apiError(data, "Could not save product."));
      return;
    }
    setForm(EMPTY);
    setEditing(null);
    setMessage(editing ? "Product updated." : "Product created.");
    load();
  }

  function edit(product) {
    setEditing(product._id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      category: product.category || "coffee",
      inventory: String(product.inventory ?? 0),
      slug: product.slug || "",
      origin: product.origin || "",
      roast: product.roast || "",
    });
  }

  async function remove(id) {
    if (!window.confirm("Delete this product?")) return;
    const { response, data } = await apiFetch(`/api/products/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage(apiError(data, "Could not delete."));
      return;
    }
    load();
  }

  async function upload(id, file) {
    if (!file) return;
    setMessage("");
    const body = new FormData();
    body.append("image", file);
    const response = await fetch(`${API}/api/admin/products/${id}/image`, {
      method: "POST",
      headers: authHeaders(),
      body,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(apiError(data, "Image upload failed."));
      return;
    }
    setMessage("Image saved.");
    load();
  }

  async function applyBulk(event) {
    event.preventDefault();
    const updates = bulk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [id, inventory] = line.split(/[,\s]+/);
        return { id, inventory: Number(inventory) };
      });
    const { response, data } = await apiFetch("/api/admin/products/bulk", {
      method: "POST",
      body: JSON.stringify({ updates }),
    });
    if (!response.ok) {
      setMessage(apiError(data, "Bulk update failed."));
      return;
    }
    setMessage("Inventory updated.");
    setBulk("");
    load();
  }

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: 16, paddingBottom: 36 }}>
        <h1>Products</h1>
        <p className="cp">CREATE · EDIT · DELETE · IMAGE · INVENTORY</p>
        {message ? <p className="msg" role="status">{message}</p> : null}

        <form className="b" style={{ padding: 14, marginTop: 14 }} onSubmit={save}>
          <div className="form-grid-2">
            <div>
              <label className="cp" htmlFor="name">Name</label>
              <input id="name" name="name" className="input" value={form.name} onChange={onChange} required />
            </div>
            <div>
              <label className="cp" htmlFor="slug">Slug</label>
              <input id="slug" name="slug" className="input" value={form.slug} onChange={onChange} />
            </div>
            <div className="span-2">
              <label className="cp" htmlFor="description">Description</label>
              <textarea id="description" name="description" className="input" rows={2} value={form.description} onChange={onChange} required />
            </div>
            <div>
              <label className="cp" htmlFor="price">Price</label>
              <input id="price" name="price" className="input" type="number" step="0.01" value={form.price} onChange={onChange} required />
            </div>
            <div>
              <label className="cp" htmlFor="inventory">Inventory</label>
              <input id="inventory" name="inventory" className="input" type="number" value={form.inventory} onChange={onChange} required />
            </div>
            <div>
              <label className="cp" htmlFor="category">Category</label>
              <select id="category" name="category" className="select" value={form.category} onChange={onChange}>
                <option value="coffee">Coffee</option>
                <option value="husk">Husk</option>
                <option value="gear">Gear</option>
              </select>
            </div>
            <div>
              <label className="cp" htmlFor="origin">Origin</label>
              <input id="origin" name="origin" className="input" value={form.origin} onChange={onChange} />
            </div>
            <div>
              <label className="cp" htmlFor="roast">Roast</label>
              <input id="roast" name="roast" className="input" value={form.roast} onChange={onChange} />
            </div>
          </div>
          <button type="submit" className="bt bp" style={{ marginTop: 12 }}>
            {editing ? "Save changes" : "Create product"}
          </button>
          {editing && (
            <button type="button" className="bt" style={{ marginLeft: 8 }} onClick={() => { setEditing(null); setForm(EMPTY); }}>
              Cancel
            </button>
          )}
        </form>

        <div className="table-scroll" style={{ marginTop: 18 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Inv</th>
                <th>Image</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{product.price}</td>
                  <td>{product.inventory}</td>
                  <td>
                    <label className="cp">
                      Upload
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={(e) => upload(product._id, e.target.files?.[0])}
                      />
                    </label>
                  </td>
                  <td>
                    <button type="button" className="bt bt-sm" onClick={() => edit(product)}>Edit</button>{" "}
                    <button type="button" className="bt bt-sm" onClick={() => remove(product._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form className="b" style={{ padding: 14, marginTop: 18 }} onSubmit={applyBulk}>
          <label className="cp" htmlFor="bulk">Bulk inventory — one id,quantity per line</label>
          <textarea id="bulk" className="input" rows={4} value={bulk} onChange={(e) => setBulk(e.target.value)} />
          <button type="submit" className="bt" style={{ marginTop: 8 }}>
            Apply bulk
          </button>
        </form>
      </div>
    </main>
  );
}
