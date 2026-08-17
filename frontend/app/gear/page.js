"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductImage from "../../components/ProductImage";
import AddToCartButton from "../../components/AddToCartButton";
import WishlistButton from "../../components/WishlistButton";
import LowStockBadge from "../../components/LowStockBadge";
import { apiFetch } from "../../lib/api";
import { LOTS, gearLots, mergeWithApi, money } from "../../lib/lots";

export default function GearPage() {
  const [catalog, setCatalog] = useState(LOTS);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { response, data } = await apiFetch("/api/products");
        if (!response.ok) return;
        if (!cancelled) setCatalog(mergeWithApi(data));
      } catch {
        /* mock LOTS stay in place */
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = catalog.filter((lot) => lot.category === "gear");
  const fallback = items.length ? items : gearLots();

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: 16, paddingBottom: 36 }}>
        <div className="section-head">
          <h1>Gear</h1>
          <span className="cp" style={{ marginLeft: "auto" }}>
            {fallback.length} ITEMS
          </span>
        </div>
        <div className="grid-3">
          {fallback.map((lot) => (
            <article key={lot._id} className="b lot-card">
              <WishlistButton product={lot} className="wish-abs" />
              <Link href={`/products/${lot._id}`}>
                <ProductImage
                  src={lot.imageUrl}
                  alt={lot.name}
                  label={lot.placeholder || "img"}
                  height={120}
                />
                <div className="name">{lot.name}</div>
                <div className="cp">{lot.cardMeta}</div>
                <div className="cp">{lot.cardMeta2}</div>
              </Link>
              <LowStockBadge inventory={lot.inventory} />
              <div className="row">
                <span>{money(lot.price)}</span>
                <AddToCartButton product={lot} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
