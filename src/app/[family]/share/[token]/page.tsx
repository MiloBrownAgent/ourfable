"use client";
import { useState, useEffect, use } from "react";
import { Heart, Star } from "lucide-react";
import Image from "next/image";

// All Convex calls go through /api/ourfable/data proxy

interface ShareData {
  member: { name: string; relationship: string };
  family: { childName: string; childDob: string; childPhotoUrl?: string; familyName: string };
  ageMonths: number; ageDays: number;
  latestChronicle: { date: string; ageMonths: number; ageDays: number; miloNarrative: string; daycarePhotoUrl?: string } | null;
  recentMilestones: Array<{ name: string; category: string; reachedAt?: number; note?: string }>;
}

function ago(ts: number) {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d === 0) return "today"; if (d === 1) return "yesterday";
  if (d < 30) return `${d} days ago`;
  return `${Math.floor(d / 30)} month${Math.floor(d / 30) !== 1 ? "s" : ""} ago`;
}

export default function SharePage({ params }: { params: Promise<{ family: string; token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/ourfable/data`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "ourfable:getShareData", args: { shareToken: token }, format: "json" }),
    }).then(r => r.json()).then(d => { if (d.value) setData(d.value); else setNotFound(true); })
      .catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--gold)", opacity: 0.5, animation: "pulse 1.4s ease-in-out infinite" }} />
      <style>{`@keyframes pulse{0%,100%{opacity:.2}50%{opacity:.8}}`}</style>
    </div>
  );

  if (notFound || !data) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        <Heart size={28} color="var(--gold)" strokeWidth={1} style={{ margin: "0 auto 16px", opacity: 0.4 }} />
        <p className="font-display" style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>This link has expired.</p>
        <p style={{ fontSize: 12, color: "var(--text-3)" }}>Ask the family for a fresh share link.</p>
      </div>
    </div>
  );

  const { member, family, ageMonths, ageDays, latestChronicle, recentMilestones } = data;
  const childFirst = family.childName.split(" ")[0];
  const ageStr = ageMonths > 0 ? `${ageMonths}m ${ageDays}d` : `${ageDays} days`;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "40px 24px 80px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        <p className="font-display" style={{ textAlign: "center", fontSize: 16, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.15em", marginBottom: 4 }}>Our Fable</p>

        {/* Header */}
        <div className="card" style={{ padding: "36px 28px", textAlign: "center" }}>
          {family.childPhotoUrl ? (
            <Image src={family.childPhotoUrl} alt={childFirst} width={88} height={88} style={{ borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)", margin: "0 auto 20px" }} />
          ) : (
            <div style={{ width: 88, height: 88, borderRadius: "50%", background: "var(--sage-dim)", border: "1px solid rgba(107,143,111,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Heart size={28} color="var(--sage)" strokeWidth={1.5} />
            </div>
          )}
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 10 }}>
            {childFirst}&apos;s world
          </p>
          <p className="font-display" style={{ fontSize: 26, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
            Hi, {member.name.split(" ")[0]} 
          </p>
          <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16 }}>{member.relationship} to {childFirst}</p>
          <span className="chip chip-sage">{childFirst} is {ageStr} old</span>
        </div>

        {/* Latest Chronicle */}
        {latestChronicle && (
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ padding: "16px 24px 12px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 4 }}>Latest from the Chronicle</p>
              <p style={{ fontSize: 11, color: "var(--text-3)" }}>
                {new Date(latestChronicle.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
            {latestChronicle.daycarePhotoUrl && (
              <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderBottom: "1px solid var(--border)" }}>
                <Image src={latestChronicle.daycarePhotoUrl} alt="Latest photo update" fill style={{ objectFit: "cover" }} sizes="(max-width: 480px) 100vw, 480px" />
              </div>
            )}
            <div style={{ padding: "20px 24px" }}>
              <p style={{ fontFamily: "var(--font-cormorant)", fontSize: 17, fontWeight: 300, lineHeight: 1.9, color: "var(--text)" }}>
                {latestChronicle.miloNarrative}
              </p>
            </div>
          </div>
        )}

        {/* Milestones */}
        {recentMilestones.length > 0 && (
          <div className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--gold)" }}>Recent Milestones</p>
            {recentMilestones.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--gold-dim)", border: "1px solid var(--gold-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Star size={12} color="var(--gold)" strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 2 }}>{m.name}</p>
                  {m.note && <p style={{ fontSize: 12, color: "var(--text-3)", fontStyle: "italic" }}>&ldquo;{m.note}&rdquo;</p>}
                  {m.reachedAt && <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{ago(m.reachedAt)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-3)" }}>
          {childFirst}&apos;s private family page — for your eyes only.
        </p>
      </div>
    </div>
  );
}
