import { convexQuery, calcAge } from "@/lib/convex";
import { Camera, Music, Cloud, Sparkles, Newspaper } from "lucide-react";

interface Family {
  childName: string;
  childDob: string;
  familyName: string;
}

interface MonthlySnapshot {
  _id: string;
  year: number;
  month: number; // 1–12
  topHeadline?: string;
  topSong?: string;
  weatherDesc?: string;
  tempHigh?: number;
  funFact?: string;
  notes?: string;
}

export const dynamic = "force-dynamic";

function monthName(m: number): string {
  return new Date(2000, m - 1, 1).toLocaleDateString("en-US", { month: "long" });
}

function childAgeAtMonth(dob: string, year: number, month: number): string {
  const { months, days } = calcAge(dob, `${year}-${String(month).padStart(2, "0")}-01`);
  if (months === 0 && days === 0) return "Newborn";
  if (months === 0) return `${days}d`;
  return `${months}m ${days}d`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: "var(--font-inter), Inter, sans-serif",
      fontSize: 10,
      fontWeight: 600,
      textTransform: "uppercase" as const,
      letterSpacing: "0.12em",
      color: "var(--sage, var(--text-3))",
    }}>
      {children}
    </span>
  );
}

function SnapshotCard({ snap, dob }: { snap: MonthlySnapshot; dob: string }) {
  const age = childAgeAtMonth(dob, snap.year, snap.month);
  const label = `${monthName(snap.month)} ${snap.year}`;
  const hasData = snap.topHeadline || snap.topSong || snap.weatherDesc || snap.funFact;

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      {/* Timeline dot */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 6 }}>
        <div style={{
          width: 12, height: 12, borderRadius: "50%",
          background: hasData ? "var(--gold)" : "transparent",
          border: hasData ? "2px solid var(--gold)" : "2px solid var(--border)",
          flexShrink: 0,
          transition: "all 0.2s ease",
        }} />
        <div style={{ width: 1, flex: 1, background: "var(--border)", marginTop: 8 }} />
      </div>

      {/* Card */}
      <div style={{
        flex: 1,
        padding: 24,
        marginBottom: 16,
        background: "var(--surface, #fff)",
        borderRadius: 12,
        boxShadow: hasData
          ? "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)"
          : "0 1px 2px rgba(0,0,0,0.02)",
        border: "1px solid var(--border)",
        transition: "box-shadow 0.2s ease",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: hasData ? 20 : 12 }}>
          <div>
            <h2 className="font-display" style={{
              fontSize: 22, fontWeight: 700,
              color: "var(--text)", letterSpacing: "0.02em",
              lineHeight: 1.2,
            }}>
              {label}
            </h2>
            <span style={{
              display: "inline-block",
              marginTop: 6,
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase" as const,
              letterSpacing: "0.12em",
              color: "var(--sage, var(--text-3))",
              fontFamily: "var(--font-inter), Inter, sans-serif",
            }}>
              {age}
            </span>
          </div>
        </div>

        {hasData ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {snap.topHeadline && (
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0, marginTop: 3 }}>
                  <SectionLabel>Headlines</SectionLabel>
                </div>
                <p style={{
                  fontSize: 14, color: "var(--text-2)", lineHeight: 1.65,
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                }}>
                  {snap.topHeadline}
                </p>
              </div>
            )}
            {snap.topSong && (
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0, marginTop: 3 }}>
                  <SectionLabel>No. 1 Song</SectionLabel>
                </div>
                <p className="font-display" style={{
                  fontSize: 15, color: "var(--text-2)",
                  fontStyle: "italic", lineHeight: 1.5,
                }}>
                  {snap.topSong}
                </p>
              </div>
            )}
            {(snap.weatherDesc || snap.tempHigh) && (
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0, marginTop: 3 }}>
                  <SectionLabel>Weather</SectionLabel>
                </div>
                <p style={{
                  fontSize: 14, color: "var(--text-2)",
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                }}>
                  {snap.weatherDesc}{snap.tempHigh ? ` · ${snap.tempHigh}°F` : ""}
                </p>
              </div>
            )}
            {snap.funFact && (
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0, marginTop: 3 }}>
                  <SectionLabel>Fun Fact</SectionLabel>
                </div>
                <p style={{
                  fontSize: 14, color: "var(--text-2)", lineHeight: 1.65,
                  fontFamily: "var(--font-inter), Inter, sans-serif",
                }}>
                  {snap.funFact}
                </p>
              </div>
            )}
            {snap.notes && (
              <p style={{
                fontSize: 13, color: "var(--text-3)", fontStyle: "italic",
                borderTop: "1px solid var(--border)", paddingTop: 14, marginTop: 6, lineHeight: 1.75,
                fontFamily: "var(--font-inter), Inter, sans-serif",
              }}>
                {snap.notes}
              </p>
            )}
          </div>
        ) : (
          (() => {
            // Determine if this is the current month or a past month
            const now = new Date();
            const isCurrentMonth = snap.year === now.getFullYear() && snap.month === now.getMonth() + 1;
            const nextFirst = new Date(snap.year, snap.month, 1); // 1st of next month
            const readyDate = nextFirst.toLocaleDateString("en-US", { month: "long", day: "numeric" });
            return (
              <p className="font-display" style={{
                fontSize: 15, color: "var(--text-3)", fontStyle: "italic",
                lineHeight: 1.6,
              }}>
                {isCurrentMonth
                  ? `Snapshot being written — ready ${readyDate}.`
                  : "Snapshot not yet captured."}
              </p>
            );
          })()
        )}
      </div>
    </div>
  );
}

function buildMonthRange(dob: string): Array<{ year: number; month: number }> {
  const start = new Date(dob + "T00:00:00");
  const now = new Date();
  const result: Array<{ year: number; month: number }> = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur <= now) {
    result.push({ year: cur.getFullYear(), month: cur.getMonth() + 1 });
    cur.setMonth(cur.getMonth() + 1);
  }
  return result.reverse(); // newest first
}

export default async function SnapshotPage({ params }: { params: Promise<{ family: string }> }) {
  const { family: familyId } = await params;

  const family = await convexQuery<Family>("ourfable:getFamily", { familyId }).catch(() => null);

  if (!family) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <p style={{ color: "var(--text-3)", fontSize: 14 }}>Family not found.</p>
      </div>
    );
  }

  // Try to load snapshots; gracefully fall back to empty
  const snapshots = await convexQuery<MonthlySnapshot[]>("ourfable:listSnapshots", { familyId }).catch(() => [] as MonthlySnapshot[]);

  const months = buildMonthRange(family.childDob);
  const childFirst = family.childName.split(" ")[0];

  // Build a map for quick lookup
  const snapMap = new Map<string, MonthlySnapshot>();
  for (const s of snapshots ?? []) {
    snapMap.set(`${s.year}-${s.month}`, s);
  }

  // Current month for empty state
  const now = new Date();
  const currentMonthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header */}
      <div style={{ padding: "24px 0 40px" }}>
        <h1 className="font-display" style={{
          fontSize: 32, fontWeight: 700, color: "var(--green)",
          letterSpacing: "-0.01em", lineHeight: 1.2, marginBottom: 8,
        }}>
          {childFirst}&apos;s World
        </h1>
        <p style={{
          fontSize: 14, color: "var(--text-3)", lineHeight: 1.6,
          fontFamily: "var(--font-inter), Inter, sans-serif",
          maxWidth: 480,
        }}>
          A snapshot of the world, month by month, during {childFirst}&apos;s life —
          the headlines, the songs, the weather outside.
        </p>
      </div>

      {/* Timeline */}
      {months.length === 0 ? (
        <div style={{
          padding: 64, textAlign: "center",
          background: "var(--surface, #fff)",
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
          border: "1px solid var(--border)",
        }}>
          <Camera size={28} color="var(--text-3)" strokeWidth={1} style={{ margin: "0 auto 16px" }} />
          <p className="font-display" style={{ fontStyle: "italic", fontSize: 20, color: "var(--text-2)", marginBottom: 8 }}>
            Our Fable will capture {currentMonthLabel}&apos;s snapshot on the 1st.
          </p>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>Come back then.</p>
        </div>
      ) : (
        <div style={{ paddingLeft: 6 }}>
          {months.map(({ year, month }) => {
            const key = `${year}-${month}`;
            const existing = snapMap.get(key);
            const snap: MonthlySnapshot = existing ?? {
              _id: key, year, month,
            };
            return (
              <SnapshotCard key={key} snap={snap} dob={family.childDob} />
            );
          })}
          {/* Timeline end dot */}
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start", paddingBottom: 24 }}>
            <div style={{ flexShrink: 0, paddingTop: 4 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "var(--gold)", opacity: 0.4,
              }} />
            </div>
            <p className="font-display" style={{
              fontSize: 13, color: "var(--text-3)", fontStyle: "italic",
              paddingTop: 0,
            }}>
              The day {childFirst} was born.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
