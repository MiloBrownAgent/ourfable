"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import CountUpNumber from "@/components/CountUpNumber";
import WritingBlock from "@/components/WritingBlock";
import Greeting from "@/components/Greeting";
import { useChildContext } from "@/components/ChildContext";
import { calcAge, formatAgeLong } from "@/lib/convex";
import { Music } from "lucide-react";

interface VaultEntry {
  _id: string;
  memberName: string;
  memberRelationship?: string;
  contentType: string;
  createdAt?: number;
  isSealed: boolean;
}

interface Snapshot {
  year: number;
  month: number;
  topHeadline?: string;
  topSong?: string;
}

interface Notification {
  _id: string;
  memberName: string;
  preview: string;
  createdAt: number;
  readAt?: number;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

function contentTypeLabel(type: string): string {
  return type === "voice" ? "Voice memo" : type === "photo" ? "Photo" : type === "video" ? "Video" : "Letter";
}

function getNextMilestone(dob: string): { age: number; date: Date; daysAway: number } | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const milestones = [13, 18, 21];
  const now = new Date();
  for (const age of milestones) {
    const milestoneDate = new Date(birth);
    milestoneDate.setFullYear(birth.getFullYear() + age);
    if (milestoneDate > now) {
      const daysAway = Math.ceil((milestoneDate.getTime() - now.getTime()) / 86400000);
      return { age, date: milestoneDate, daysAway };
    }
  }
  return null;
}

interface Props {
  familyId: string;
  defaultChildName: string;
  defaultChildDob: string;
  defaultVaultEntries: VaultEntry[];
  defaultNotifications: Notification[];
  currentSnap?: Snapshot;
  unreadNotifs: Notification[];
  circleCount?: number;
  lastDispatchAt?: number;
}

export default function DashboardChildAware({
  familyId,
  defaultChildName,
  defaultChildDob,
  defaultVaultEntries,
  defaultNotifications,
  currentSnap,
  unreadNotifs: defaultUnread,
  circleCount,
  lastDispatchAt,
}: Props) {
  const { selectedChild, children } = useChildContext();

  const [childName, setChildName] = useState(defaultChildName);
  const [childDob, setChildDob] = useState(defaultChildDob);
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>(defaultVaultEntries);
  const [unreadNotifs, setUnreadNotifs] = useState<Notification[]>(defaultUnread);
  const [loadingChild, setLoadingChild] = useState(false);

  useEffect(() => {
    if (children.length < 2 || !selectedChild) {
      setChildName(defaultChildName);
      setChildDob(defaultChildDob);
      setVaultEntries(defaultVaultEntries);
      setUnreadNotifs(defaultUnread);
      return;
    }

    setChildName(selectedChild.childName);
    setChildDob(selectedChild.childDob);
    setLoadingChild(true);
    const childId = selectedChild.childId || selectedChild._id;

    Promise.all([
      fetch("/api/ourfable/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "ourfable:listVaultEntries", args: { familyId, childId } }),
      }).then(r => r.json()).then(d => d.value ?? []),
      fetch("/api/ourfable/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "ourfable:listNotifications", args: { familyId, childId } }),
      }).then(r => r.json()).then(d => (d.value ?? []).filter((n: Notification) => !n.readAt).slice(0, 3)),
    ]).then(([vault, notifs]) => {
      setVaultEntries(vault as VaultEntry[]);
      setUnreadNotifs(notifs as Notification[]);
    }).catch(() => {}).finally(() => setLoadingChild(false));
  }, [selectedChild, children.length, familyId, defaultChildName, defaultChildDob, defaultVaultEntries, defaultUnread]);

  const { months, days, totalDays } = calcAge(childDob);
  const childFirst = childName.split(" ")[0];
  const ageLong = formatAgeLong(months, days);

  const recentEntries = vaultEntries.slice(0, 2);
  const totalVault = vaultEntries.length;

  const nextMilestone = getNextMilestone(childDob);
  const milestoneBannerVisible = nextMilestone && nextMilestone.daysAway <= 183;

  return (
    <div style={{ opacity: loadingChild ? 0.7 : 1, transition: "opacity 200ms" }}>

      {/* ── 1. GREETING HEADER ── */}
      <div style={{
        paddingBottom: 40,
        animation: "fadeUp 0.7s var(--spring) both",
      }}>
        <Greeting />

        <h1 className="font-display" style={{
          fontWeight: 700,
          fontStyle: "normal",
          fontSize: "clamp(2.5rem, 7vw, 4rem)",
          color: "var(--green)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          marginBottom: 20,
        }}>
          {childName}
        </h1>

        <div style={{
          width: 48,
          height: "0.5px",
          background: "linear-gradient(90deg, var(--gold), transparent)",
          marginBottom: 12,
        }} />

        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--sage)",
        }}>
          {ageLong}
        </p>

        {/* ── MILESTONE COUNTDOWN STRIP ── */}
        {nextMilestone && (
          <div style={{
            marginTop: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 100,
            border: "0.5px solid rgba(200,168,122,0.35)",
            background: "rgba(200,168,122,0.06)",
          }}>
            <span style={{ fontSize: 9, color: "var(--gold)", lineHeight: 1 }}>✦</span>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.1em",
              color: "var(--gold)",
            }}>
              {nextMilestone.age} years · {nextMilestone.daysAway.toLocaleString()} days away
            </p>
          </div>
        )}
      </div>

      {/* ── 2. DAYS COUNTER ── */}
      <div style={{
        textAlign: "center",
        padding: "16px 0 64px",
        animation: "fadeUp 0.7s var(--spring) 0.1s both",
      }}>
        <CountUpNumber target={totalDays} label={"days of " + childFirst} />
      </div>

      {/* ── 3. PULL QUOTE ── */}
      <div style={{
        padding: "0 0 56px",
        textAlign: "center",
        maxWidth: 480,
        margin: "0 auto 8px",
        animation: "fadeUp 0.7s var(--spring) 0.2s both",
      }}>
        <div style={{
          width: 48,
          height: "0.5px",
          background: "rgba(200,168,122,0.5)",
          margin: "0 auto 28px",
        }} />

        <p className="font-display" style={{
          fontStyle: "italic",
          fontSize: "clamp(1.1rem, 3vw, 1.45rem)",
          fontWeight: 400,
          color: "var(--green)",
          lineHeight: 1.6,
        }}>
          {totalVault > 0
            ? `The vault holds ${totalVault} sealed ${totalVault === 1 ? "memory" : "memories"}, waiting for ${childFirst}.`
            : `Every day is a page. What do you want ${childFirst} to know about today?`}
        </p>

        <div style={{
          width: 48,
          height: "0.5px",
          background: "rgba(200,168,122,0.5)",
          margin: "28px auto 24px",
        }} />

        <p style={{ fontSize: 8, letterSpacing: "0.5em", color: "var(--gold)" }}>✦ ✦ ✦</p>
      </div>

      {/* ── 4. WRITING BLOCK (primary action — moved up) ── */}
      <div style={{
        marginBottom: 72,
        animation: "fadeUp 0.7s var(--spring) 0.3s both",
      }}>
        <WritingBlock childFirst={childFirst} familyId={familyId} />
      </div>

      {/* ── 5. MILESTONE BANNER (within 6 months of a milestone) ── */}
      {milestoneBannerVisible && nextMilestone && (
        <div style={{
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          background: "linear-gradient(135deg, #C8A87A 0%, #B8944F 100%)",
          padding: "20px 24px",
          textAlign: "center",
          marginBottom: 0,
          animation: "fadeUp 0.7s var(--spring) 0.35s both",
        }}>
          <p className="font-display" style={{
            fontSize: "clamp(0.95rem, 2.5vw, 1.15rem)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "#1C2B1E",
            lineHeight: 1.5,
          }}>
            {childFirst} turns {nextMilestone.age} in {nextMilestone.daysAway} days.
            {" "}Their vault will open.
          </p>
        </div>
      )}

      {/* ── 6. VAULT ── */}
      <div
        style={{
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          position: "relative",
          background: "linear-gradient(160deg, #1C2B1E 0%, #142016 100%)",
          padding: "72px 24px 80px",
          animation: "fadeUp 0.7s var(--spring) 0.4s both",
        }}
      >
        <div style={{
          position: "absolute", bottom: -40, left: "50%",
          transform: "translateX(-50%)",
          width: "60%", height: 100, pointerEvents: "none",
          background: "radial-gradient(ellipse, rgba(200,168,122,0.09), transparent 70%)",
        }} />

        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: 11, fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--gold)",
            marginBottom: 10,
          }}>
            THE VAULT
          </p>
          <div style={{
            width: 40, height: "0.5px",
            background: "rgba(200,168,122,0.4)",
            marginBottom: 24,
          }} />

          <h2 className="font-display" style={{
            fontSize: 24, fontWeight: 400,
            color: "#FDFBF7",
            marginBottom: 32,
            lineHeight: 1.25,
          }}>
            Sealed memories for {childFirst}
          </h2>

          {recentEntries.length > 0 ? (
            <div style={{ marginBottom: 32 }}>
              {recentEntries.map((e, i) => (
                <div key={e._id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 0",
                  borderBottom: i < recentEntries.length - 1
                    ? "0.5px solid rgba(253,251,247,0.07)"
                    : "none",
                }}>
                  <div>
                    <p className="font-display" style={{
                      fontSize: 18, fontStyle: "italic",
                      color: "#FDFBF7",
                      marginBottom: 5,
                    }}>{e.memberName}</p>
                    <p style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      color: "rgba(253,251,247,0.45)",
                    }}>
                      {contentTypeLabel(e.contentType)}
                      {e.memberRelationship ? ` · ${e.memberRelationship}` : ""}
                      {e.createdAt ? ` · ${timeAgo(e.createdAt)}` : ""}
                    </p>
                  </div>
                  {e.isSealed && (
                    <span style={{
                      display: "inline-flex", alignItems: "center",
                      border: "0.5px solid rgba(200,168,122,0.45)",
                      borderRadius: 100,
                      padding: "4px 12px",
                      fontSize: 10, letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--gold)",
                      fontFamily: "var(--font-body)",
                      flexShrink: 0, marginLeft: 16,
                    }}>
                      Sealed
                    </span>
                  )}
                </div>
              ))}
              {totalVault > 2 && (
                <p style={{
                  fontSize: 12,
                  color: "rgba(253,251,247,0.3)",
                  marginTop: 14,
                }}>
                  +{totalVault - 2} more sealed
                </p>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: 36 }}>
              <p className="font-display" style={{
                fontStyle: "italic",
                fontSize: 20,
                color: "rgba(253,251,247,0.45)",
                lineHeight: 1.6,
                marginBottom: 20,
              }}>
                {childFirst}&apos;s vault is waiting for its first letter.
              </p>
              <Link href={`/${familyId}/vault/new`} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontSize: 13, fontFamily: "var(--font-body)",
                color: "var(--gold)",
                textDecoration: "none", letterSpacing: "0.06em",
                border: "0.5px solid rgba(200,168,122,0.35)",
                borderRadius: 100,
                padding: "10px 20px",
                transition: "border-color 160ms",
              }}>
                Write the first memory
              </Link>
            </div>
          )}

          <Link href={`/${familyId}/vault`} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, color: "rgba(107,143,111,0.9)",
            textDecoration: "none", letterSpacing: "0.04em",
            fontFamily: "var(--font-body)",
          }}>
            See the vault →
          </Link>

          {unreadNotifs.length > 0 && (
            <div style={{
              marginTop: 40,
              padding: "18px 20px",
              border: "0.5px solid rgba(200,168,122,0.18)",
              borderRadius: 8,
              background: "rgba(255,255,255,0.02)",
            }}>
              <p style={{
                fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(200,168,122,0.65)",
                marginBottom: 12,
              }}>
                New · {unreadNotifs.length} update{unreadNotifs.length !== 1 ? "s" : ""}
              </p>
              {unreadNotifs.map(n => (
                <div key={n._id} style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "baseline", marginBottom: 8,
                }}>
                  <p style={{ fontSize: 13, color: "rgba(253,251,247,0.65)", lineHeight: 1.6, fontFamily: "var(--font-body)" }}>
                    <strong style={{ color: "#FDFBF7" }}>{n.memberName}</strong>{" "}
                    wrote to {childFirst} —{" "}
                    <span style={{ fontStyle: "italic", color: "rgba(200,168,122,0.65)" }}>sealed</span>
                  </p>
                  <span style={{ fontSize: 11, color: "rgba(253,251,247,0.25)", flexShrink: 0, marginLeft: 16 }}>
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 7. REMAINING CARDS ── */}
      <div style={{ padding: "0 0 0" }}>
        <Link href={`/${familyId}/outgoings`} className="card-hover-luxury" style={{
          padding: "44px 32px 36px",
          borderTop: "0.5px solid var(--border)",
          borderLeft: "2px solid var(--sage)",
          animation: "fadeUp 0.6s var(--spring) 0.5s both",
        }}>
          <p style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "var(--text-3)", marginBottom: 5,
            fontFamily: "var(--font-body)",
          }}>Dispatches</p>
          <h3 className="font-display" style={{
            fontSize: 22, fontWeight: 400,
            color: "var(--text)", lineHeight: 1.25, marginBottom: 6,
          }}>Send an update</h3>
          <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.7, fontFamily: "var(--font-body)" }}>
            Share a photo, a milestone, a quiet moment — everyone in {childFirst}&apos;s circle will see it.
          </p>
          {lastDispatchAt && (
            <p style={{ fontSize: 11, color: "var(--sage)", marginTop: 10, fontFamily: "var(--font-body)" }}>
              Last dispatch {timeAgo(lastDispatchAt)}
            </p>
          )}
        </Link>

        <Link href={`/${familyId}/circle`} className="card-hover-luxury" style={{
          padding: "44px 32px 36px",
          borderTop: "0.5px solid var(--border)",
          borderLeft: "2px solid var(--sage)",
          animation: "fadeUp 0.6s var(--spring) 0.6s both",
        }}>
          <p style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "var(--text-3)", marginBottom: 5,
            fontFamily: "var(--font-body)",
          }}>People</p>
          <h3 className="font-display" style={{
            fontSize: 22, fontWeight: 400,
            color: "var(--text)", lineHeight: 1.25, marginBottom: 6,
          }}>Inner Circle</h3>
          <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6, fontFamily: "var(--font-body)" }}>
            The people who love {childFirst}. Invite grandparents, family, friends to write.
          </p>
          {circleCount !== undefined && circleCount > 0 && (
            <p style={{ fontSize: 11, color: "var(--sage)", marginTop: 10, fontFamily: "var(--font-body)" }}>
              {circleCount} {circleCount === 1 ? "person" : "people"} in {childFirst}&apos;s circle
            </p>
          )}
        </Link>
      </div>

      {/* ── 8. WORLD SNAPSHOT ── */}
      {currentSnap && (
        <>
          <div className="section-ornament">✦ ✦ ✦</div>
          <Link href={`/${familyId}/snapshot`} className="card-hover-luxury" style={{
            padding: "44px 32px 36px",
            borderTop: "2px solid var(--gold)",
            animation: "fadeUp 0.6s var(--spring) 0.7s both",
          }}>
            <div>
              <p style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.2em",
                textTransform: "uppercase", color: "var(--text-3)", marginBottom: 5,
                fontFamily: "var(--font-body)",
              }}>The World</p>
              <h3 className="font-display" style={{
                fontSize: 22, fontWeight: 400,
                color: "var(--text)", lineHeight: 1.25, marginBottom: 12,
              }}>
                {new Date(currentSnap.year, currentSnap.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h3>
              {currentSnap.topHeadline && (
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.75, marginBottom: 8, fontFamily: "var(--font-body)" }}>
                  {currentSnap.topHeadline}
                </p>
              )}
              {currentSnap.topSong && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <p className="font-display" style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <Music size={13} strokeWidth={1.5} /> {currentSnap.topSong}
                  </p>
                  <a href={`https://odesli.co/?q=${encodeURIComponent(currentSnap.topSong.replace(" — ", " "))}`} target="_blank" rel="noopener noreferrer" style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "4px 10px", borderRadius: 100,
                    border: "0.5px solid var(--border)", background: "transparent",
                    fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const,
                    color: "var(--sage)", textDecoration: "none", fontFamily: "var(--font-body)",
                    transition: "border-color 160ms, color 160ms", flexShrink: 0,
                  }}>
                    <Music size={10} strokeWidth={2} /> Listen
                  </a>
                </div>
              )}
            </div>
          </Link>
        </>
      )}

      {/* ── 9. REFERRAL CODES ── */}
      <ReferralWidget familyId={familyId} />

      <div style={{ height: 64 }} />
    </div>
  );
}

function ReferralWidget({ familyId }: { familyId: string }) {
  const [codes, setCodes] = useState<Array<{ code: string; status: string }>>([]);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ourfable/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "ourfable:listReferralCodes", args: { familyId } }),
    })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.value)) setCodes(d.value); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [familyId]);

  if (!loaded || codes.length === 0) return null;

  const available = codes.filter(c => c.status === "available");
  const redeemed = codes.filter(c => c.status === "redeemed");

  const copyCode = (code: string) => {
    const url = `https://ourfable.ai/invite/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{
      marginTop: 32, padding: "32px 28px",
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 16,
      animation: "fadeUp 0.6s var(--spring) 0.8s both",
    }}>
      <p style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.2em",
        textTransform: "uppercase", color: "var(--green)", marginBottom: 8,
      }}>Save a spot</p>
      <h3 className="font-display" style={{
        fontSize: 20, fontWeight: 400, color: "var(--text)", lineHeight: 1.3, marginBottom: 8,
      }}>
        Share Our Fable with someone you love.
      </h3>
      <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.7, marginBottom: 20 }}>
        {available.length > 0
          ? `You have ${available.length} founding member invite${available.length !== 1 ? "s" : ""} to share.`
          : "All your invites have been claimed!"}
        {redeemed.length > 0 && ` ${redeemed.length} redeemed.`}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {codes.map(c => (
          <div key={c.code} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", borderRadius: 10,
            background: c.status === "redeemed" ? "var(--green-light)" : "var(--bg)",
            border: `1px solid ${c.status === "redeemed" ? "var(--green-border)" : "var(--border)"}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                fontFamily: "monospace", fontSize: 13, fontWeight: 600,
                color: c.status === "redeemed" ? "var(--green)" : "var(--text)",
                letterSpacing: "0.06em",
              }}>
                {c.code}
              </span>
              {c.status === "redeemed" && (
                <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 500 }}>Claimed</span>
              )}
            </div>
            {c.status === "available" && (
              <button
                onClick={() => copyCode(c.code)}
                style={{
                  padding: "6px 14px", borderRadius: 8,
                  background: copied === c.code ? "var(--green)" : "var(--surface)",
                  border: `1px solid ${copied === c.code ? "var(--green)" : "var(--border)"}`,
                  color: copied === c.code ? "#fff" : "var(--text-2)",
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                  transition: "all 150ms",
                }}
              >
                {copied === c.code ? "Copied!" : "Copy link"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
