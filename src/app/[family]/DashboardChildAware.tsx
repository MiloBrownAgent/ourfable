"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import CountUpNumber from "@/components/CountUpNumber";
import WritingBlock from "@/components/WritingBlock";
import Greeting from "@/components/Greeting";
import { useChildContext } from "@/components/ChildContext";
import { calcAge, formatAgeLong } from "@/lib/convex";
import { Music, Pen } from "lucide-react";
import ListenButton from "@/components/ListenButton";
import { useRef } from "react";

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
        body: JSON.stringify({ path: "ourfable:listVaultEntries", args: { familyId, childId, includeSealed: true } }),
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
  const writingBlockRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ opacity: loadingChild ? 0.7 : 1, transition: "opacity 200ms" }}>

      {/* ── 1. GREETING HEADER ── */}
      <div style={{
        paddingBottom: 24,
        animation: "fadeUp 0.7s var(--spring) both",
      }}>
        <Greeting />

        <h1 className="font-display" style={{
          fontWeight: 700,
          fontStyle: "normal",
          fontSize: "clamp(2rem, 6vw, 3rem)",
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

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--sage)",
          }}>
            {ageLong} ·
          </p>
          <span style={{
            fontFamily: "var(--font-body)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            color: "var(--sage)",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}>
            <CountUpNumber target={totalDays} inline fontSize={11} />
            <span style={{ textTransform: "uppercase", letterSpacing: "0.18em" }}>DAYS</span>
          </span>
        </div>

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

      {/* ── 2. WRITING BLOCK (primary action — hero position) ── */}
      <div ref={writingBlockRef} style={{
        marginBottom: 72,
        animation: "fadeUp 0.7s var(--spring) 0.1s both",
      }}>
        <WritingBlock childFirst={childFirst} familyId={familyId} />
      </div>

      {/* ── 3. VAULT ── */}
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
                  <ListenButton song={currentSnap.topSong} />
                </div>
              )}
            </div>
          </Link>
        </>
      )}

      {/* ── 9. REFERRAL CODES ── */}
      <ReferralWidget familyId={familyId} />

      <div style={{ height: 64 }} />

      {/* ── FAB — Quick capture button ── */}
      <button
        onClick={() => {
          writingBlockRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => {
            const textarea = writingBlockRef.current?.querySelector("textarea");
            if (textarea) textarea.focus();
          }, 400);
        }}
        aria-label="Write a memory"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--green)",
          border: "none",
          boxShadow: "0 4px 20px rgba(26,26,24,0.25), 0 2px 6px rgba(26,26,24,0.15)",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50,
          transition: "transform 150ms ease, box-shadow 150ms ease",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(26,26,24,0.3), 0 3px 8px rgba(26,26,24,0.2)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(26,26,24,0.25), 0 2px 6px rgba(26,26,24,0.15)";
        }}
      >
        <Pen size={22} strokeWidth={2} />
      </button>
    </div>
  );
}

function ReferralWidget({ familyId: _familyId }: { familyId: string }) {
  const [copied, setCopied] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const SHARE_URL = "https://ourfable.ai/reserve";
  const SHARE_TEXT = "Check out Our Fable — a private vault of letters and memories for your child.";

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Our Fable", text: SHARE_TEXT, url: SHARE_URL });
        return;
      } catch {
        // User cancelled or not supported — fall through
      }
    }
    setShowFallback(f => !f);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(SHARE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      }}>Share</p>
      <h3 className="font-display" style={{
        fontSize: 20, fontWeight: 400, color: "var(--text)", lineHeight: 1.3, marginBottom: 8,
      }}>
        Know someone who would love Our Fable?
      </h3>
      <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.7, marginBottom: 20 }}>
        Share it with them.
      </p>
      <button
        onClick={handleShare}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "12px 24px", borderRadius: 10,
          background: "var(--green)", color: "#fff",
          border: "none", fontSize: 14, fontWeight: 600,
          cursor: "pointer", transition: "all 150ms",
        }}
      >
        Share Our Fable →
      </button>

      {showFallback && (
        <div style={{
          marginTop: 16, padding: "16px 18px",
          background: "var(--bg)", border: "1px solid var(--border)",
          borderRadius: 12, display: "flex", flexDirection: "column", gap: 10,
          animation: "fadeIn 0.15s ease both",
        }}>
          {[
            { label: "Send via Messages", href: `sms:?&body=${encodeURIComponent(SHARE_TEXT + " " + SHARE_URL)}` },
            { label: "Send via Email", href: `mailto:?subject=${encodeURIComponent("Our Fable")}&body=${encodeURIComponent(SHARE_TEXT + "\n\n" + SHARE_URL)}` },
            { label: "Share on Twitter / X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}` },
            { label: "Share on Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}` },
          ].map(opt => (
            <a
              key={opt.label}
              href={opt.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block", padding: "10px 14px", borderRadius: 8,
                background: "var(--surface)", border: "1px solid var(--border)",
                fontSize: 13, color: "var(--text-2)", textDecoration: "none",
                transition: "all 150ms",
              }}
            >
              {opt.label}
            </a>
          ))}
          <button
            onClick={handleCopy}
            style={{
              display: "block", width: "100%", padding: "10px 14px", borderRadius: 8,
              background: copied ? "var(--green-light)" : "var(--surface)",
              border: `1px solid ${copied ? "var(--green-border)" : "var(--border)"}`,
              fontSize: 13, color: copied ? "var(--green)" : "var(--text-2)",
              cursor: "pointer", fontWeight: copied ? 600 : 400,
              transition: "all 150ms", textAlign: "left",
            }}
          >
            {copied ? "Link copied!" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}
