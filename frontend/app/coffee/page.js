"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ProductImage from "../../components/ProductImage";
import AddToCartButton from "../../components/AddToCartButton";
import WishlistButton from "../../components/WishlistButton";
import LowStockBadge from "../../components/LowStockBadge";
import { apiFetch } from "../../lib/api";
import { LOTS, mergeWithApi, money } from "../../lib/lots";

const ROASTS = ["Light", "Medium", "Dark"];
const ORIGINS = ["Yemen", "Ethiopia", "Java"];
const PROCESSES = ["Natural", "Washed", "Honey"];
const CAFFS = [
  { id: "full", label: "Full" },
  { id: "low", label: "Low / none" },
];

function toggle(list, value) {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function CoffeeGrid() {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") || "").trim().toLowerCase();

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

  // Memoised so `filtered` below has a stable dependency; otherwise this
  // array is a new reference every render and the filter/sort memo never hits.
  const all = useMemo(
    () => catalog.filter((lot) => lot.category === "coffee" || lot.category === "husk"),
    [catalog]
  );
  const [roasts, setRoasts] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [caffeine, setCaffeine] = useState([]);
  const [altMin, setAltMin] = useState(1200);
  const [altMax, setAltMax] = useState(2400);
  const [sort, setSort] = useState("altitude");

  function countFor(key, value) {
    return all.filter((lot) => {
      if (key === "roast") return lot.roast === value;
      if (key === "origin") return lot.origin === value;
      if (key === "process") return lot.process === value;
      if (key === "caffeine") {
        if (value === "low") return lot.caffeine === "low" || lot.caffeine === "none";
        return lot.caffeine === "full";
      }
      return false;
    }).length;
  }

  const filtered = useMemo(() => {
    const matched = all.filter((lot) => {
      if (q && !`${lot.name} ${lot.varietal} ${lot.origin}`.toLowerCase().includes(q)) {
        return false;
      }
      if (roasts.length && !roasts.includes(lot.roast)) return false;
      if (origins.length && !origins.includes(lot.origin)) return false;
      if (processes.length && !processes.includes(lot.process)) return false;
      if (caffeine.length) {
        const isLow = lot.caffeine === "low" || lot.caffeine === "none";
        const ok = caffeine.some((c) => (c === "low" ? isLow : !isLow && lot.caffeine === "full"));
        if (!ok) return false;
      }
      if (lot.altitudeM && lot.category === "coffee") {
        if (lot.altitudeM < altMin || lot.altitudeM > altMax) return false;
      }
      return true;
    });

    // Copy before sorting: sort() mutates, and reassigning the binding stops
    // the React Compiler from memoising this component at all.
    return [...matched].sort((a, b) => {
      if (sort === "roastDate") {
        return String(b.roastDate).localeCompare(String(a.roastDate));
      }
      return (b.altitudeM || 0) - (a.altitudeM || 0);
    });
  }, [all, q, roasts, origins, processes, caffeine, altMin, altMax, sort]);

  const chips = [
    ...roasts.map((v) => ({ group: "roast", value: v, label: v })),
    ...origins.map((v) => ({ group: "origin", value: v, label: v })),
    ...processes.map((v) => ({ group: "process", value: v, label: v })),
    ...caffeine.map((v) => ({
      group: "caffeine",
      value: v,
      label: v === "low" ? "Low caffeine" : "Full caffeine",
    })),
  ];

  const activeCount = chips.length;

  function clearChip(chip) {
    if (chip.group === "roast") setRoasts((s) => s.filter((v) => v !== chip.value));
    if (chip.group === "origin") setOrigins((s) => s.filter((v) => v !== chip.value));
    if (chip.group === "process") setProcesses((s) => s.filter((v) => v !== chip.value));
    if (chip.group === "caffeine") setCaffeine((s) => s.filter((v) => v !== chip.value));
  }

  function clearAll() {
    setRoasts([]);
    setOrigins([]);
    setProcesses([]);
    setCaffeine([]);
    setAltMin(1200);
    setAltMax(2400);
  }

  return (
    <main className="page">
      <div className="shell shop-layout">
        <aside className="filters">
          <div className="cp">
            FILTERS · {activeCount} ACTIVE
          </div>

          <div className="filter-block">
            <div className="cp">ROAST</div>
            <div className="filter-opts">
              {ROASTS.map((r) => (
                <label
                  key={r}
                  className={roasts.includes(r) ? "filter-opt is-on" : "filter-opt"}
                >
                  <input
                    type="checkbox"
                    checked={roasts.includes(r)}
                    onChange={() => setRoasts((s) => toggle(s, r))}
                  />
                  <span className="filter-box b" />
                  {r} ({countFor("roast", r)})
                </label>
              ))}
            </div>
          </div>

          <div className="filter-block">
            <div className="cp">ORIGIN</div>
            <div className="filter-opts">
              {ORIGINS.map((r) => (
                <label
                  key={r}
                  className={origins.includes(r) ? "filter-opt is-on" : "filter-opt"}
                >
                  <input
                    type="checkbox"
                    checked={origins.includes(r)}
                    onChange={() => setOrigins((s) => toggle(s, r))}
                  />
                  <span className="filter-box b" />
                  {r} ({countFor("origin", r)})
                </label>
              ))}
            </div>
          </div>

          <div className="filter-block">
            <div className="cp">PROCESS</div>
            <div className="filter-opts">
              {PROCESSES.map((r) => (
                <label
                  key={r}
                  className={processes.includes(r) ? "filter-opt is-on" : "filter-opt"}
                >
                  <input
                    type="checkbox"
                    checked={processes.includes(r)}
                    onChange={() => setProcesses((s) => toggle(s, r))}
                  />
                  <span className="filter-box b" />
                  {r}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-block">
            <div className="cp">ALTITUDE</div>
            <div className="b alt-track">
              <div className="alt-bar">
                <span
                  className="alt-knob"
                  style={{ left: `${((altMin - 1200) / 1200) * 100}%` }}
                />
                <span
                  className="alt-knob"
                  style={{ left: `${((altMax - 1200) / 1200) * 100}%` }}
                />
              </div>
            </div>
            <div className="cp" style={{ marginTop: 5 }}>
              {altMin.toLocaleString()} – {altMax.toLocaleString()} m
            </div>
            <label className="cp" htmlFor="alt-min" style={{ display: "block", marginTop: 8 }}>
              Min altitude
            </label>
            <input
              id="alt-min"
              className="select"
              type="range"
              min={1200}
              max={2400}
              step={50}
              value={altMin}
              onChange={(e) =>
                setAltMin(Math.min(Number(e.target.value), altMax))
              }
            />
            <label className="cp" htmlFor="alt-max" style={{ display: "block", marginTop: 6 }}>
              Max altitude
            </label>
            <input
              id="alt-max"
              className="select"
              type="range"
              min={1200}
              max={2400}
              step={50}
              value={altMax}
              onChange={(e) =>
                setAltMax(Math.max(Number(e.target.value), altMin))
              }
            />
          </div>

          <div className="filter-block">
            <div className="cp">CAFFEINE</div>
            <div className="filter-opts">
              {CAFFS.map((r) => (
                <label
                  key={r.id}
                  className={caffeine.includes(r.id) ? "filter-opt is-on" : "filter-opt"}
                >
                  <input
                    type="checkbox"
                    checked={caffeine.includes(r.id)}
                    onChange={() => setCaffeine((s) => toggle(s, r.id))}
                  />
                  <span className="filter-box b" />
                  {r.label}
                </label>
              ))}
            </div>
          </div>

          <button type="button" className="filter-clear" onClick={clearAll}>
            CLEAR ALL
          </button>
        </aside>

        <section className="shop-main">
          <div className="shop-head">
            <h1>Coffee</h1>
            <span className="cp">
              {filtered.length} OF {all.length} LOTS
            </span>
            <label htmlFor="sort" className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
              Sort lots
            </label>
            <select
              id="sort"
              className="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="altitude">SORT: ALTITUDE ▾</option>
              <option value="roastDate">SORT: ROAST DATE ▾</option>
            </select>
            <span className="cp">⊞ ⊟</span>
          </div>

          {chips.length > 0 && (
            <div className="chip-row">
              {chips.map((chip) => (
                <button
                  key={chip.group + chip.value}
                  type="button"
                  className="ch ch-acc"
                  onClick={() => clearChip(chip)}
                >
                  {chip.label} ✕
                </button>
              ))}
            </div>
          )}

          {q && (
            <div className="cp" style={{ margin: "8px 0" }}>
              SEARCH: {q.toUpperCase()}
            </div>
          )}

          <div className="grid-3" style={{ marginTop: 8 }}>
            {filtered.map((lot) => (
              <article
                key={lot._id}
                className={lot.soldOut ? "b lot-card is-sold" : "b lot-card"}
              >
                <WishlistButton product={lot} className="wish-abs" />
                <Link href={`/products/${lot._id}`}>
                  <ProductImage src={lot.imageUrl} alt={lot.name} label="bag" height={98} />
                  <div className="name">{lot.name}</div>
                  <div className="cp">{lot.cardMeta}</div>
                  <div className="cp">{lot.cardMeta2}</div>
                </Link>
                <LowStockBadge inventory={lot.inventory} />
                <div className="row">
                  <span>
                    {money(lot.price)}
                    {lot.sizeLabel ? ` / ${lot.sizeLabel}` : ""}
                  </span>
                  {lot.soldOut ? (
                    <button type="button" className="bt bt-sm" disabled>
                      Notify
                    </button>
                  ) : (
                    <AddToCartButton product={lot} />
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}


export default function CoffeePage() {
  return (
    <Suspense
      fallback={
        <main className="page">
          <div className="shell empty">
            <p className="cp">LOADING LOTS</p>
          </div>
        </main>
      }
    >
      <CoffeeGrid />
    </Suspense>
  );
}
