"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ProductImage from "../../../components/ProductImage";
import WishlistButton from "../../../components/WishlistButton";
import LowStockBadge from "../../../components/LowStockBadge";
import RecentlyViewed from "../../../components/RecentlyViewed";
import { useCart } from "../../../context/CartContext";
import { useAuth } from "../../../context/AuthContext";
import { apiError, apiFetch } from "../../../lib/api";
import {
  GRINDS,
  SIZES,
  getLot,
  mergeWithApi,
  money,
  sizePrice,
  subscribePrice,
} from "../../../lib/lots";

export default function ProductPage() {
  const params = useParams();
  const id = params?.id;
  const [lot, setLot] = useState(() => getLot(id));
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [eligible, setEligible] = useState(false);
  const [recs, setRecs] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, body: "" });
  const [reviewMsg, setReviewMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const local = getLot(id);
      try {
        const { response, data } = await apiFetch("/api/products");
        if (response.ok) {
          const merged = mergeWithApi(data);
          const hit = merged.find(
            (item) =>
              item._id === id ||
              item.slug === id ||
              item.mockId === id ||
              (local &&
                (item.slug === local.slug ||
                  item.mockId === local._id ||
                  item.name === local.name))
          );
          if (!cancelled && hit) {
            setLot(hit);
            return;
          }
        }
      } catch {
        /* keep local lot */
      }
      if (!cancelled && local) setLot(local);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!lot?._id) return undefined;
    let cancelled = false;
    async function extras() {
      try {
        await apiFetch("/api/recent", {
          method: "POST",
          body: JSON.stringify({ productId: lot._id }),
        });
      } catch {}
      try {
        const rev = await apiFetch(`/api/products/${lot._id}/reviews`);
        if (!cancelled && rev.response.ok) {
          setReviews(rev.data.data?.reviews || []);
          setAverage(rev.data.data?.average || 0);
          setReviewCount(rev.data.data?.count || 0);
        }
      } catch {}
      try {
        const rec = await apiFetch(`/api/products/${lot._id}/recommendations`);
        if (!cancelled && rec.response.ok) setRecs(rec.data.data || []);
      } catch {}
      if (user) {
        try {
          const el = await apiFetch(`/api/reviews/eligible/${lot._id}`);
          if (!cancelled && el.response.ok) setEligible(Boolean(el.data.data?.eligible));
        } catch {
          setEligible(false);
        }
      } else if (!cancelled) {
        setEligible(false);
      }
    }
    extras();
    return () => {
      cancelled = true;
    };
  }, [lot?._id, user]);

  const [sizeId, setSizeId] = useState(() => {
    if (!lot) return "340g";
    if (lot.sizes && lot.sizes[0]) return lot.sizes[0].id;
    if (lot.category === "gear") return "default";
    if (lot.category === "husk") return "200g";
    return "340g";
  });
  const [grind, setGrind] = useState(lot?.grindDefault || "Whole bean");
  const [qty, setQty] = useState(1);
  const [thumb, setThumb] = useState(0);

  const sizes = useMemo(() => {
    if (!lot) return [];
    if (lot.sizes) return lot.sizes;
    if (lot.category === "gear") {
      return [{ id: "default", label: lot.sizeLabel, price: lot.price }];
    }
    return SIZES.map((s) => ({
      ...s,
      price: sizePrice(lot, s.id),
    }));
  }, [lot]);

  if (!lot) {
    return (
      <main className="page">
        <div className="shell empty">
          <h1>Lot not found</h1>
          <p className="cp" style={{ marginTop: 8 }}>
            THAT ID IS NOT IN THIS ROAST WEEK
          </p>
          <Link href="/coffee" className="bt" style={{ marginTop: 16 }}>
            Back to coffee
          </Link>
        </div>
      </main>
    );
  }

  // Real images only. Most lots ship a single photo, so the thumbnail rail
  // stays hidden rather than padding itself out with empty slots.
  const gallery = (
    Array.isArray(lot.images) && lot.images.length ? lot.images : [lot.imageUrl]
  ).filter(Boolean);
  const activeImage = gallery[thumb] || gallery[0] || lot.imageUrl;

  const activeSize = sizes.find((s) => s.id === sizeId) || sizes[0];
  const unitPrice =
    activeSize?.trade || activeSize?.price == null
      ? lot.price
      : activeSize.price;
  const subPrice = subscribePrice(unitPrice);
  const canBuy = !lot.soldOut && !activeSize?.trade;

  function add() {
    addToCart({
      ...lot,
      price: unitPrice,
      size: activeSize?.label || lot.sizeLabel,
      grind: lot.category === "coffee" ? grind : null,
      quantity: qty,
    });
  }

  async function submitReview(event) {
    event.preventDefault();
    setReviewMsg("");
    const { response, data } = await apiFetch("/api/reviews", {
      method: "POST",
      body: JSON.stringify({
        productId: lot._id,
        rating: Number(reviewForm.rating),
        body: reviewForm.body,
      }),
    });
    if (!response.ok) {
      setReviewMsg(apiError(data, "Could not save review."));
      return;
    }
    setEligible(false);
    setReviewMsg("Thank you, your review was saved.");
    setReviews((current) => [data.data, ...current]);
    setReviewCount((n) => n + 1);
  }

  return (
    <main className="page">
      <div className="shell">
        <div className="crumbs">
          <span className="cp">
            COFFEE / {lot.origin} / {lot.name}
          </span>
        </div>

        <div className={gallery.length > 1 ? "pdp" : "pdp pdp-nothumbs"}>
          {/* The rail only appears when there is a second image to switch to.
              It used to render four fixed slots and fill just the first, so
              every product showed three empty boxes. */}
          {gallery.length > 1 ? (
            <div className="thumbs">
              {gallery.map((image, i) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setThumb(i)}
                  aria-label={`Show image ${i + 1} of ${gallery.length}`}
                  aria-current={thumb === i}
                  style={{
                    background: "none",
                    padding: 0,
                    border: 0,
                    opacity: thumb === i ? 1 : 0.7,
                  }}
                >
                  <ProductImage
                    src={image}
                    alt={`${lot.name}, image ${i + 1}`}
                    label={String(i + 1)}
                    height={60}
                  />
                </button>
              ))}
            </div>
          ) : null}

          <div>
            <ProductImage
              src={activeImage}
              alt={lot.displayName || lot.name}
              label="main image"
              height={212}
            />
            <h1 className="display" style={{ fontSize: 24, marginTop: 14 }}>
              {lot.displayName || lot.name}
            </h1>
            <div className="cp" style={{ marginTop: 4 }}>
              {lot.lotLine}
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <WishlistButton product={lot} />
              <LowStockBadge inventory={lot.inventory} />
              {reviewCount > 0 && (
                <span className="ch">
                  {average} / 5 · {reviewCount} review{reviewCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
            {lot.description ? (
              <p style={{ marginTop: 10, fontSize: 13.5, maxWidth: 520 }}>{lot.description}</p>
            ) : null}

            <div className="b spec-card">
              <div className="spec-head">
                <span className="cp">SPEC SHEET</span>
                <a href="#" className="cp" style={{ marginLeft: "auto" }}>
                  DOWNLOAD PDF
                </a>
              </div>
              <div className="spec-grid">
                <div className="spec-cell">
                  <span className="cp">ALTITUDE</span> {lot.altitude}
                </div>
                <div className="spec-cell">
                  <span className="cp">VARIETAL</span> {lot.varietal}
                </div>
                <div className="spec-cell">
                  <span className="cp">PROCESS</span> {lot.processDetail || lot.process}
                </div>
                <div className="spec-cell">
                  <span className="cp">HARVEST</span> {lot.harvest}
                </div>
                <div className="spec-cell">
                  <span className="cp">AGTRON</span> {lot.agtronLabel || lot.agtron || "n/a"}
                </div>
                <div className="spec-cell">
                  <span className="cp">DENSITY</span> {lot.density}
                </div>
                <div className="spec-cell">
                  <span className="cp">FILTER</span> {lot.recipes?.filter}
                </div>
                <div className="spec-cell">
                  <span className="cp">IBRIK</span> {lot.recipes?.ibrik}
                </div>
              </div>
            </div>

            <div className="notes">
              {(lot.notes || []).map((n) => (
                <span key={n} className="ch">
                  {n}
                </span>
              ))}
              {lot.score ? <span className="ch">{lot.score} pts</span> : null}
            </div>

            {lot.story ? (
              <section className="b lot-story" aria-labelledby="lot-story-heading">
                <span className="cp" id="lot-story-heading">
                  {lot.category === "gear" ? "ABOUT THIS" : "THE LOT"}
                </span>
                {lot.story
                  .split(/\n\s*\n/)
                  .map((paragraph) => paragraph.trim())
                  .filter(Boolean)
                  .map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
              </section>
            ) : null}
          </div>

          <div>
            <div className="b buy">
              <div style={{ fontSize: 19 }}>{money(unitPrice, true)}</div>
              <div className="cp" style={{ marginTop: 3 }}>
                {lot.soldOut
                  ? `SOLD OUT · NEXT ROAST ${lot.roastDateShort}`
                  : `IN STOCK · ${lot.inventory} BAGS`}
              </div>
              <LowStockBadge inventory={lot.inventory} />

              <div className="cp" style={{ marginTop: 12 }}>
                SIZE
              </div>
              <div className="size-list">
                {sizes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={sizeId === s.id ? "b size-opt is-on" : "b size-opt"}
                    onClick={() => setSizeId(s.id)}
                  >
                    {s.label}
                    {" · "}
                    {s.trade ? "trade" : money(s.price)}
                  </button>
                ))}
              </div>

              {lot.category === "coffee" && (
                <div className="field">
                  <label className="cp" htmlFor="grind">
                    GRIND
                  </label>
                  <select
                    id="grind"
                    className="select"
                    value={grind}
                    onChange={(e) => setGrind(e.target.value)}
                  >
                    {GRINDS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="field">
                <div className="cp" id="qty-label">
                  QTY
                </div>
                <div className="stepper" role="group" aria-labelledby="qty-label">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQty((n) => Math.max(1, n - 1))}
                  >
                    −
                  </button>
                  <span>{qty}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQty((n) => n + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="bt bp"
                style={{ width: "100%", marginTop: 12 }}
                disabled={!canBuy}
                onClick={add}
              >
                {lot.soldOut ? "Notify" : "Add to bag"}
              </button>

              <Link href="/subscribe" className="b sub-cta">
                <div style={{ fontSize: 13.5 }}>
                  Subscribe: {money(subPrice, true)}
                </div>
                <div className="cp">SAVE 15% · EVERY 2 WEEKS</div>
              </Link>

              <div className="cp" style={{ marginTop: 12 }}>
                STICKY ON SCROLL
              </div>
            </div>

            <div className="b trade-sticky">
              <div className="cp">TRADE</div>
              <Link href="/login" style={{ fontSize: 13.5, display: "block", marginTop: 5 }}>
                Log in for 5 kg pricing
              </Link>
            </div>
          </div>
        </div>

        <section style={{ marginTop: 28 }}>
          <h2>Reviews</h2>
          <p className="cp" style={{ marginTop: 4 }}>
            {reviewCount ? `${average} AVERAGE · ${reviewCount} NOTES` : "NO REVIEWS YET"}
          </p>
          {eligible && (
            <form className="b" style={{ padding: 14, marginTop: 12 }} onSubmit={submitReview}>
              <label className="cp" htmlFor="rating">
                Rating
              </label>
              <select
                id="rating"
                className="select"
                value={reviewForm.rating}
                onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} / 5
                  </option>
                ))}
              </select>
              <label className="cp" htmlFor="review-body" style={{ display: "block", marginTop: 8 }}>
                Note
              </label>
              <textarea
                id="review-body"
                className="input"
                rows={3}
                value={reviewForm.body}
                onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
              />
              <button type="submit" className="bt bp" style={{ marginTop: 10 }}>
                Post review
              </button>
              {reviewMsg ? <p className="msg">{reviewMsg}</p> : null}
            </form>
          )}
          <div style={{ marginTop: 12 }}>
            {reviews.map((review) => (
              <div key={review._id} className="order-row">
                <span style={{ flex: 0.4 }}>{review.rating} / 5</span>
                <span style={{ flex: 2 }}>{review.body || "No note."}</span>
                <span className="cp">
                  {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                </span>
              </div>
            ))}
          </div>
        </section>

        {recs.length > 0 && (
          <section className="section-pad">
            <div className="section-head">
              <h2>You may also like</h2>
            </div>
            <div className="grid-4">
              {recs.map((item) => (
                <article key={item._id} className="b lot-card">
                  <Link href={`/products/${item._id}`}>
                    <ProductImage src={item.imageUrl} alt={item.name} label="bag" height={88} />
                    <div className="name">{item.name}</div>
                    <div className="cp">{item.origin || item.category}</div>
                  </Link>
                  <div className="row">
                    <span>{money(item.price)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <RecentlyViewed excludeId={lot._id} />
      </div>
    </main>
  );
}
