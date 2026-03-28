"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import CountUpNumber from "@/components/CountUpNumber";
import Greeting from "@/components/Greeting";
import {
  LayoutDashboard, FolderLock, Users, Menu, X, Send,
  Bell, Settings, Sunrise, BookOpen, Globe, LogOut,
  Mail, PackageOpen, Lock, FileText, Mic, Video, Music,
  Image as ImageIcon, MapPin, Check, GraduationCap,
} from "lucide-react";

// ─── Demo constants ───────────────────────────────────────────────────────────

const CHILD_NAME = "Noah Ellis";
const CHILD_FIRST = "Noah";
const CHILD_DOB = "2025-06-25";
const FAMILY_NAME = "The Ellis Family";

// Age calculation
function calcAge(dob: string) {
  const birth = new Date(dob + "T00:00:00");
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  const dayNow = now.getDate();
  const dayBirth = birth.getDate();
  let days = dayNow - dayBirth;
  if (days < 0) { months--; const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0); days += prevMonth.getDate(); }
  const totalDays = Math.floor((now.getTime() - birth.getTime()) / 86400000);
  return { months, days, totalDays };
}

function formatAgeLong(months: number, days: number): string {
  if (months === 0) return `${days} days old`;
  if (months < 12) return days > 0 ? `${months} months, ${days} days old` : `${months} months old`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} year${years !== 1 ? "s" : ""} old`;
  return `${years} year${years !== 1 ? "s" : ""}, ${rem} month${rem !== 1 ? "s" : ""} old`;
}

function getNextMilestone(dob: string) {
  const birth = new Date(dob);
  const milestones = [13, 18, 21];
  const now = new Date();
  for (const age of milestones) {
    const d = new Date(birth);
    d.setFullYear(birth.getFullYear() + age);
    if (d > now) {
      const daysAway = Math.ceil((d.getTime() - now.getTime()) / 86400000);
      return { age, daysAway };
    }
  }
  return null;
}

function monthName(m: number) {
  return new Date(2000, m - 1, 1).toLocaleDateString("en-US", { month: "long" });
}

function childAgeAtMonth(dob: string, year: number, month: number): string {
  const born = new Date(dob + "T00:00:00");
  const target = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00`);
  let months = (target.getFullYear() - born.getFullYear()) * 12 + (target.getMonth() - born.getMonth());
  if (target.getDate() < born.getDate()) months--;
  if (months <= 0) return "Newborn";
  return `${months}m`;
}

function buildMonthRange(dob: string) {
  const start = new Date(dob + "T00:00:00");
  const now = new Date();
  const result: Array<{ year: number; month: number }> = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur <= now) {
    result.push({ year: cur.getFullYear(), month: cur.getMonth() + 1 });
    cur.setMonth(cur.getMonth() + 1);
  }
  return result;
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: "var(--font-body)", fontSize: 9, fontWeight: 600,
      letterSpacing: "0.14em", textTransform: "uppercase" as const,
      color: "var(--sage)", padding: "12px 16px 6px", margin: 0,
    }}>{children}</p>
  );
}

// ─── Demo nav item ────────────────────────────────────────────────────────────
function NavItem({
  name, icon: Icon, active, onClick,
}: {
  name: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 12px", borderRadius: 6,
        fontSize: 13, fontWeight: active ? 500 : 400,
        letterSpacing: "0.01em", fontFamily: "var(--font-body)",
        textDecoration: "none", color: active ? "var(--green)" : "#9A9590",
        background: "transparent", border: "none", cursor: "pointer",
        position: "relative" as const, transition: "color 160ms ease",
        width: "100%", textAlign: "left" as const,
      }}
    >
      <Icon size={15} strokeWidth={active ? 1.8 : 1.4} />
      {name}
      {active && (
        <span style={{
          position: "absolute", bottom: 4, left: 12, right: 12,
          height: "0.5px", background: "var(--gold)", borderRadius: 1,
        }} />
      )}
    </button>
  );
}

// ─── Sidebar content ──────────────────────────────────────────────────────────
type SectionKey = "home" | "vault" | "dispatches" | "letters" | "world" | "before-born" | "circle" | "delivery";

function DemoSidebarContent({
  activeSection, onSectionChange, onClose,
}: {
  activeSection: SectionKey;
  onSectionChange: (s: SectionKey) => void;
  onClose?: () => void;
}) {
  const childNav: Array<{ name: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; key: SectionKey }> = [
    { name: "Home", icon: LayoutDashboard, key: "home" },
    { name: "The Vault", icon: FolderLock, key: "vault" },
    { name: "Dispatches", icon: Send, key: "dispatches" },
    { name: "Letters", icon: Mail, key: "letters" },
    { name: "The World", icon: Sunrise, key: "world" },
    { name: "Before You Were Born", icon: BookOpen, key: "before-born" },
  ];
  const shareNav: Array<{ name: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; key: SectionKey }> = [
    { name: "Circle", icon: Users, key: "circle" },
    { name: "Delivery", icon: PackageOpen, key: "delivery" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div style={{
        padding: "22px 20px 18px", borderBottom: "0.5px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <span style={{
            fontFamily: "var(--font-playfair)", fontSize: 20, fontWeight: 700,
            color: "var(--green)", letterSpacing: "0.02em",
          }}>Our Fable</span>
          <p style={{
            fontSize: 10, color: "var(--text-3)", letterSpacing: "0.12em",
            textTransform: "uppercase", marginTop: 3,
          }}>{FAMILY_NAME}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button style={{ position: "relative", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4 }}>
            <Bell size={15} strokeWidth={1.5} />
            <span style={{ position: "absolute", top: 1, right: 1, width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", border: "1.5px solid var(--surface)" }} />
          </button>
          {onClose && (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4 }}>
              <X size={17} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px 12px" }}>
        <SectionLabel>For Noah</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {childNav.map(item => (
            <NavItem key={item.key} name={item.name} icon={item.icon} active={activeSection === item.key}
              onClick={() => { onSectionChange(item.key); onClose?.(); }} />
          ))}
        </div>
        <SectionLabel>Share</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {shareNav.map(item => (
            <NavItem key={item.key} name={item.name} icon={item.icon} active={activeSection === item.key}
              onClick={() => { onSectionChange(item.key); onClose?.(); }} />
          ))}
        </div>
        <div style={{ borderTop: "0.5px solid var(--border)", marginTop: 16, paddingTop: 8 }}>
          <NavItem name="Settings" icon={Settings} active={false} onClick={() => {}} />
        </div>
      </nav>

      {/* Footer */}
      <div style={{ padding: "10px 10px 14px", borderTop: "0.5px solid var(--border)" }}>
        <button style={{
          display: "flex", alignItems: "center", gap: 12, padding: "11px 16px",
          borderRadius: 10, fontSize: 13, fontWeight: 400, letterSpacing: "0.01em",
          color: "#9A9590", background: "none", border: "none", cursor: "pointer", width: "100%",
        }}>
          <LogOut size={16} strokeWidth={1.4} /> Log out
        </button>
        <p style={{ fontSize: 10, color: "var(--text-4)", letterSpacing: "0.08em", padding: "4px 16px 0" }}>ourfable.ai</p>
      </div>
    </div>
  );
}

// ─── Writing Block (visual-only recreation) ───────────────────────────────────
function DemoWritingBlock({ childFirst }: { childFirst: string }) {
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div style={{
      background: "#FFFFFF", borderRadius: 12,
      boxShadow: "0 2px 24px rgba(26,26,24,0.07), 0 1px 4px rgba(26,26,24,0.04)",
      overflow: "hidden", position: "relative",
    }}>
      {/* top accent bar */}
      <div style={{
        height: 3,
        background: focused
          ? "linear-gradient(90deg, var(--green) 0%, var(--sage) 50%, var(--gold) 100%)"
          : "linear-gradient(90deg, rgba(74,94,76,0.4) 0%, rgba(107,143,111,0.3) 50%, rgba(200,168,122,0.35) 100%)",
        transition: "background 300ms ease",
      }} />
      <div style={{ padding: "20px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontFamily: "var(--font-playfair)", fontStyle: "italic", fontSize: 20, fontWeight: 400, color: "var(--green)" }}>
            Dear {childFirst},
          </span>
          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--sage)", letterSpacing: "0.04em" }}>
            {today}
          </span>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Something happened today I want you to know about…"
          rows={6}
          style={{
            width: "100%", border: "none", outline: "none", resize: "none",
            fontFamily: "var(--font-body)", fontSize: 15, lineHeight: 1.85,
            color: "var(--text)", background: "transparent", padding: 0,
            caretColor: "var(--sage)",
          }}
        />
      </div>
      {/* Attachment strip */}
      <div style={{ display: "flex", gap: 8, padding: "12px 24px", borderTop: "0.5px solid var(--border)" }}>
        {[
          { label: "Voice", icon: "mic" },
          { label: "Photo", icon: "camera" },
          { label: "Video", icon: "video" },
        ].map(btn => (
          <button key={btn.label} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 12px", borderRadius: 100,
            border: "1px solid var(--border)", background: "transparent",
            fontFamily: "var(--font-body)", fontSize: 11, color: "var(--text-3)",
            cursor: "pointer", letterSpacing: "0.02em",
          }}>
            {btn.icon === "mic" ? <Mic size={13} strokeWidth={1.5} /> : btn.icon === "camera" ? <ImageIcon size={13} strokeWidth={1.5} /> : <Video size={13} strokeWidth={1.5} />}
            {btn.label}
          </button>
        ))}
      </div>
      {/* Footer */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 24px", borderTop: "0.5px solid var(--border)", background: "var(--bg)",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center",
          border: "1px solid var(--border)", borderRadius: 100, overflow: "hidden",
        }}>
          <button style={{
            padding: "6px 14px", border: "none", background: "var(--green)", color: "#fff",
            fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
          }}>Seal</button>
          <button style={{
            padding: "6px 14px", border: "none", background: "transparent", color: "var(--text-3)",
            fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: "0.06em",
            textTransform: "uppercase", cursor: "pointer",
          }}>Dispatch</button>
        </div>
        <button className="btn-primary" style={{ padding: "8px 20px", fontSize: 13 }}>
          Seal letter
        </button>
      </div>
    </div>
  );
}

// ─── HOME / DASHBOARD SECTION ─────────────────────────────────────────────────
function HomeSection({ onNavigate }: { onNavigate?: (s: SectionKey) => void }) {
  const { months, days, totalDays } = calcAge(CHILD_DOB);
  const ageLong = formatAgeLong(months, days);
  const nextMilestone = getNextMilestone(CHILD_DOB);
  const totalVault = 47;

  const vaultEntries = [
    { id: "1", memberName: "Grandma", memberRelationship: "Grandmother", contentType: "Letter", isSealed: true },
    { id: "2", memberName: "Grandpa", memberRelationship: "Grandfather", contentType: "Voice memo", isSealed: true },
  ];

  return (
    <div>
      {/* 1. GREETING HEADER */}
      <div style={{ paddingBottom: 40, animation: "fadeUp 0.7s var(--spring) both" }}>
        <Greeting />
        <h1 className="font-display" style={{
          fontWeight: 700, fontStyle: "normal",
          fontSize: "clamp(2.5rem, 7vw, 4rem)",
          color: "var(--green)", letterSpacing: "-0.02em",
          lineHeight: 1, marginBottom: 20,
        }}>{CHILD_NAME}</h1>
        <div style={{ width: 48, height: "0.5px", background: "linear-gradient(90deg, var(--gold), transparent)", marginBottom: 12 }} />
        <p style={{
          fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600,
          letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--sage)",
        }}>{ageLong}</p>
        {nextMilestone && (
          <div style={{
            marginTop: 14, display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 100,
            border: "0.5px solid rgba(200,168,122,0.35)", background: "rgba(200,168,122,0.06)",
          }}>
            <span style={{ fontSize: 9, color: "var(--gold)", lineHeight: 1 }}>✦</span>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 500,
              letterSpacing: "0.1em", color: "var(--gold)",
            }}>
              {nextMilestone.age} years · {nextMilestone.daysAway.toLocaleString()} days away
            </p>
          </div>
        )}
      </div>

      {/* 2. DAYS COUNTER */}
      <div style={{ textAlign: "center", padding: "16px 0 64px", animation: "fadeUp 0.7s var(--spring) 0.1s both" }}>
        <CountUpNumber target={totalDays} label={"days of " + CHILD_FIRST} />
      </div>

      {/* 3. PULL QUOTE */}
      <div style={{
        padding: "0 0 56px", textAlign: "center",
        maxWidth: 480, margin: "0 auto 8px",
        animation: "fadeUp 0.7s var(--spring) 0.2s both",
      }}>
        <div style={{ width: 48, height: "0.5px", background: "rgba(200,168,122,0.5)", margin: "0 auto 28px" }} />
        <p className="font-display" style={{
          fontStyle: "italic", fontSize: "clamp(1.1rem, 3vw, 1.45rem)",
          fontWeight: 400, color: "var(--green)", lineHeight: 1.6,
        }}>
          The vault holds {totalVault} sealed memories, waiting for {CHILD_FIRST}.
        </p>
        <div style={{ width: 48, height: "0.5px", background: "rgba(200,168,122,0.5)", margin: "28px auto 24px" }} />
        <p style={{ fontSize: 8, letterSpacing: "0.5em", color: "var(--gold)" }}>✦ ✦ ✦</p>
      </div>

      {/* 4. WRITING BLOCK */}
      <div style={{ marginBottom: 72, animation: "fadeUp 0.7s var(--spring) 0.3s both" }}>
        <DemoWritingBlock childFirst={CHILD_FIRST} />
      </div>

      {/* 5. VAULT — dark section */}
      <div style={{
        width: "100vw", marginLeft: "calc(-50vw + 50%)",
        position: "relative",
        background: "linear-gradient(160deg, #1C2B1E 0%, #142016 100%)",
        padding: "72px 24px 80px",
        animation: "fadeUp 0.7s var(--spring) 0.4s both",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--gold)", marginBottom: 10,
          }}>THE VAULT</p>
          <div style={{ width: 40, height: "0.5px", background: "rgba(200,168,122,0.4)", marginBottom: 24 }} />
          <h2 className="font-display" style={{
            fontSize: 24, fontWeight: 400, color: "#FDFBF7", marginBottom: 32, lineHeight: 1.25,
          }}>Sealed memories for {CHILD_FIRST}</h2>

          <div style={{ marginBottom: 32 }}>
            {vaultEntries.map((e, i) => (
              <div key={e.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 0",
                borderBottom: i < vaultEntries.length - 1 ? "0.5px solid rgba(253,251,247,0.07)" : "none",
              }}>
                <div>
                  <p className="font-display" style={{
                    fontSize: 18, fontStyle: "italic", color: "#FDFBF7", marginBottom: 5,
                  }}>{e.memberName}</p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(253,251,247,0.45)" }}>
                    {e.contentType} · {e.memberRelationship}
                  </p>
                </div>
                {e.isSealed && (
                  <span style={{
                    display: "inline-flex", alignItems: "center",
                    border: "0.5px solid rgba(200,168,122,0.45)", borderRadius: 100,
                    padding: "4px 12px", fontSize: 10, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "var(--gold)",
                    fontFamily: "var(--font-body)", flexShrink: 0, marginLeft: 16,
                  }}>Sealed</span>
                )}
              </div>
            ))}
            <p style={{ fontSize: 12, color: "rgba(253,251,247,0.3)", marginTop: 14 }}>
              +{totalVault - 2} more sealed
            </p>
          </div>

          <button onClick={() => {}} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, color: "rgba(107,143,111,0.9)",
            textDecoration: "none", letterSpacing: "0.04em",
            fontFamily: "var(--font-body)", background: "none", border: "none", cursor: "pointer",
          }}>
            See the vault →
          </button>
        </div>
      </div>

      {/* 6. CARDS */}
      <div style={{ padding: "0 0 0" }}>
        {/* Dispatches */}
        <div className="card-hover-luxury" onClick={() => onNavigate?.("dispatches")} style={{
          padding: "44px 32px 36px", borderTop: "0.5px solid var(--border)",
          borderLeft: "2px solid var(--sage)", cursor: "pointer",
          animation: "fadeUp 0.6s var(--spring) 0.5s both",
        }}>
          <p style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--text-3)", marginBottom: 5, fontFamily: "var(--font-body)",
          }}>Dispatches</p>
          <h3 className="font-display" style={{
            fontSize: 22, fontWeight: 400, color: "var(--text)", lineHeight: 1.25, marginBottom: 6,
          }}>Send an update</h3>
          <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.7, fontFamily: "var(--font-body)" }}>
            Share a photo, a milestone, a quiet moment — everyone in {CHILD_FIRST}&apos;s circle will see it.
          </p>
          <p style={{ fontSize: 11, color: "var(--sage)", marginTop: 10, fontFamily: "var(--font-body)" }}>
            Last dispatch 3 days ago
          </p>
        </div>

        {/* Circle */}
        <div className="card-hover-luxury" onClick={() => onNavigate?.("circle")} style={{
          padding: "44px 32px 36px", borderTop: "0.5px solid var(--border)",
          borderLeft: "2px solid var(--sage)", cursor: "pointer",
          animation: "fadeUp 0.6s var(--spring) 0.6s both",
        }}>
          <p style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--text-3)", marginBottom: 5, fontFamily: "var(--font-body)",
          }}>People</p>
          <h3 className="font-display" style={{
            fontSize: 22, fontWeight: 400, color: "var(--text)", lineHeight: 1.25, marginBottom: 6,
          }}>Inner Circle</h3>
          <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6, fontFamily: "var(--font-body)" }}>
            The people who love {CHILD_FIRST}. Invite grandparents, family, friends to write.
          </p>
          <p style={{ fontSize: 11, color: "var(--sage)", marginTop: 10, fontFamily: "var(--font-body)" }}>
            8 people in {CHILD_FIRST}&apos;s circle
          </p>
        </div>
      </div>

      {/* 7. WORLD SNAPSHOT */}
      <div style={{ marginBottom: 4 }}>
        <p style={{ textAlign: "center", padding: "32px 0 8px", fontSize: 8, letterSpacing: "0.5em", color: "var(--gold)" }}>✦ ✦ ✦</p>
        <div className="card-hover-luxury" onClick={() => onNavigate?.("world")} style={{
          padding: "44px 32px 36px", borderTop: "2px solid var(--gold)", cursor: "pointer",
          animation: "fadeUp 0.6s var(--spring) 0.7s both",
        }}>
          <p style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--text-3)", marginBottom: 5, fontFamily: "var(--font-body)",
          }}>The World</p>
          <h3 className="font-display" style={{
            fontSize: 22, fontWeight: 400, color: "var(--text)", lineHeight: 1.25, marginBottom: 12,
          }}>March 2026</h3>
          <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.75, marginBottom: 8, fontFamily: "var(--font-body)" }}>
            Spring is arriving early across the Pacific Northwest — cherry blossoms two weeks ahead of schedule.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <p className="font-display" style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic" }}>
              <Music size={13} strokeWidth={1.5} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} />
              Choosin&apos; Texas — Ella Langley
            </p>
            <a href="https://odesli.co/?q=Choosin%20Texas%20Ella%20Langley" target="_blank" rel="noopener noreferrer" style={{
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
        </div>
      </div>

      <div style={{ height: 64 }} />
    </div>
  );
}

// ─── VAULT SECTION ────────────────────────────────────────────────────────────
function VaultSection() {
  const vaultEntries = [
    { id: "1", memberName: "Grandma", memberRelationship: "Grandmother", contentType: "text" as const, isSealed: true, unlockAge: 13 },
    { id: "2", memberName: "Grandpa", memberRelationship: "Grandfather", contentType: "voice" as const, isSealed: true, unlockAge: 13 },
    { id: "3", memberName: "Auntie", memberRelationship: "Aunt", contentType: "photo" as const, isSealed: true, unlockAge: 18 },
    { id: "4", memberName: "Uncle", memberRelationship: "Uncle", contentType: "video" as const, isSealed: true, unlockAge: 13 },
    { id: "5", memberName: "Godmother", memberRelationship: "Godparent", contentType: "text" as const, isSealed: true, unlockAge: 18 },
    { id: "6", memberName: "Nana", memberRelationship: "Grandmother", contentType: "voice" as const, isSealed: true, unlockAge: 13 },
    { id: "7", memberName: "Dad", memberRelationship: "Father", contentType: "text" as const, isSealed: false },
    { id: "8", memberName: "Mom", memberRelationship: "Mother", contentType: "photo" as const, isSealed: false },
  ];

  const TYPE_ICONS: Record<string, React.ReactNode> = {
    text: <FileText size={12} strokeWidth={1.5} />,
    photo: <ImageIcon size={12} strokeWidth={1.5} />,
    voice: <Mic size={12} strokeWidth={1.5} />,
    video: <Video size={12} strokeWidth={1.5} />,
  };

  const TYPE_LABELS: Record<string, string> = {
    text: "Letter", photo: "Photo", voice: "Voice memo", video: "Video",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "var(--gold-dim)", border: "1px solid var(--gold-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <FolderLock size={18} color="var(--gold)" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>
            {CHILD_FIRST}&apos;s Vault
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-3)" }}>47 sealed memories</p>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {["All", "Letters", "Voice memos", "Photos", "Videos"].map((f, i) => (
          <button key={f} style={{
            padding: "6px 14px", borderRadius: 100, fontSize: 11,
            border: i === 0 ? "1.5px solid var(--green)" : "1px solid var(--border)",
            background: i === 0 ? "var(--green-light)" : "transparent",
            color: i === 0 ? "var(--green)" : "var(--text-3)",
            fontFamily: "var(--font-body)", cursor: "pointer", fontWeight: i === 0 ? 600 : 400,
          }}>{f}</button>
        ))}
      </div>

      {/* Entries */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {vaultEntries.map(entry => (
          <div key={entry.id} className="card" style={{
            padding: 24,
            borderLeft: entry.isSealed ? "3px solid var(--gold-border)" : "3px solid rgba(107,143,111,0.3)",
            opacity: entry.isSealed ? 0.85 : 1,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: entry.isSealed ? "var(--gold-dim)" : "var(--sage-dim)",
                border: `1px solid ${entry.isSealed ? "var(--gold-border)" : "rgba(107,143,111,0.2)"}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Lock size={16} color={entry.isSealed ? "var(--gold)" : "var(--sage)"} strokeWidth={1.5} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <p style={{ fontFamily: "var(--font-playfair)", fontSize: 17, fontWeight: 400, color: "var(--text)" }}>
                    {entry.memberName}
                  </p>
                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>· {entry.memberRelationship}</span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  {entry.isSealed && (
                    <span className="chip chip-gold" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
                      <Lock size={9} strokeWidth={2} /> Sealed
                    </span>
                  )}
                  <span className="chip" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
                    {TYPE_ICONS[entry.contentType]}
                    {TYPE_LABELS[entry.contentType]}
                  </span>
                  {entry.unlockAge && (
                    <span className="chip" style={{ fontSize: 10 }}>
                      Opens at {entry.unlockAge}
                    </span>
                  )}
                </div>
              </div>
              {entry.isSealed && (
                <button style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "7px 14px", fontSize: 11,
                  color: "var(--text-3)", cursor: "pointer", flexShrink: 0,
                  whiteSpace: "nowrap",
                }}>Unlock early</button>
              )}
            </div>
          </div>
        ))}
        {/* Show more */}
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <p style={{ fontSize: 13, color: "var(--text-3)", fontStyle: "italic", fontFamily: "var(--font-playfair)" }}>
            +39 more sealed entries
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── THE WORLD SECTION ────────────────────────────────────────────────────────
function WorldSection() {
  const dob = new Date(CHILD_DOB + "T12:00:00");
  const fullDate = dob.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const months = buildMonthRange(CHILD_DOB);

  // Demo snapshot data
  const snapshots: Record<string, { topHeadline: string; topSong: string; weatherDesc: string; tempHigh: number }> = {
    "2025-6": {
      topHeadline: "The longest days of the year — summer solstice light, backyard sprinklers, the sound of ice cream trucks",
      topSong: "luther — Kendrick Lamar & SZA",
      weatherDesc: "Warm and golden, the kind of June evening that lasts forever",
      tempHigh: 82,
    },
    "2025-7": {
      topHeadline: "Summer is here — long days, fireflies, and the whole country moving a little slower",
      topSong: "luther — Kendrick Lamar & SZA",
      weatherDesc: "Hot and humid, thunderstorms rolling through late afternoons",
      tempHigh: 92,
    },
    "2025-8": {
      topHeadline: "Back-to-school season — yellow buses rolling again, the smell of new notebooks, summer fading",
      topSong: "Ordinary — Alex Warren",
      weatherDesc: "Warm with occasional showers, humidity finally dropping",
      tempHigh: 88,
    },
    "2025-9": {
      topHeadline: "The leaves are turning — fall foliage peaks a week early, apple orchards opening everywhere",
      topSong: "Ordinary — Alex Warren",
      weatherDesc: "Mild autumn conditions, crisp mornings and warm afternoons",
      tempHigh: 72,
    },
    "2025-10": {
      topHeadline: "Pumpkin patches and costume prep — the whole country gearing up for Halloween",
      topSong: "Golden — Huntrix",
      weatherDesc: "Cool and crisp, fall colors at their peak",
      tempHigh: 58,
    },
    "2025-11": {
      topHeadline: "The holidays arrive early — families gathering, the first big snow blanketing the northern states",
      topSong: "The Fate of Ophelia — Taylor Swift",
      weatherDesc: "First snowfall of the season, temperatures dropping sharply",
      tempHigh: 38,
    },
    "2025-12": {
      topHeadline: "The year comes to a close — a season of lights, family gatherings, and looking ahead",
      topSong: "All I Want for Christmas Is You — Mariah Carey",
      weatherDesc: "Cold and snowy, perfect for staying in by the fire",
      tempHigh: 22,
    },
    "2026-1": {
      topHeadline: "A new year begins — resolutions, fresh starts, and the quiet hope that comes with turning the calendar",
      topSong: "I Just Might — Bruno Mars",
      weatherDesc: "Bitter cold, the kind of January that makes you grateful for warm coats",
      tempHigh: 12,
    },
    "2026-2": {
      topHeadline: "Valentine's month — love songs everywhere, the Super Bowl bringing everyone together for one night",
      topSong: "Choosin' Texas — Ella Langley",
      weatherDesc: "Heavy snow and ice, but the days are getting noticeably longer",
      tempHigh: 18,
    },
    "2026-3": {
      topHeadline: "Spring is arriving early — cherry blossoms ahead of schedule, everyone stepping outside again",
      topSong: "Choosin' Texas — Ella Langley",
      weatherDesc: "Early spring thaw, the first warm days hinting at what's coming",
      tempHigh: 42,
    },
  };

  function GoldDivider() {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "0 auto", maxWidth: 200 }}>
        <div style={{ flex: 1, height: 1, background: "var(--gold-border)" }} />
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--gold)", opacity: 0.5 }} />
        <div style={{ flex: 1, height: 1, background: "var(--gold-border)" }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Hero */}
      <section style={{ textAlign: "center", paddingTop: 60, paddingBottom: 80 }}>
        <p style={{
          fontSize: 10, fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase",
          color: "var(--sage)", marginBottom: 32,
        }}>The World, Then &amp; Now</p>
        <h1 className="font-display" style={{
          fontSize: "clamp(2.4rem, 7vw, 4.2rem)", fontWeight: 700,
          color: "var(--green)", lineHeight: 1.1, marginBottom: 32, letterSpacing: "-0.01em",
        }}>{fullDate}</h1>
        <GoldDivider />
        <p className="font-display" style={{
          fontSize: "clamp(3rem, 10vw, 6.5rem)", fontWeight: 700,
          color: "var(--gold)", lineHeight: 1.0, marginTop: 40, letterSpacing: "-0.02em",
        }}>{CHILD_NAME}</p>
        <p style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-3)", marginTop: 16 }}>arrived</p>
      </section>

      {/* Birth weather */}
      <section style={{ paddingTop: 64, paddingBottom: 64, borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--sage)", marginBottom: 28 }}>The Weather</p>
        <p className="font-display" style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 700, color: "var(--text)", lineHeight: 1.35, marginBottom: 24 }}>
          It was 81° and partly cloudy
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.75, color: "var(--text-2)", maxWidth: 560 }}>
          A warm June day in Portland. The summer solstice just days away. Noah arrived at 6:47am to a golden morning sky.
        </p>
      </section>

      {/* Birth song */}
      <section style={{ paddingTop: 64, paddingBottom: 64, borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--sage)", marginBottom: 28 }}>#1 Song in America</p>
        <p className="font-display" style={{ fontSize: "clamp(1.4rem, 3.5vw, 2rem)", fontWeight: 700, fontStyle: "italic", color: "var(--text)", lineHeight: 1.4 }}>
          The #1 song was &ldquo;Not Like Us&rdquo;
          <br />
          <span style={{ fontStyle: "normal", fontWeight: 400, color: "var(--text-2)" }}>by Kendrick Lamar</span>
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--text-3)", marginTop: 20, maxWidth: 480 }}>
          It debuted at #1 on the Billboard Hot 100 the week they arrived.
        </p>
      </section>

      {/* Headline */}
      <section style={{ paddingTop: 64, paddingBottom: 64, borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--sage)", marginBottom: 40 }}>The World That Day</p>
        <div style={{ padding: "40px 0", margin: "0 0 40px 0" }}>
          <div style={{ height: 2, background: "var(--gold)", marginBottom: 32, maxWidth: 80 }} />
          <p className="font-display" style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)", fontWeight: 700, fontStyle: "italic", color: "var(--text)", lineHeight: 1.45, maxWidth: 560 }}>
            &ldquo;The summer solstice arrived — the longest, sunniest day of the year&rdquo;
          </p>
          <div style={{ height: 2, background: "var(--gold)", marginTop: 32, maxWidth: 80 }} />
        </div>
      </section>

      {/* Monthly Timeline */}
      <section style={{ paddingTop: 80, paddingBottom: 64, borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--sage)", marginBottom: 28 }}>Month by Month</p>
        <h2 className="font-display" style={{ fontSize: "clamp(1.4rem, 3.5vw, 2rem)", fontWeight: 700, color: "var(--text)", marginBottom: 12, letterSpacing: "-0.01em" }}>
          {CHILD_FIRST}&apos;s World
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.65, marginBottom: 40, maxWidth: 480 }}>
          A snapshot of the world, month by month — the headlines, the songs, the weather outside.
        </p>

        <div style={{ paddingLeft: 6 }}>
          {months.map(({ year, month }) => {
            const key = `${year}-${month}`;
            const snap = snapshots[key];
            const label = `${monthName(month)} ${year}`;
            const age = childAgeAtMonth(CHILD_DOB, year, month);

            return (
              <div key={key} style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 6 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%",
                    background: snap ? "var(--gold)" : "transparent",
                    border: snap ? "2px solid var(--gold)" : "2px solid var(--border)",
                    flexShrink: 0,
                  }} />
                  <div style={{ width: 1, flex: 1, background: "var(--border)", marginTop: 8 }} />
                </div>
                <div style={{
                  flex: 1, padding: 24, marginBottom: 16,
                  background: "var(--surface, #fff)", borderRadius: 12,
                  boxShadow: snap ? "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)" : "0 1px 2px rgba(0,0,0,0.02)",
                  border: "1px solid var(--border)",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: snap ? 20 : 12 }}>
                    <div>
                      <h3 className="font-display" style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "0.02em", lineHeight: 1.2 }}>
                        {label}
                      </h3>
                      <span style={{ display: "inline-block", marginTop: 6, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--sage)" }}>
                        {age}
                      </span>
                    </div>
                  </div>
                  {snap ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--sage)", flexShrink: 0, minWidth: 68, marginTop: 3 }}>Headlines</span>
                        <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.65 }}>{snap.topHeadline}</p>
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--sage)", flexShrink: 0, minWidth: 68, marginTop: 3 }}>No. 1 Song</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <p className="font-display" style={{ fontSize: 15, color: "var(--text-2)", fontStyle: "italic", lineHeight: 1.5 }}>{snap.topSong}</p>
                          <a href={`https://odesli.co/?q=${encodeURIComponent(snap.topSong.replace(" — ", " "))}`} target="_blank" rel="noopener noreferrer" style={{
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
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--sage)", flexShrink: 0, minWidth: 68, marginTop: 3 }}>Weather</span>
                        <p style={{ fontSize: 14, color: "var(--text-2)" }}>{snap.weatherDesc} · {snap.tempHigh}°F</p>
                      </div>
                    </div>
                  ) : (
                    <p className="font-display" style={{ fontSize: 15, color: "var(--text-3)", fontStyle: "italic", lineHeight: 1.6 }}>
                      Snapshot not yet captured.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <div style={{ textAlign: "center", paddingBottom: 80, paddingTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <div style={{ width: 40, height: 1, background: "var(--gold-border)" }} />
          <span className="font-display" style={{ fontSize: 13, color: "var(--gold)", letterSpacing: "0.18em", fontWeight: 700, textTransform: "uppercase" }}>Our Fable</span>
          <div style={{ width: 40, height: 1, background: "var(--gold-border)" }} />
        </div>
      </div>
    </div>
  );
}

// ─── CIRCLE SECTION ───────────────────────────────────────────────────────────
function CircleSection() {
  const members = [
    { id: "1", name: "Grandma", relationship: "Grandmother", city: "Phoenix, AZ", contributions: 8, active: true },
    { id: "2", name: "Grandpa", relationship: "Grandfather", city: "Phoenix, AZ", contributions: 5, active: true },
    { id: "3", name: "Nana", relationship: "Grandmother", city: "Chicago, IL", contributions: 3, active: true },
    { id: "4", name: "Papa", relationship: "Grandfather", city: "Chicago, IL", contributions: 2, active: false },
    { id: "5", name: "Auntie", relationship: "Aunt", city: "Seattle, WA", contributions: 6, active: true },
    { id: "6", name: "Uncle", relationship: "Uncle", city: "Denver, CO", contributions: 4, active: true },
    { id: "7", name: "Godmother", relationship: "Godparent", city: "Portland, OR", contributions: 7, active: true },
    { id: "8", name: "Family Friend", relationship: "Family friend", city: "Portland, OR", contributions: 1, active: false },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={18} color="var(--sage)" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>
              {CHILD_FIRST}&apos;s Circle
            </h1>
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>8 people who love {CHILD_FIRST}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {members.map(m => {
          const initials = m.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
          return (
            <div key={m.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "var(--sage-dim)", border: "1px solid rgba(107,143,111,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--sage)" }}>{initials}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 400, color: "var(--text)", marginBottom: 4 }}>{m.name}</p>
                  <span className="chip chip-gold" style={{ fontSize: 10 }}>{m.relationship}</span>
                </div>
                {m.active && <span className="chip chip-sage" style={{ fontSize: 10, flexShrink: 0 }}>Active</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontSize: 11, color: "var(--text-3)" }}>
                <MapPin size={11} strokeWidth={1.5} /> {m.city}
              </div>
              {m.contributions > 0 && (
                <p style={{ fontSize: 11, color: "var(--text-3)" }}>{m.contributions} contribution{m.contributions !== 1 ? "s" : ""}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DISPATCHES SECTION ───────────────────────────────────────────────────────
function DispatchesSection() {
  const dispatches = [
    { id: "1", title: "First Steps!", preview: "Noah took his very first steps today at 9 months and 3 days old. Shaky but determined.", date: "March 25, 2026", recipients: 8 },
    { id: "2", title: "Smiling at everything", preview: "The biggest smile we've ever seen. He laughed for the first time this morning.", date: "February 14, 2026", recipients: 6 },
    { id: "3", title: "Month 8 update", preview: "Eight months in. Growing so fast. Here's what this month looked like.", date: "February 25, 2026", recipients: 8 },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Send size={18} color="var(--sage)" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>Dispatches</h1>
          <p style={{ fontSize: 12, color: "var(--text-3)" }}>Updates sent to {CHILD_FIRST}&apos;s circle</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {dispatches.map(d => (
          <div key={d.id} className="card card-hover-luxury" style={{ padding: 24, cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
              <h3 className="font-display" style={{ fontSize: 20, fontWeight: 400, color: "var(--text)" }}>{d.title}</h3>
              <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0, marginLeft: 16 }}>{d.date}</span>
            </div>
            <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 12 }}>{d.preview}</p>
            <p style={{ fontSize: 11, color: "var(--sage)" }}>Sent to {d.recipients} people</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LETTERS SECTION ──────────────────────────────────────────────────────────
function LettersSection() {
  const letters = [
    { id: "1", from: "Mom", date: "March 20, 2026", preview: "Dear Noah, today you did something that made me laugh until I cried…", sealed: false },
    { id: "2", from: "Dad", date: "March 15, 2026", preview: "Something I want you to know about the day the world was…", sealed: true },
    { id: "3", from: "Grandma", date: "February 28, 2026", preview: "My darling Noah, your grandfather and I were talking about you…", sealed: true },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Mail size={18} color="var(--sage)" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>Letters</h1>
          <p style={{ fontSize: 12, color: "var(--text-3)" }}>Written for {CHILD_FIRST}</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {letters.map(l => (
          <div key={l.id} className="card card-hover-luxury" style={{ padding: 24, cursor: "pointer", borderLeft: "3px solid rgba(107,143,111,0.3)" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
              <p className="font-display" style={{ fontSize: 18, fontStyle: "italic", color: "var(--green)" }}>Dear {CHILD_FIRST},</p>
              <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0, marginLeft: 16 }}>{l.date}</span>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8 }}>From {l.from}</p>
            {l.sealed ? (
              <span className="chip chip-gold" style={{ fontSize: 10, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Lock size={9} strokeWidth={2} /> Sealed
              </span>
            ) : (
              <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.7, fontStyle: "italic" }}>{l.preview}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BEFORE YOU WERE BORN SECTION ─────────────────────────────────────────────
function BeforeBornSection() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ textAlign: "center", paddingTop: 60, paddingBottom: 80 }}>
        <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--sage)", marginBottom: 32 }}>
          Before You Were Born
        </p>
        <h1 className="font-display" style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", fontWeight: 700, color: "var(--green)", lineHeight: 1.1, marginBottom: 32 }}>
          The story before the story
        </h1>
        <div style={{ width: 40, height: 1, background: "var(--gold-border)", margin: "0 auto 32px" }} />
        <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.8, maxWidth: 480, margin: "0 auto 40px" }}>
          Every family has a chapter before the child arrives — the moment the test showed positive, the name debates, the nursery being painted at midnight.
        </p>
        <p className="font-display" style={{ fontSize: "clamp(1.1rem, 3vw, 1.4rem)", fontStyle: "italic", color: "var(--gold)", lineHeight: 1.6, maxWidth: 440, margin: "0 auto" }}>
          &ldquo;You were wanted before you were real. Loved before we knew your name.&rdquo;
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 80 }}>
        {[
          { title: "The announcement", desc: "How we told the world you were coming." },
          { title: "The name debate", desc: "All the names that almost were yours." },
          { title: "Getting ready for you", desc: "Everything we did to prepare for your arrival." },
          { title: "The night before", desc: "What we did the night before you were born." },
        ].map(item => (
          <div key={item.title} className="card" style={{ padding: 28 }}>
            <h3 className="font-display" style={{ fontSize: 20, fontWeight: 400, color: "var(--text)", marginBottom: 8 }}>{item.title}</h3>
            <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.65 }}>{item.desc}</p>
            <p className="font-display" style={{ fontSize: 13, color: "var(--text-4)", fontStyle: "italic", marginTop: 12 }}>Not yet written…</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DELIVERY SECTION ─────────────────────────────────────────────────────────
function DeliverySection() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{ width: 44, height: 44, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PackageOpen size={18} color="var(--sage)" strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>Delivery</h1>
          <p style={{ fontSize: 12, color: "var(--text-3)" }}>How memories reach {CHILD_FIRST}&apos;s circle</p>
        </div>
      </div>
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        <PackageOpen size={36} color="var(--text-3)" strokeWidth={1} style={{ margin: "0 auto 16px" }} />
        <p className="font-display" style={{ fontStyle: "italic", fontSize: 20, color: "var(--text-2)", marginBottom: 8 }}>
          Monthly prompts, automatically delivered.
        </p>
        <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
          Every month, each person in {CHILD_FIRST}&apos;s circle receives a gentle prompt — a question worth answering, sealed into the vault automatically.
        </p>
      </div>
    </div>
  );
}

// ─── MAIN DEMO PAGE ───────────────────────────────────────────────────────────
export default function DemoPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const BANNER_HEIGHT = 44;
  const SIDEBAR_WIDTH = 224;

  function renderSection() {
    switch (activeSection) {
      case "home": return <HomeSection onNavigate={s => { setActiveSection(s); window.scrollTo(0, 0); }} />;
      case "vault": return <VaultSection />;
      case "world": return <WorldSection />;
      case "before-born": return <BeforeBornSection />;
      case "letters": return <LettersSection />;
      case "dispatches": return <DispatchesSection />;
      case "circle": return <CircleSection />;
      case "delivery": return <DeliverySection />;
      default: return <HomeSection onNavigate={s => { setActiveSection(s); window.scrollTo(0, 0); }} />;
    }
  }

  return (
    <>
      {/* ── DEMO BANNER ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: BANNER_HEIGHT,
        background: "rgba(200,168,122,0.12)",
        borderBottom: "1px solid rgba(200,168,122,0.35)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px",
        backdropFilter: "blur(12px)",
      }}>
        <span style={{
          fontFamily: "var(--font-body)", fontSize: 11, color: "var(--gold)",
          letterSpacing: "0.12em", textTransform: "uppercase" as const, fontWeight: 600,
        }}>
          <span className="demo-banner-full">THIS IS A DEMO — explore what your family&apos;s vault could look like</span>
          <span className="demo-banner-mobile">DEMO — explore your family&apos;s vault</span>
        </span>
        <Link href="/reserve" style={{
          display: "inline-flex", alignItems: "center",
          padding: "6px 14px", borderRadius: 100,
          background: "var(--green)", color: "#fff",
          fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
          textDecoration: "none", transition: "opacity 160ms",
          fontFamily: "var(--font-body)", flexShrink: 0,
        }}>
          Reserve your spot →
        </Link>
      </div>

      {/* ── MOBILE TOP BAR ── */}
      <div
        className="sidebar-topbar-demo"
        style={{
          position: "fixed", left: 0, right: 0, zIndex: 60,
          height: 52,
          top: BANNER_HEIGHT,
          display: "flex", alignItems: "center", gap: 12,
          padding: "0 16px",
          borderBottom: "0.5px solid var(--border)",
          background: "rgba(253,251,247,0.94)", backdropFilter: "blur(16px)",
        }}
      >
        <button
          onClick={() => setSidebarOpen(s => !s)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-2)", padding: 6 }}
        >
          {sidebarOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
        </button>
        <span style={{ fontFamily: "var(--font-playfair)", fontSize: 20, fontWeight: 700, color: "var(--green)", letterSpacing: "0.02em" }}>
          Our Fable
        </span>
      </div>

      {/* ── MOBILE OVERLAY ── */}
      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 55, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`demo-sidebar ${sidebarOpen ? "demo-sidebar-open" : ""}`}
        style={{
          position: "fixed", top: BANNER_HEIGHT, left: 0, bottom: 0, zIndex: 60,
          width: SIDEBAR_WIDTH,
          background: "var(--surface)",
          borderRight: "0.5px solid var(--border)",
        }}
      >
        <DemoSidebarContent
          activeSection={activeSection}
          onSectionChange={s => { setActiveSection(s); setSidebarOpen(false); }}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{
        minHeight: "100vh",
        background: "var(--bg)",
        paddingTop: BANNER_HEIGHT,
      }}>
        <div className="demo-content-inner" style={{
          padding: "48px 32px 0",
          maxWidth: 720,
        }}>
          {renderSection()}
        </div>
      </main>

      <style>{`
        /* Banner text responsive */
        .demo-banner-mobile { display: none; }
        @media (max-width: 560px) {
          .demo-banner-full { display: none; }
          .demo-banner-mobile { display: inline; }
        }

        /* Sidebar: mobile hidden by default */
        .sidebar-topbar-demo { display: flex; }
        .demo-sidebar {
          transform: translateX(-100%);
          transition: transform 280ms cubic-bezier(0.4,0,0.2,1);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .demo-sidebar-open {
          transform: translateX(0) !important;
        }

        /* Desktop: always show sidebar */
        @media (min-width: 768px) {
          .sidebar-topbar-demo { display: none !important; }
          .demo-sidebar { transform: translateX(0) !important; }
          .demo-content-inner {
            margin-left: ${SIDEBAR_WIDTH}px !important;
          }
        }

        /* Mobile: account for top bar */
        @media (max-width: 767px) {
          main {
            padding-top: ${BANNER_HEIGHT + 52}px !important;
          }
          .demo-content-inner {
            padding: 28px 16px 0 !important;
          }
        }

        /* Card hover effect */
        .card-hover-luxury {
          display: block;
          text-decoration: none;
          color: inherit;
          transition: background 180ms ease;
        }
        .card-hover-luxury:hover {
          background: var(--surface);
        }

        /* Chips */
        .chip {
          display: inline-flex; align-items: center;
          padding: 3px 10px; border-radius: 100px;
          background: var(--surface); border: 1px solid var(--border);
          font-family: var(--font-body); font-size: 11;
          color: var(--text-3);
        }
        .chip-gold {
          background: var(--gold-dim) !important;
          border-color: var(--gold-border) !important;
          color: var(--gold) !important;
        }
        .chip-sage {
          background: var(--sage-dim) !important;
          border-color: var(--sage-border) !important;
          color: var(--sage) !important;
        }

        /* Card */
        .card {
          background: var(--card, #fff);
          border: 1px solid var(--border);
          border-radius: 12px;
        }

        /* Animations */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes countLand {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        @keyframes goldLineDraw {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </>
  );
}
