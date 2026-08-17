"use client";

import { useState } from "react";

export default function WholesalePage() {
  const [form, setForm] = useState({
    name: "",
    venue: "",
    volume: "5 kg / week",
    net30: true,
    note: "",
  });
  const [sent, setSent] = useState(false);

  function handleChange(event) {
    const { name, type, checked, value } = event.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <main className="page">
      <div className="shell" style={{ paddingTop: 16, paddingBottom: 36 }}>
        <div className="intro" style={{ paddingTop: 8 }}>
          <div>
            <h1>Cafés, masjids, offices</h1>
            <div className="cp" style={{ marginTop: 5 }}>
              5 KG TIERS · NET-30 · TRAINING INCLUDED
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ gap: 16, marginTop: 18, display: "grid", gridTemplateColumns: "1.1fr 0.9fr" }}>
          <form className="b" style={{ padding: 16 }} onSubmit={handleSubmit}>
            <div className="cp">ENQUIRE</div>
            {sent ? (
              <p style={{ marginTop: 12, fontSize: 13.5 }}>
                Received. A roast lead will write with 5 kg pricing and a training slot.
              </p>
            ) : (
              <>
                <div className="form-row">
                  <label className="cp" htmlFor="name">
                    NAME
                  </label>
                  <input
                    id="name"
                    name="name"
                    className="input"
                    required
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-row">
                  <label className="cp" htmlFor="venue">
                    CAFÉ / MASJID / OFFICE
                  </label>
                  <input
                    id="venue"
                    name="venue"
                    className="input"
                    required
                    value={form.venue}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-row">
                  <label className="cp" htmlFor="volume">
                    VOLUME
                  </label>
                  <select
                    id="volume"
                    name="volume"
                    className="select"
                    value={form.volume}
                    onChange={handleChange}
                  >
                    <option>5 kg / week</option>
                    <option>10 kg / week</option>
                    <option>25 kg / week</option>
                    <option>One-off tasting</option>
                  </select>
                </div>
                <label className="check-row">
                  <input
                    type="checkbox"
                    name="net30"
                    checked={form.net30}
                    onChange={handleChange}
                  />
                  Request net-30 terms
                </label>
                <div className="form-row">
                  <label className="cp" htmlFor="note">
                    NOTE
                  </label>
                  <textarea
                    id="note"
                    name="note"
                    className="input"
                    value={form.note}
                    onChange={handleChange}
                  />
                </div>
                <button type="submit" className="bt bp" style={{ marginTop: 14 }}>
                  Send enquiry
                </button>
              </>
            )}
          </form>

          <aside>
            <div className="b" style={{ padding: 16 }}>
              <div className="cp">5 KG TIER</div>
              <p style={{ marginTop: 8, fontSize: 13.5 }}>
                Bags roast Tuesday, leave Wednesday. Spec sheets on every lot. Ibrik and filter training on the first drop.
              </p>
              <div className="cp" style={{ marginTop: 14 }}>
                TIER 1 · 8% OFF
              </div>
              <div className="cp">TIER 2 · 12% OFF · NET-30</div>
              <div className="cp">TIER 3 · 16% OFF · PALLET</div>
            </div>
            <div className="b" style={{ padding: 16, marginTop: 12 }}>
              <div className="cp">INCLUDED</div>
              <p style={{ marginTop: 8, fontSize: 13.5 }}>
                Brew training, grind recommendations, and a standing 5 kg of Sana&apos;a Espresso if you want a house shot.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
