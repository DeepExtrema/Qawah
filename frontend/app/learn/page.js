"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ProductImage from "../../components/ProductImage";
import { GUIDES, TOPICS, EQUIPMENT, topicCounts } from "../../lib/guides";
import { RECIPE_CARD_IMAGE } from "../../lib/media";

// The guide the recipe card opens. Kept as a slug so the card cannot point at
// a guide that no longer exists without the link breaking visibly.
const FEATURED = "ibrik-three-rises";

function LearnIndex() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The topic lives in the URL rather than in state so that a link can point
  // at one. The footer links straight to /learn?topic=ibrik, and holding the
  // selection in useState meant those links had nowhere to land: every topic
  // resolved to the same bare /learn and the page never changed. Reading it
  // back off the URL also means the filter survives a refresh and the back
  // button steps through topics.
  const requested = searchParams.get("topic");
  // An unknown ?topic= falls back to All rather than filtering everything out,
  // so a stale or mistyped link shows guides instead of an empty page.
  const topic = TOPICS.some((t) => t.id === requested) ? requested : "all";
  const [equip, setEquip] = useState(null);

  function selectTopic(next) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("topic");
    else params.set("topic", next);
    const query = params.toString();
    // replace, not push: filter churn should not stack up entries the back
    // button has to walk out of. scroll:false keeps the sidebar under the
    // cursor instead of jumping to the top of the page on every click.
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const counts = useMemo(() => topicCounts(), []);
  const featured = GUIDES.find((g) => g.slug === FEATURED);

  const rows = GUIDES.filter((g) => {
    if (topic !== "all" && g.topic !== topic) return false;
    if (equip && g.equip !== equip) return false;
    return true;
  });

  function clearFilters() {
    setEquip(null);
    selectTopic("all");
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
                onClick={() => selectTopic("all")}
              >
                All ({counts.all})
              </button>
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={topic === t.id ? "is-on" : ""}
                  aria-pressed={topic === t.id}
                  onClick={() => selectTopic(t.id)}
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

export default function LearnPage() {
  return (
    <Suspense
      fallback={
        <main className="page">
          <div className="shell empty">
            <p className="cp">LOADING GUIDES</p>
          </div>
        </main>
      }
    >
      <LearnIndex />
    </Suspense>
  );
}
