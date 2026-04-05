type ProofItem = {
  type: "quote" | "screenshot" | "bullet_list" | "founder_note";
  eyebrow?: string;
  title?: string;
  body?: string;
  quote?: string;
  attribution?: string;
  imageUrl?: string;
  imageAlt?: string;
  bullets?: string[];
};

const PROOF_ITEMS: ProofItem[] = [
  // Keep empty until Dave approves real assets.
  // Supported examples:
  // { type: "quote", quote: "We reserved because...", attribution: "Amanda, mom of 2" }
  // { type: "screenshot", title: "A real family response", imageUrl: "/proof/example.png", imageAlt: "Parent text screenshot" }
  // { type: "bullet_list", title: "Why families are reserving", bullets: ["...", "..."] }
  // { type: "founder_note", body: "Built by Dave and Amanda in Minneapolis for their own family first." }
];

function QuoteCard({ item }: { item: ProofItem }) {
  return (
    <div style={{ padding: "16px 18px", borderRadius: 12, background: "#fff", border: "1px solid var(--border)" }}>
      {item.eyebrow && <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)" }}>{item.eyebrow}</p>}
      {item.quote && <p style={{ margin: 0, fontFamily: "var(--font-playfair)", fontSize: 18, lineHeight: 1.6, color: "var(--text)", fontStyle: "italic" }}>&ldquo;{item.quote}&rdquo;</p>}
      {item.attribution && <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--text-3)" }}>{item.attribution}</p>}
    </div>
  );
}

function BulletListCard({ item }: { item: ProofItem }) {
  return (
    <div style={{ padding: "16px 18px", borderRadius: 12, background: "#fff", border: "1px solid var(--border)" }}>
      {item.eyebrow && <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)" }}>{item.eyebrow}</p>}
      {item.title && <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{item.title}</p>}
      <div style={{ display: "grid", gap: 6 }}>
        {(item.bullets ?? []).map((bullet) => (
          <div key={bullet} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", marginTop: 8, flexShrink: 0 }} />
            <span>{bullet}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FounderNoteCard({ item }: { item: ProofItem }) {
  return (
    <div style={{ padding: "16px 18px", borderRadius: 12, background: "rgba(107,143,111,0.08)", border: "1px solid rgba(107,143,111,0.18)" }}>
      <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)" }}>{item.eyebrow ?? "Founder note"}</p>
      <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>{item.body}</p>
    </div>
  );
}

function ScreenshotCard({ item }: { item: ProofItem }) {
  return (
    <div style={{ padding: "16px 18px", borderRadius: 12, background: "#fff", border: "1px solid var(--border)" }}>
      {item.eyebrow && <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--green)" }}>{item.eyebrow}</p>}
      {item.title && <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{item.title}</p>}
      {item.imageUrl ? <img src={item.imageUrl} alt={item.imageAlt ?? item.title ?? "Proof screenshot"} style={{ width: "100%", borderRadius: 10, border: "1px solid var(--border)", display: "block" }} /> : null}
      {item.body && <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>{item.body}</p>}
    </div>
  );
}

export function ReserveProofModule() {
  if (PROOF_ITEMS.length === 0) return null;

  return (
    <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
      {PROOF_ITEMS.map((item, index) => {
        if (item.type === "quote") return <QuoteCard key={index} item={item} />;
        if (item.type === "bullet_list") return <BulletListCard key={index} item={item} />;
        if (item.type === "founder_note") return <FounderNoteCard key={index} item={item} />;
        if (item.type === "screenshot") return <ScreenshotCard key={index} item={item} />;
        return null;
      })}
    </div>
  );
}
