"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import CountUpNumber from "@/components/CountUpNumber";
import WritingBlock from "@/components/WritingBlock";
import Greeting from "@/components/Greeting";
import { useChildContext } from "@/components/ChildContext";
import { calcAge, formatAgeLong } from "@/lib/convex";

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

interface Props {
  familyId: string;
  defaultChildName: string;
  defaultChildDob: string;
  defaultVaultEntries: VaultEntry[];
  defaultNotifications: Notification[];
  currentSnap?: Snapshot;
  unreadNotifs: Notification[];
}

export default function DashboardChildAware({
  familyId,
  defaultChildName,
  defaultChildDob,
  defaultVaultEntries,
  defaultNotifications,
  currentSnap,
  unreadNotifs: defaultUnread,
}: Props) {
  const { selectedChild, children } = useChildContext();

  // Child data state (for selected child when 2+ children exist)
  const [childName, setChildName] = useState(defaultChildName);
  const [childDob, setChildDob] = useState(defaultChildDob);
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>(defaultVaultEntries);
  const [unreadNotifs, setUnreadNotifs] = useState<Notification[]>(defaultUnread);
  const [loadingChild, setLoadingChild] = useState(false);

  // When selected child changes and there are 2+ children, fetch child-specific data
  useEffect(() => {
    if (children.length < 2 || !selectedChild) {
      // Single child: use defaults
      setChildName(defaultChildName);
      setChildDob(defaultChildDob);
      setVaultEntries(defaultVaultEntries);
      setUnreadNotifs(defaultUnread);
      return;
    }

    // Update name/dob immediately from context
    setChildName(selectedChild.childName);
    setChildDob(selectedChild.childDob);

    // Fetch child-specific vault & notifications
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

  const { months, days, totalDays, weeks } = calcAge(childDob);
  const childFirst = childName.split(" ")[0];
  const ageLong = formatAgeLong(months, days);

  const recentEntries = vaultEntries.slice(0, 2);
  const totalVault = vaultEntries.length;

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
      </div>

      {/* ── 2. WRITING BLOCK ── */}
      <div style={{
        marginBottom: 64,
        animation: "fadeUp 0.7s var(--spring) 0.1s both",
      }}>
        <WritingBlock childFirst={childFirst} familyId={familyId} />
      </div>

      {/* ── 3. DAYS COUNTER ── */}
      <div style={{
        textAlign: "center",
        padding: "16px 0 64px",
        animation: "fadeUp 0.7s var(--spring) 0.2s both",
      }}>
        <CountUpNumber target={totalDays} label={"days of " + childFirst} />
      </div>

      {/* ── 4. STATS ROW ── */}
      <div style={{
        textAlign: "center",
        marginBottom: 64,
        animation: "fadeUp 0.7s var(--spring) 0.25s both",
      }}>
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: 11,
          letterSpacing: "0.16em",
          color: "var(--text-3)",
        }}>
          <span>{months} month{months !== 1 ? "s" : ""}</span>
          <span style={{ color: "var(--gold)", margin: "0 10px" }}>·</span>
          <span>{weeks} week{weeks !== 1 ? "s" : ""}</span>
          <span style={{ color: "var(--gold)", margin: "0 10px" }}>·</span>
          <span>{totalDays} day{totalDays !== 1 ? "s" : ""}</span>
        </p>
      </div>

      {/* ── 5. PULL QUOTE ── */}
      <div style={{
        padding: "0 0 56px",
        textAlign: "center",
        maxWidth: 480,
        margin: "0 auto 8px",
        animation: "fadeUp 0.7s var(--spring) 0.3s both",
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

      {/* ── 6. VAULT ── */}
      <div
        style={{
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          position: "relative",
          background: "linear-gradient(160deg, #1C2B1E 0%, #142016 100%)",
          padding: "72px 24px 80px",
          animation: "fadeUp 0.7s var(--spring) 0.35s both",
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
      <div style={{ padding: "64px 0 0" }}>
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
                <p className="font-display" style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>
                  🎵 {currentSnap.topSong}
                </p>
              )}
            </div>
          </Link>
        </>
      )}

      <div style={{ height: 64 }} />
    </div>
  );
}
