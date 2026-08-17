"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import ProductImage from "../../../components/ProductImage";
import { getGuide, GUIDES } from "../../../lib/guides";
import { getLot, money } from "../../../lib/lots";

export default function GuidePage() {
  const params = useParams();
  const guide = getGuide(params?.slug);

  if (!guide) {
    return (
      <main className="page">
        <div className="shell empty">
          <h1>Guide not found</h1>
          <p className="cp" style={{ marginTop: 8 }}>
            THAT GUIDE IS NOT IN THE LIBRARY
          </p>
          <Link href="/learn" className="bt" style={{ marginTop: 16 }}>
            Back to Learn
          </Link>
        </div>
      </main>
    );
  }

  // The lots the method was tuned on. Filtered because a guide may reference a
  // product that is not in the catalogue the storefront is currently showing.
  const lots = guide.lots.map(getLot).filter(Boolean);

  // Other guides on the same topic, so a reader has somewhere to go next.
  const related = GUIDES.filter(
    (g) => g.topic === guide.topic && g.slug !== guide.slug
  ).slice(0, 3);

  return (
    <main className="page">
      <div className="shell">
        <div className="crumbs">
          <span className="cp">
            <Link href="/learn">LEARN</Link> / {guide.tag}
          </span>
        </div>

        <article className="guide-article">
          <header>
            <h1 className="display" style={{ fontSize: 26 }}>
              {guide.title}
            </h1>
            <div className="cp" style={{ marginTop: 6, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <span>{guide.tag}</span>
              <span>{guide.min} MIN READ</span>
              {guide.equip ? <span>{guide.equip.toUpperCase()}</span> : null}
            </div>
            <p className="guide-lede">{guide.summary}</p>
          </header>

          {guide.sections.map((section) => (
            <section key={section.heading} className="guide-section">
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </article>

        {lots.length ? (
          <section className="b guide-lots" aria-labelledby="guide-lots-heading">
            <span className="cp" id="guide-lots-heading">
              WRITTEN FOR THESE LOTS
            </span>
            <div className="guide-lot-row">
              {lots.map((lot) => (
                <Link key={lot.slug} href={`/products/${lot.slug}`} className="guide-lot">
                  <ProductImage
                    src={lot.imageUrl}
                    alt={lot.name}
                    label="bag"
                    height={64}
                  />
                  <div>
                    <div>{lot.name}</div>
                    <div className="cp" style={{ marginTop: 2 }}>
                      {lot.soldOut ? "SOLD OUT" : money(lot.price, true)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {related.length ? (
          <section className="section-pad">
            <div className="cp">MORE ON THIS</div>
            <div className="guide-list">
              {related.map((g) => (
                <Link className="guide-row" key={g.slug} href={`/learn/${g.slug}`}>
                  <span style={{ flex: 2.6 }}>{g.title}</span>
                  <span className="cp" style={{ flex: 1 }}>
                    {g.tag}
                  </span>
                  <span className="cp">{g.min} MIN</span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
