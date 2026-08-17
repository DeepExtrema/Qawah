"use client";

import Link from "next/link";
import ProductImage from "../../components/ProductImage";
import AddToCartButton from "../../components/AddToCartButton";
import WishlistButton from "../../components/WishlistButton";
import LowStockBadge from "../../components/LowStockBadge";
import { useAuth } from "../../context/AuthContext";
import { useWishlist } from "../../context/WishlistContext";
import { money } from "../../lib/lots";

export default function WishlistPage() {
  const { user, loaded } = useAuth();
  const { items, message } = useWishlist();

  if (!loaded) {
    return (
      <main className="page">
        <div className="shell empty">
          <p className="cp">LOADING</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page">
        <div className="shell empty">
          <h1>Wishlist</h1>
          <p style={{ marginTop: 8, fontSize: 13.5 }}>
            Log in to save lots for later.
          </p>
          <Link href="/login" className="bt bp" style={{ marginTop: 16 }}>
            Trade login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: 16, paddingBottom: 36 }}>
        <div className="section-head">
          <h1>Wishlist</h1>
          <span className="cp" style={{ marginLeft: "auto" }}>
            {items.length} LOTS
          </span>
        </div>
        {message ? <p className="msg">{message}</p> : null}
        {items.length === 0 ? (
          <p style={{ marginTop: 12, fontSize: 13.5 }}>
            Nothing saved. Heart a lot from the shop.
          </p>
        ) : (
          <div className="grid-3" style={{ marginTop: 12 }}>
            {items.map((row) => {
              const lot = row.product;
              if (!lot) return null;
              return (
                <article key={row.id || lot._id} className="b lot-card">
                  <WishlistButton product={lot} className="wish-abs" />
                  <Link href={`/products/${lot._id}`}>
                    <ProductImage src={lot.imageUrl} alt={lot.name} label="bag" height={98} />
                    <div className="name">{lot.name}</div>
                    <div className="cp">{lot.origin || lot.category}</div>
                  </Link>
                  <LowStockBadge inventory={lot.inventory} />
                  <div className="row">
                    <span>{money(lot.price)}</span>
                    <AddToCartButton product={lot} label="Add to bag" />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
