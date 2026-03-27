"use client";

import { use, useEffect, useState } from "react";
import { Gift, Calendar, Send, Mail, Loader2, Check, Clock } from "lucide-react";

interface Milestone {
  _id: string;
  milestoneName: string;
  milestoneDate: number;
  deliveryStatus: string;
  notificationsSent: string[];
  deliveredAt?: number;
}

interface VaultStats {
  letters: number;
  photos: number;
  voiceMemos: number;
  videos: number;
  contributors: string[];
}

async function convexFetch(path: string, args: Record<string, unknown>) {
  const res = await fetch("/api/ourfable/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.value ?? null;
}

async function convexMutate(path: string, args: Record<string, unknown>) {
  const res = await fetch("/api/ourfable/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, type: "mutation" }),
  });
  return res.ok;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function daysUntil(ts: number): number {
  return Math.ceil((ts - Date.now()) / 86400000);
}

export default function DeliveryPage({ params }: { params: Promise<{ family: string }> }) {
  const { family: familyId } = use(params);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [childEmail, setChildEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [delivering, setDelivering] = useState<string | null>(null);
  const [delivered, setDelivered] = useState<string | null>(null);
  const [childName, setChildName] = useState("");

  useEffect(() => {
    async function load() {
      const [ms, family, facData, entries, letters] = await Promise.all([
        convexFetch("ourfable:listOurFableDeliveryMilestones", { familyId }),
        convexFetch("ourfable:getOurFableFamilyById", { familyId }),
        convexFetch("ourfable:getOurFableFacilitators", { familyId }),
        convexFetch("ourfable:listOurFableVaultEntries", { familyId }),
        convexFetch("ourfable:listOurFableLetters", { familyId }),
      ]);
      setMilestones((ms as Milestone[]) ?? []);
      if (family) {
        setChildName((family as { childName: string }).childName.split(" ")[0]);
      }
      if (facData) {
        setChildEmail((facData as { childEmail?: string }).childEmail ?? "");
      }

      // Compute stats
      const allEntries = (entries as Array<{ type: string; authorName: string }>) ?? [];
      const allLetters = (letters as Array<unknown>) ?? [];
      const contributors = new Set(allEntries.map(e => e.authorName));
      setStats({
        letters: allLetters.length,
        photos: allEntries.filter(e => e.type === "photo").length,
        voiceMemos: allEntries.filter(e => e.type === "voice").length,
        videos: allEntries.filter(e => e.type === "video").length,
        contributors: Array.from(contributors),
      });

      setLoading(false);
    }
    load();
  }, [familyId]);

  async function handleDeliver(milestoneId: string) {
    if (!childEmail.trim()) return;
    setDelivering(milestoneId);

    // Create delivery token and send email via API
    const res = await fetch("/api/ourfable/deliver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ familyId, milestoneId, childEmail: childEmail.trim() }),
    });

    if (res.ok) {
      setDelivered(milestoneId);
      // Also save child email
      await convexMutate("ourfable:updateOurFableFacilitators", { familyId, childEmail: childEmail.trim() });
    }
    setDelivering(null);
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--text-3)" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Gift size={20} color="var(--green)" strokeWidth={1.5} />
          <h1 className="font-display" style={{
            fontSize: 28, fontWeight: 700,
            color: "var(--text)", letterSpacing: "0.02em",
          }}>
            Vault Delivery
          </h1>
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.65, color: "var(--text-3)" }}>
          When the time comes, deliver {childName}&apos;s vault to them. Every letter, photo, and voice memo — revealed for the first time.
        </p>
      </div>

      {/* Vault Preview Stats */}
      {stats && (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12, padding: 20, marginBottom: 24,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)", marginBottom: 12 }}>
            What&apos;s in the vault
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><span style={{ fontSize: 20, fontWeight: 600, color: "var(--green)" }}>{stats.letters}</span> <span style={{ fontSize: 12, color: "var(--text-3)" }}>letters</span></div>
            <div><span style={{ fontSize: 20, fontWeight: 600, color: "var(--green)" }}>{stats.photos}</span> <span style={{ fontSize: 12, color: "var(--text-3)" }}>photos</span></div>
            <div><span style={{ fontSize: 20, fontWeight: 600, color: "var(--green)" }}>{stats.voiceMemos}</span> <span style={{ fontSize: 12, color: "var(--text-3)" }}>voice memos</span></div>
            <div><span style={{ fontSize: 20, fontWeight: 600, color: "var(--green)" }}>{stats.videos}</span> <span style={{ fontSize: 12, color: "var(--text-3)" }}>videos</span></div>
          </div>
          {stats.contributors.length > 0 && (
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 12 }}>
              From: {stats.contributors.join(", ")}
            </p>
          )}
        </div>
      )}

      {/* Child email */}
      <div style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 12, padding: 20, marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Mail size={14} color="var(--green)" />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)" }}>
            Delivery email
          </span>
        </div>
        <input
          type="email"
          value={childEmail}
          onChange={(e) => setChildEmail(e.target.value)}
          placeholder={`${childName.toLowerCase()}@example.com`}
          style={{ width: "100%", padding: "10px 14px", fontSize: 14, border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg)", color: "var(--text)" }}
        />
        <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>
          This is where {childName}&apos;s vault delivery email will be sent.
        </p>
      </div>

      {/* Milestones */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {milestones.sort((a, b) => a.milestoneDate - b.milestoneDate).map((m) => {
          const days = daysUntil(m.milestoneDate);
          const isReady = days <= 0;
          const isDelivered = m.deliveryStatus === "delivered" || delivered === m._id;

          return (
            <div key={m._id} style={{
              background: "var(--card)", border: `1px solid ${isDelivered ? "var(--green-border)" : "var(--border)"}`,
              borderRadius: 12, padding: 20,
              opacity: isDelivered ? 0.7 : 1,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isDelivered ? (
                    <Check size={16} color="var(--green)" />
                  ) : isReady ? (
                    <Gift size={16} color="var(--green)" />
                  ) : (
                    <Clock size={16} color="var(--text-3)" />
                  )}
                  <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-cormorant)" }}>
                    {m.milestoneName.charAt(0).toUpperCase() + m.milestoneName.slice(1)}
                  </span>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: "0.05em",
                  color: isDelivered ? "var(--green)" : isReady ? "var(--gold)" : "var(--text-3)",
                  textTransform: "uppercase",
                }}>
                  {isDelivered ? "Delivered" : isReady ? "Ready" : `${days} days away`}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <Calendar size={12} color="var(--text-3)" />
                <span style={{ fontSize: 13, color: "var(--text-3)" }}>{formatDate(m.milestoneDate)}</span>
              </div>

              {isReady && !isDelivered && (
                <button
                  onClick={() => handleDeliver(m._id)}
                  disabled={!childEmail.trim() || delivering === m._id}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "10px 20px", fontSize: 13, fontWeight: 600,
                    background: "var(--green)", color: "#fff",
                    border: "none", borderRadius: 10, cursor: "pointer",
                    fontFamily: "inherit", opacity: !childEmail.trim() ? 0.5 : 1,
                  }}
                >
                  {delivering === m._id ? (
                    <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Send size={14} />
                  )}
                  {delivering === m._id ? "Delivering…" : "Deliver now"}
                </button>
              )}

              {isDelivered && m.deliveredAt && (
                <p style={{ fontSize: 12, color: "var(--green)" }}>
                  Delivered on {formatDate(m.deliveredAt)}
                </p>
              )}
            </div>
          );
        })}

        {milestones.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-3)" }}>
            <Gift size={32} strokeWidth={1} style={{ marginBottom: 12, opacity: 0.5 }} />
            <p style={{ fontSize: 14 }}>No delivery milestones set up yet.</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Milestones are automatically created based on your child&apos;s date of birth.</p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
