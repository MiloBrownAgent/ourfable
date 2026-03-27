"use client";
import { use, useEffect, useState } from "react";
import { BookOpen, MapPin, Package, Check } from "lucide-react";

interface PrintOrder {
  _id: string;
  year: number;
  status: string;
  requestedAt: number;
  trackingNumber?: string;
  shippingAddress?: string;
}

interface Family {
  childName: string;
  childDob: string;
}

function ordinal(n: number): string {
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (s[(v-20)%10]||s[v]||s[0]);
}

function yearLabel(dob: string, year: number): { start: string; end: string } {
  const born = new Date(dob + "T12:00:00");
  const start = new Date(born.getFullYear() + year - 1, born.getMonth(), born.getDate());
  const end = new Date(born.getFullYear() + year, born.getMonth(), born.getDate());
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return { start: fmt(start), end: fmt(end) };
}

function AddressModal({ onConfirm, onClose, childName }: { onConfirm: (addr: string) => void; onClose: () => void; childName: string }) {
  const [line1, setLine1] = useState("3740 48th Ave S");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("New York");
  const [state, setState] = useState("MN");
  const [zip, setZip] = useState("55406");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const addr = [line1, line2, `${city}, ${state} ${zip}`].filter(Boolean).join(", ");
    onConfirm(addr);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="card" style={{ width: "100%", maxWidth: 400, padding: 28 }} onClick={e => e.stopPropagation()}>
        <h2 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Ship to</h2>
        <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 20 }}>Where should we mail {childName}'s book?</p>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Address line 1", value: line1, set: setLine1, placeholder: "Street address" },
            { label: "Address line 2 (optional)", value: line2, set: setLine2, placeholder: "Apt, suite, etc." },
            { label: "City", value: city, set: setCity, placeholder: "New York" },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>{f.label}</label>
              <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} className="input" />
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>State</label>
              <input value={state} onChange={e => setState(e.target.value)} placeholder="MN" className="input" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>ZIP</label>
              <input value={zip} onChange={e => setZip(e.target.value)} placeholder="55406" className="input" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 9, background: "none", border: "1px solid var(--border)", color: "var(--text-3)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button type="submit" style={{ flex: 1, padding: "10px", borderRadius: 9, background: "var(--gold-dim)", border: "1px solid var(--gold-border)", color: "var(--gold)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Reserve book
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PrintPage({ params }: { params: Promise<{ family: string }> }) {
  const { family: familyId } = use(params);
  const [family, setFamily] = useState<Family | null>(null);
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderingYear, setOrderingYear] = useState<number | null>(null);
  const [successYear, setSuccessYear] = useState<number | null>(null);

  const load = async () => {
    const [fRes, oRes] = await Promise.all([
      fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:getFamily", args: { familyId } }) }).then(r => r.json()),
      fetch(`/api/ourfable/data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "ourfable:listPrintOrders", args: { familyId } }) }).then(r => r.json()),
    ]);
    setFamily(fRes.value ?? null);
    setOrders(oRes.value ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [familyId]);

  const handleOrder = async (year: number, address: string) => {
    await fetch(`/api/ourfable/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "ourfable:requestPrintBook", args: { familyId, year, shippingAddress: address }, type: "mutation" }),
    });
    setOrderingYear(null);
    setSuccessYear(year);
    setTimeout(() => setSuccessYear(null), 3000);
    await load();
  };

  const childFirst = family?.childName.split(" ")[0] ?? "them";
  const dob = family?.childDob ?? "";

  const completedYears: number[] = [];
  if (dob) {
    const born = new Date(dob + "T00:00:00");
    const now = new Date();
    let y = 1;
    while (true) {
      const birthday = new Date(born.getFullYear() + y, born.getMonth(), born.getDate());
      if (birthday > now) break;
      completedYears.push(y);
      y++;
      if (y > 25) break;
    }
  }

  const ordersMap = new Map(orders.map(o => [o.year, o]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {orderingYear && family && (
        <AddressModal
          onConfirm={(addr) => handleOrder(orderingYear, addr)}
          onClose={() => setOrderingYear(null)}
          childName={childFirst}
        />
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 44, height: 44, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <BookOpen size={18} color="var(--gold)" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>
            {childFirst ? `${childFirst}'s Year in Print` : "Year in Print"}
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2, lineHeight: 1.5 }}>
            Every year of {childFirst}'s life, printed and mailed. Year 1 of 18.
          </p>
        </div>
      </div>

      {/* Coming soon banner */}
      <div style={{ padding: "14px 18px", background: "var(--gold-dim)", border: "1px solid var(--gold-border)", borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Package size={15} color="var(--gold)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: "var(--gold)", lineHeight: 1.65 }}>
          <strong>Print fulfillment is coming soon.</strong> Reserve your book now — we'll notify you and start production the moment it's ready. No charge until it ships.
        </p>
      </div>

      {/* Success */}
      {successYear && (
        <div style={{ padding: "14px 18px", background: "var(--sage-dim)", border: "1px solid rgba(107,143,111,0.25)", borderRadius: 10, display: "flex", gap: 10, alignItems: "center" }}>
          <Check size={15} color="var(--sage)" strokeWidth={2.5} />
          <p style={{ fontSize: 13, color: "var(--text-2)" }}>Year {successYear} reserved. We'll notify you when it's ready to ship.</p>
        </div>
      )}

      {/* Books */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1].map(i => <div key={i} className="card" style={{ padding: 32, opacity: 0.25, height: 120 }} />)}
        </div>
      ) : completedYears.length === 0 ? (
        <div className="card" style={{ padding: 56, textAlign: "center" }}>
          <BookOpen size={28} color="var(--text-3)" strokeWidth={1} style={{ margin: "0 auto 16px" }} />
          <p className="font-display" style={{ fontStyle: "italic", fontSize: 20, color: "var(--text-2)", marginBottom: 8 }}>
            {childFirst}'s first book arrives after year one.
          </p>
          <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.7 }}>
            On their first birthday, Our Fable will compile the full year — vault contributions, letters, world snapshots — into a printed book. One per year. A shelf of 18.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {completedYears.map(year => {
            const order = ordersMap.get(year);
            const { start, end } = yearLabel(dob, year);
            return (
              <div key={year} className="card" style={{ padding: "24px 28px" }}>
                {/* Cover preview */}
                <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <div style={{
                    width: 72, height: 90, borderRadius: 6, flexShrink: 0,
                    background: "linear-gradient(135deg, var(--gold-dim) 0%, var(--surface) 100%)",
                    border: "1px solid var(--gold-border)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    boxShadow: "2px 3px 8px rgba(0,0,0,0.08)",
                  }}>
                    <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 28, fontWeight: 300, color: "var(--gold)", lineHeight: 1, margin: 0 }}>{year}</p>
                    <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 7, color: "var(--gold)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 4 }}>{childFirst}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 20, fontWeight: 400, color: "var(--text)", marginBottom: 4 }}>
                      {childFirst}'s {ordinal(year)} Year
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 14 }}>{start} — {end}</p>
                    <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16, lineHeight: 1.6 }}>
                      Vault contributions · Letters · World Snapshots · Milestones
                    </p>

                    {order ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="chip chip-sage" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                          <Check size={10} strokeWidth={2.5} /> Reserved
                        </span>
                        {order.trackingNumber && (
                          <span className="chip" style={{ fontSize: 11 }}>Tracking: {order.trackingNumber}</span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setOrderingYear(year)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 9, background: "var(--gold-dim)", border: "1px solid var(--gold-border)", color: "var(--gold)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                      >
                        <MapPin size={12} strokeWidth={1.5} /> Reserve this book — $39
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
