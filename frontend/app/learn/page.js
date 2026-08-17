"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ProductImage from "../../components/ProductImage";
import { GUIDES, TOPICS, EQUIPMENT, topicCounts } from "../../lib/guides";
import { RECIPE_CARD_IMAGE } from "../../lib/media";

// The guide the recipe card opens. Kept as a slug so the card cannot point at
// a guide that no longer exists without the link breaking visibly.
const FEATURED = "ibrik-three-rises";

export default function LearnPage() {
  const [topic, setTopic] = useState("all");
  const [equip, setEquip] = useState(null);

  const counts = useMemo(() => topicCounts(), []);
  const featured = GUIDES.find((g) => g.slug === FEATURED);

  const rows = GUIDES.filter((g) => {
    if (topic !== "all" && g.topic !== topic) return false;
    if (equip && g.equip !== equip) return false;
    return true;
  });

  function clearFilters() {
    setTopic("all");
    setEquip(null);
  }

  return (
    <main className="page">
      <div className="shell">
        <div className="crumbs">
          <span className="cp">LEARN</span>
        </div>
        <div className="side-layout">
          <aside className="side">
            <div className="cp">TOPICS</div>
            <div className="side-nav">
              <button
                type="button"
                className={topic === "all" ? "is-on" : ""}
                aria-pressed={topic === "all"}
                onClick={() => setTopic("all")}
              >
                All ({counts.all})
              </button>
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={topic === t.id ? "is-on" : ""}
                  aria-pressed={topic === t.id}
                  onClick={() => setTopic(t.id)}
                >
                  {t.label} ({counts[t.id]})
                </button>
              ))}
            </div>
            <div className="hr" style={{ background: "#e0dbd1", margin: "14px 0" }} />
            <div className="cp">EQUIPMENT</div>
            <div className="side-nav">
              {EQUIPMENT.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={equip === e ? "is-on" : ""}
                  aria-pressed={equip === e}
                  onClick={() => setEquip(equip === e ? null : e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </aside>

          <section className="side-main">
            {featured ? (
              <div className="b recipe-card">
                <ProductImage
                  src={RECIPE_CARD_IMAGE}
                  alt=""
                  label="img"
                  width={120}
                  height={78}
                />
                <div style={{ flex: 1 }}>
                  <div className="cp">RECIPE CARD</div>
                  <div className="display" style={{ fontSize: 20, marginTop: 3 }}>
                    Qahwa in an ibrik
                  </div>
                  <div
                    className="cp"
                    style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}
                  >
                    <span>7 g : 70 ml</span>
                    <span>FINE / POWDER</span>
                    <span>3 RISES</span>
                    <span>≈ {featured.min} MIN</span>
                  </div>
                </div>
                <Link
                  href={`/learn/${featured.slug}`}
                  className="bt"
                  style={{ padding: "4px 11px" }}
                >
                  Open
                </Link>
              </div>
            ) : null}

            {rows.length ? (
              <div className="guide-list">
                {rows.map((g) => (
                  <Link className="guide-row" key={g.slug} href={`/learn/${g.slug}`}>
                    <span style={{ flex: 2.6 }}>{g.title}</span>
                    <span className="cp" style={{ flex: 1 }}>
                      {g.tag}
                    </span>
                    <span className="cp">{g.min} MIN</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="b empty-guides">
                <div>No guides match those filters yet.</div>
                <button type="button" className="bt" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            )}

            <div className="cp" style={{ marginTop: 14 }}>
              {rows.length === GUIDES.length
                ? "EVERY GUIDE LINKS THE LOTS IT WAS WRITTEN FOR"
                : `SHOWING ${rows.length} OF ${GUIDES.length} GUIDES`}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
