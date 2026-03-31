export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", margin: "-40px -24px", padding: "40px 24px", background: "linear-gradient(160deg, #1C2B1E 0%, #142016 100%)" }}>
      <div style={{ width: "100%", maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ width: 120, height: 16, borderRadius: 999, background: "rgba(253,251,247,0.08)" }} />
        <div style={{ height: 180, borderRadius: 22, background: "rgba(253,251,247,0.06)", border: "1px solid rgba(253,251,247,0.07)" }} />
        <div style={{ height: 260, borderRadius: 22, background: "rgba(253,251,247,0.04)", border: "1px solid rgba(253,251,247,0.07)" }} />
      </div>
    </div>
  );
}
