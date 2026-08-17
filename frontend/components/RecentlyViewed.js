"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductImage from "./ProductImage";
import { apiFetch } from "../lib/api";
import { money } from "../lib/lots";

export default function RecentlyViewed({ excludeId } = {}) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { response, data } = await apiFetch("/api/recent");
        if (!cancelled && response.ok) {
          const rows = (data.data || []).filter(
            (item) => String(item._id) !== String(excludeId)
          );
          setItems(rows.slice(0, 4));
        }
      } catch {
        /* empty */
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [excludeId]);

  if (!items.length) return null;

  return (
    <section className="section-pad">
      <div className="section-head">
        <h2>Recently viewed</h2>
        <span className="cp" style={{ marginLeft: "auto" }}>
          THIS BROWSER
        </span>
      </div>
      <div className="grid-4">
        {items.map((lot) => (
          <article key={lot._id} className="b lot-card">
            <Link href={`/products/${lot._id}`}>
              <ProductImage src={lot.imageUrl} alt={lot.name} label="bag" height={88} />
              <div className="name">{lot.name}</div>
              <div className="cp">{lot.origin || lot.category}</div>
            </Link>
            <div className="row">
              <span>{money(lot.price)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
