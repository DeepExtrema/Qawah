"use client";

import { useMemo, useState } from "react";
import { money, shopLots, subscribePrice } from "../../lib/lots";

const STEPS = [
  "Coffee",
  "Grind & size",
  "Cadence",
  "Address",
  "Review",
];
const CADENCES = ["weekly", "2 weeks", "monthly"];
const SIZE_OPTS = ["200 g", "340 g", "1 kg"];

function cadenceFactor(c) {
  if (c === "weekly") return 2;
  if (c === "monthly") return 0.5;
  return 1;
}

// Derived from the static catalogue, so this does not depend on props or
// state. Building it at module scope keeps `rows` referentially stable, which
// lets the running-total useMemo below actually memoise.
const SUB_LOTS = shopLots()
  .filter((l) => !l.soldOut && l.category === "coffee")
  .slice(0, 6);

const EXTRAS = [
  {
    _id: "lot-roasters-choice",
    name: "Roaster's choice",
    roast: "Rotates",
    price: 19,
  },
];

const ROWS = [...SUB_LOTS.slice(0, 2), EXTRAS[0]];

export default function SubscribePage() {
  const rows = ROWS;

  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState({
    "lot-haraaz-red": { qty: 1, size: "340 g", cadence: "2 weeks" },
    "lot-mokha-harasi": { qty: 1, size: "340 g", cadence: "monthly" },
  });
  const [gift, setGift] = useState(false);
  const [skipNote, setSkipNote] = useState("");
  const [grind, setGrind] = useState("Whole bean");

  function getSel(id) {
    return selected[id] || { qty: 0, size: "340 g", cadence: "2 weeks" };
  }

  function patch(id, next) {
    setSelected((s) => {
      const cur = s[id] || { qty: 0, size: "340 g", cadence: "2 weeks" };
      const merged = { ...cur, ...next };
      if (merged.qty <= 0) {
        const copy = { ...s };
        delete copy[id];
        return copy;
      }
      const active = Object.keys({ ...s, [id]: merged }).filter(
        (k) => ({ ...s, [id]: merged })[k].qty > 0
      );
      if (active.length > 3 && !s[id]) return s;
      return { ...s, [id]: merged };
    });
  }

  const activeRows = rows.filter((r) => getSel(r._id).qty > 0);

  const running = useMemo(() => {
    let biweekly = 0;
    Object.entries(selected).forEach(([id, sel]) => {
      const lot = rows.find((r) => r._id === id);
      if (!lot || !sel.qty) return;
      const unit = subscribePrice(lot.price);
      biweekly += unit * sel.qty * cadenceFactor(sel.cadence);
    });
    return biweekly;
  }, [selected, rows]);

  const perCup = running ? running / 50 : 0;

  return (
    <main className="page">
      <div className="shell">
        <div className="crumbs">
          <span className="cp">SUBSCRIPTION · CONFIGURE</span>
        </div>
        <div className="side-layout">
          <aside className="side">
            <div className="cp">CONFIGURE</div>
            <div className="side-nav">
              {STEPS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  className={step === i + 1 ? "is-on" : ""}
                  onClick={() => setStep(i + 1)}
                >
                  {i + 1} · {label}
                </button>
              ))}
            </div>
            <div className="hr" style={{ background: "#e0dbd1", margin: "16px 0" }} />
            <div className="cp">RUNNING TOTAL</div>
            <div style={{ fontSize: 17, marginTop: 5 }}>
              {money(running, true)} / 2 wks
            </div>
            <div className="cp" style={{ marginTop: 4 }}>
              ≈ {money(perCup, true)} PER CUP
            </div>
            <button
              type="button"
              className="bt bp"
              style={{ width: "100%", marginTop: 14, padding: "5px 0" }}
              onClick={() => setStep(5)}
            >
              Save plan
            </button>
          </aside>

          <section className="side-main">
            {step === 1 && (
              <>
                <h1 className="display" style={{ fontSize: 20 }}>
                  Pick the coffee
                </h1>
                <div className="cp" style={{ marginTop: 4 }}>
                  MIX UP TO 3 LOTS PER BOX
                </div>

                <div className="b sheet">
                  <div className="sheet-head">
                    <span className="cp" style={{ flex: 2 }}>
                      LOT
                    </span>
                    <span className="cp" style={{ flex: 1.2 }}>
                      ROAST
                    </span>
                    <span className="cp" style={{ flex: 1 }}>
                      SIZE
                    </span>
                    <span className="cp" style={{ flex: 0.8 }}>
                      QTY
                    </span>
                    <span className="cp" style={{ flex: 0.8 }}>
                      PRICE
                    </span>
                  </div>
                  {rows.map((lot) => {
                    const sel = getSel(lot._id);
                    const on = sel.qty > 0;
                    return (
                      <div className="sheet-row" key={lot._id}>
                        <span
                          style={{
                            flex: 2,
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <button
                            type="button"
                            className="b"
                            aria-pressed={on}
                            aria-label={`Toggle ${lot.name}`}
                            onClick={() =>
                              patch(lot._id, { qty: on ? 0 : 1 })
                            }
                            style={{
                              width: 13,
                              height: 13,
                              borderRadius: 2,
                              padding: 0,
                              background: on ? "var(--acc)" : "#fff",
                              borderColor: on ? "var(--acc)" : undefined,
                            }}
                          />
                          {lot.name}
                        </span>
                        <span style={{ flex: 1.2 }}>{lot.roast}</span>
                        <span style={{ flex: 1 }}>
                          <label htmlFor={`size-${lot._id}`} className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                            Size for {lot.name}
                          </label>
                          <select
                            id={`size-${lot._id}`}
                            className="select"
                            style={{ height: 26, marginTop: 0, width: "auto" }}
                            value={sel.size}
                            onChange={(e) =>
                              patch(lot._id, {
                                size: e.target.value,
                                qty: Math.max(1, sel.qty),
                              })
                            }
                          >
                            {SIZE_OPTS.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </span>
                        <span style={{ flex: 0.8 }}>
                          <span
                            className="stepper"
                            style={{
                              height: 26,
                              marginTop: 0,
                              width: 88,
                              padding: "0 6px",
                            }}
                          >
                            <button
                              type="button"
                              aria-label={`Decrease ${lot.name}`}
                              onClick={() =>
                                patch(lot._id, { qty: Math.max(0, sel.qty - 1) })
                              }
                            >
                              −
                            </button>
                            <span>{sel.qty}</span>
                            <button
                              type="button"
                              aria-label={`Increase ${lot.name}`}
                              onClick={() =>
                                patch(lot._id, { qty: sel.qty + 1 })
                              }
                            >
                              +
                            </button>
                          </span>
                        </span>
                        <span style={{ flex: 0.8 }}>
                          {money(subscribePrice(lot.price), true)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="cp" style={{ marginTop: 16 }}>
                  CADENCE MATRIX — PICK ONE PER LOT
                </div>
                <div className="b sheet">
                  <div className="sheet-head">
                    <span className="cp" style={{ flex: 2 }}>
                      LOT
                    </span>
                    {CADENCES.map((c) => (
                      <span className="cp" key={c} style={{ flex: 1 }}>
                        {c === "2 weeks" ? "2 WEEKS" : c.toUpperCase()}
                      </span>
                    ))}
                  </div>
                  {activeRows.map((lot) => {
                    const sel = getSel(lot._id);
                    return (
                      <div className="sheet-row" key={lot._id}>
                        <span style={{ flex: 2 }}>{lot.name}</span>
                        {CADENCES.map((c) => (
                          <button
                            key={c}
                            type="button"
                            className="cadence-cell"
                            style={{
                              flex: 1,
                              color: sel.cadence === c ? "var(--acc)" : undefined,
                            }}
                            onClick={() => patch(lot._id, { cadence: c })}
                            aria-label={`${lot.name} ${c}`}
                          >
                            {sel.cadence === c ? "●" : "○"}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: 9, marginTop: 14, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="bt"
                    onClick={() =>
                      setSkipNote("Next box skipped. Resume the week after.")
                    }
                  >
                    Skip a week
                  </button>
                  <button
                    type="button"
                    className="bt"
                    onClick={() => setGift((g) => !g)}
                  >
                    {gift ? "Gift on" : "Gift this plan"}
                  </button>
                  <button
                    type="button"
                    className="cp"
                    style={{
                      marginLeft: "auto",
                      alignSelf: "center",
                      background: "none",
                      border: 0,
                    }}
                    onClick={() => setStep(2)}
                  >
                    NEXT: GRIND & SIZE →
                  </button>
                </div>
                {skipNote ? (
                  <p className="msg">{skipNote}</p>
                ) : null}
                {gift ? (
                  <p className="cp" style={{ marginTop: 8 }}>
                    GIFT MODE — SHIPS TO A DIFFERENT ADDRESS IN STEP 4
                  </p>
                ) : null}
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="display" style={{ fontSize: 20 }}>
                  Grind & size
                </h1>
                <div className="cp" style={{ marginTop: 4 }}>
                  ONE GRIND FOR THE BOX · SIZES SET PER LOT
                </div>
                <label className="cp" htmlFor="box-grind" style={{ display: "block", marginTop: 14 }}>
                  GRIND
                </label>
                <select
                  id="box-grind"
                  className="select"
                  style={{ maxWidth: 240 }}
                  value={grind}
                  onChange={(e) => setGrind(e.target.value)}
                >
                  <option>Whole bean</option>
                  <option>Filter</option>
                  <option>Espresso</option>
                  <option>Ibrik / powder</option>
                </select>
                <div style={{ marginTop: 16 }}>
                  <button type="button" className="bt bp" onClick={() => setStep(3)}>
                    Next: cadence
                  </button>
                </div>
              </>
            )}

            {step >= 3 && (
              <>
                <h1 className="display" style={{ fontSize: 20 }}>
                  {STEPS[step - 1]}
                </h1>
                <p style={{ marginTop: 10, fontSize: 13.5, maxWidth: 420 }}>
                  {step === 3 &&
                    "Cadence is already set per lot in the matrix. Weekly lots ship every roast day; monthly lots ride the first Wednesday."}
                  {step === 4 &&
                    (gift
                      ? "Enter the gift recipient address. You remain the billing contact."
                      : "Ships to the trade or home address on file. Change it at checkout.")}
                  {step === 5 &&
                    `Plan saved as a wireframe. Running total ${money(running, true)} / 2 wks at 15% off retail.`}
                </p>
                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="bt"
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                  >
                    Back
                  </button>
                  {step < 5 && (
                    <button
                      type="button"
                      className="bt bp"
                      onClick={() => setStep((s) => s + 1)}
                    >
                      Next
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
