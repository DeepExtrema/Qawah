"use client";

import { useState } from "react";
import Placeholder from "../../components/Placeholder";

const TOPICS = [
  { id: "all", label: "All", n: 18 },
  { id: "ibrik", label: "Ibrik & qahwa", n: 5 },
  { id: "filter", label: "Filter", n: 4 },
  { id: "espresso", label: "Espresso", n: 3 },
  { id: "qishr", label: "Qishr", n: 2 },
  { id: "history", label: "History", n: 4 },
];

const EQUIP = ["Ibrik", "V60", "Moka pot", "Batch brewer"];

const GUIDES = [
  { title: "Ibrik: 30 s bloom, 3 rises", tag: "METHOD", min: "4 MIN", topic: "ibrik", equip: "Ibrik" },
  { title: "V60 for Haraaz naturals · 18:290", tag: "FILTER", min: "5 MIN", topic: "filter", equip: "V60" },
  { title: "Cardamom: when and how much", tag: "METHOD", min: "4 MIN", topic: "ibrik", equip: "Ibrik" },
  { title: "Qishr: brewing the husk, not the bean", tag: "QISHR", min: "3 MIN", topic: "qishr", equip: "Ibrik" },
  { title: "Why the Mokha port mattered", tag: "HISTORY", min: "7 MIN", topic: "history", equip: null },
  { title: "Dialling in a 5 kg café bag", tag: "TRADE", min: "8 MIN", topic: "espresso", equip: "Batch brewer" },
];

export default function LearnPage() {
  const [topic, setTopic] = useState("all");
  const [equip, setEquip] = useState(null);

  const rows = GUIDES.filter((g) => {
    if (topic !== "all" && g.topic !== topic) return false;
    if (equip && g.equip !== equip) return false;
    return true;
  });

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
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={topic === t.id ? "is-on" : ""}
                  onClick={() => setTopic(t.id)}
                >
                  {t.label} ({t.n})
                </button>
              ))}
            </div>
            <div className="hr" style={{ background: "#e0dbd1", margin: "14px 0" }} />
            <div className="cp">EQUIPMENT</div>
            <div className="side-nav">
              {EQUIP.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={equip === e ? "is-on" : ""}
                  onClick={() => setEquip(equip === e ? null : e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </aside>

          <section className="side-main">
            <div className="b" style={{ padding: 12, display: "flex", gap: 14, alignItems: "center" }}>
              <Placeholder label="img" width={120} height={78} />
              <div style={{ flex: 1 }}>
                <div className="cp">RECIPE CARD</div>
                <div className="display" style={{ fontSize: 20, marginTop: 3 }}>
                  Qahwa in an ibrik
                </div>
                <div className="cp" style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                  <span>7 g : 70 ml</span>
                  <span>FINE / POWDER</span>
                  <span>3 RISES</span>
                  <span>≈ 4 MIN</span>
                </div>
              </div>
              <button type="button" className="bt" style={{ padding: "4px 11px" }}>
                Open
              </button>
            </div>

            <div className="guide-list">
              {rows.map((g) => (
                <div className="guide-row" key={g.title}>
                  <span style={{ flex: 2.6 }}>{g.title}</span>
                  <span className="cp" style={{ flex: 1 }}>
                    {g.tag}
                  </span>
                  <span className="cp">{g.min}</span>
                </div>
              ))}
            </div>
            <div className="cp" style={{ marginTop: 14 }}>
              EVERY GUIDE LINKS THE LOTS IT WAS WRITTEN FOR
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
