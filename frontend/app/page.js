"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SUBSCRIPTION_IMAGE, WHOLESALE_IMAGE } from "../lib/media";
import ProductImage from "../components/ProductImage";
import AddToCartButton from "../components/AddToCartButton";
import WishlistButton from "../components/WishlistButton";
import LowStockBadge from "../components/LowStockBadge";
import RecentlyViewed from "../components/RecentlyViewed";
import { useCart } from "../context/CartContext";
import { apiFetch } from "../lib/api";
import {
  HOME_ROAST,
  LOTS,
  ORDER_AGAIN,
  getLot,
  inStockLots,
  mergeWithApi,
  money,
} from "../lib/lots";

export default function Home() {
  const { addToCart } = useCart();
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

  const byId = useMemo(() => {
    const map = {};
    catalog.forEach((lot) => {
      map[lot._id] = lot;
      map[lot.slug] = lot;
      if (lot.mockId) map[lot.mockId] = lot;
    });
    return map;
  }, [catalog]);

  function resolveLot(id) {
    const mock = getLot(id);
    return (
      byId[id] ||
      (mock && (byId[mock.slug] || byId[mock._id])) ||
      mock
    );
  }

  const featured = HOME_ROAST.map(resolveLot).filter(Boolean);

  const stockCount = inStockLots().length;

  return (
    <main className="page">
      <div className="shell">
        <section className="intro">
          <div>
            <h1>Yemeni-lineage coffee, roasted weekly</h1>
            <div className="cp">
              {stockCount} LOTS IN STOCK · ORIGIN DATA ON EVERY LABEL
            </div>
          </div>
          <div className="intro-actions">
            <Link href="/coffee" className="bt bp">
              Shop all
            </Link>
            <Link href="/wholesale" className="bt">
              Wholesale pricing
            </Link>
          </div>
        </section>

        <section className="section-pad">
          <div className="section-head">
            <h2>Shop by roast</h2>
            <span className="cp" style={{ marginLeft: "auto" }}>
              {stockCount} RESULTS
            </span>
          </div>
          <div className="grid-4">
            {featured.map((lot) => (
              <article key={lot._id} className="b lot-card">
                <WishlistButton product={lot} className="wish-abs" />
                <Link href={`/products/${lot._id}`}>
                  <ProductImage src={lot.imageUrl} alt={lot.name} label="bag" height={104} />
                  <div className="name">{lot.name}</div>
                  <div className="cp">{lot.homeTag}</div>
                </Link>
                <LowStockBadge inventory={lot.inventory} />
                <div className="row">
                  <span>{money(lot.price)}</span>
                  <AddToCartButton product={lot} />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="shell">
        <div className="promo-row">
          <div className="promo">
            <ProductImage src={SUBSCRIPTION_IMAGE} alt="" label="img" width={88} height={70} />
            <div className="promo-copy">
              <div>Subscribe · from $17.85</div>
              <div className="cp">SET GRIND + CADENCE, SKIP ANY WEEK</div>
            </div>
            <Link href="/subscribe" className="bt bp" style={{ padding: "5px 12px" }}>
              Build
            </Link>
          </div>
          <div className="promo">
            <ProductImage src={WHOLESALE_IMAGE} alt="" label="img" width={88} height={70} />
            <div className="promo-copy">
              <div>Cafés, masjids, offices</div>
              <div className="cp">5 KG TIERS · NET-30 · TRAINING INCLUDED</div>
            </div>
            <Link href="/wholesale" className="bt" style={{ padding: "5px 12px" }}>
              Enquire
            </Link>
          </div>
        </div>
      </div>

      <div className="shell section-pad">
        <div className="cp">ORDER AGAIN</div>
        <div className="reorder-row">
          {ORDER_AGAIN.map((row) => {
            const lot = resolveLot(row.id);
            if (!lot) return null;
            return (
              <button
                key={row.id}
                type="button"
                className="b reorder"
                onClick={() => addToCart(lot)}
              >
                <ProductImage src={lot.imageUrl} alt={lot.name} label="" width={38} height={38} />
                <div style={{ flex: 1, fontSize: 13.5, textAlign: "left" }}>
                  {row.label}
                  <div className="cp">LAST: {row.last}</div>
                </div>
                <span className="reorder-plus">+</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="shell">
        <RecentlyViewed />
      </div>
    </main>
  );
}
