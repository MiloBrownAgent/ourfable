"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Lock,
  FileText,
  Mic,
  Video,
  Image as ImageIcon,
  Heart,
  GraduationCap,
  Users,
  BookOpen,
  Globe,
  Newspaper,
  Mail,
  Sun,
  Music,
  MapPin,
  Calendar,
  Star,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Clock,
} from "lucide-react";

// ─── Demo Data ───────────────────────────────────────────────────────────────

const CHILD = {
  name: "Noah Ellis",
  firstName: "Noah",
  dob: new Date("2025-06-25"),
  location: "Minneapolis, MN",
  family: "Sarah & James Ellis",
};

function getDaysAlive(): number {
  const now = new Date();
  const diff = now.getTime() - CHILD.dob.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getAgeStr(): string {
  const now = new Date();
  const months =
    (now.getFullYear() - CHILD.dob.getFullYear()) * 12 +
    (now.getMonth() - CHILD.dob.getMonth());
  const days = Math.floor(
    (now.getTime() - new Date(CHILD.dob.getFullYear(), CHILD.dob.getMonth() + months, CHILD.dob.getDate()).getTime()) /
      86400000
  );
  if (months < 1) return `${Math.floor((now.getTime() - CHILD.dob.getTime()) / 86400000)} days old`;
  if (months < 12) return days > 0 ? `${months} months, ${days} days old` : `${months} months old`;
  const yrs = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${yrs} year${yrs > 1 ? "s" : ""}, ${rem} month${rem > 1 ? "s" : ""} old` : `${yrs} year${yrs > 1 ? "s" : ""} old`;
}

interface VaultEntry {
  id: string;
  name: string;
  relationship: string;
  contentType: "letter" | "voice" | "photo" | "video";
  sealedUntil: string;
  sealIcon: "13" | "18" | "graduation" | "wedding" | "21";
  date: string;
  snippet: string;
}

const VAULT_ENTRIES: VaultEntry[] = [
  {
    id: "1",
    name: "Grandma Betty",
    relationship: "Paternal grandmother",
    contentType: "letter",
    sealedUntil: "13th birthday",
    sealIcon: "13",
    date: "July 2025",
    snippet: "Letter sealed",
  },
  {
    id: "2",
    name: "Grandpa Jim",
    relationship: "Maternal grandfather",
    contentType: "voice",
    sealedUntil: "18th birthday",
    sealIcon: "18",
    date: "August 2025",
    snippet: "Voice memo sealed",
  },
  {
    id: "3",
    name: "Uncle Paul",
    relationship: "Uncle",
    contentType: "letter",
    sealedUntil: "Graduation day",
    sealIcon: "graduation",
    date: "September 2025",
    snippet: "Letter sealed",
  },
  {
    id: "4",
    name: "Godmother Sarah",
    relationship: "Godmother",
    contentType: "photo",
    sealedUntil: "18th birthday",
    sealIcon: "18",
    date: "October 2025",
    snippet: "Photo + letter sealed",
  },
  {
    id: "5",
    name: "Aunt Rachel",
    relationship: "Maternal aunt",
    contentType: "video",
    sealedUntil: "Wedding day",
    sealIcon: "wedding",
    date: "November 2025",
    snippet: "Video sealed",
  },
  {
    id: "6",
    name: "Family friend Mike",
    relationship: "Family friend",
    contentType: "letter",
    sealedUntil: "21st birthday",
    sealIcon: "21",
    date: "December 2025",
    snippet: "Letter sealed",
  },
  {
    id: "7",
    name: "Neighbor Joan",
    relationship: "Neighbor",
    contentType: "voice",
    sealedUntil: "13th birthday",
    sealIcon: "13",
    date: "January 2026",
    snippet: "Voice memo sealed",
  },
  {
    id: "8",
    name: "College friend Emma",
    relationship: "Family friend",
    contentType: "letter",
    sealedUntil: "18th birthday",
    sealIcon: "18",
    date: "February 2026",
    snippet: "Letter sealed",
  },
];

interface MonthSnapshot {
  year: number;
  month: number;
  label: string;
  headline?: string;
  song?: string;
  artist?: string;
  weather?: string;
  temp?: string;
  funFact?: string;
  age: string;
  isBirth?: boolean;
  isCurrent?: boolean;
}

const SNAPSHOTS: MonthSnapshot[] = [
  {
    year: 2025, month: 6, label: "June 2025",
    headline: "Noah Ellis enters the world",
    song: "Espresso", artist: "Sabrina Carpenter",
    weather: "Sunny & warm", temp: "82°F",
    age: "Newborn", isBirth: true,
  },
  {
    year: 2025, month: 7, label: "July 2025",
    headline: "Heat wave grips Minneapolis as Noah turns 1 month",
    song: "Good Luck, Babe!", artist: "Chappell Roan",
    weather: "Hot & humid", temp: "91°F",
    age: "1 month",
  },
  {
    year: 2025, month: 8, label: "August 2025",
    headline: "State Fair opens as Noah begins smiling",
    song: "Die With A Smile", artist: "Lady Gaga & Bruno Mars",
    weather: "Warm, late summer", temp: "85°F",
    age: "2 months",
  },
  {
    year: 2025, month: 9, label: "September 2025",
    headline: "Fall arrives; Noah discovers his hands",
    song: "APT.", artist: "ROSE & Bruno Mars",
    weather: "Cool & crisp", temp: "67°F",
    age: "3 months",
  },
  {
    year: 2025, month: 10, label: "October 2025",
    headline: "Noah's first Halloween — dressed as a little pumpkin",
    song: "luther", artist: "Kendrick Lamar & SZA",
    weather: "Chilly & windy", temp: "52°F",
    age: "4 months",
  },
  {
    year: 2025, month: 11, label: "November 2025",
    headline: "First snowflakes spotted in Minneapolis",
    song: "That's So True", artist: "Gracie Abrams",
    weather: "First snow", temp: "34°F",
    age: "5 months",
  },
  {
    year: 2025, month: 12, label: "December 2025",
    headline: "Noah's first Christmas — wide eyes at the tree lights",
    song: "All I Want for Christmas Is You", artist: "Mariah Carey",
    weather: "Snowy & cold", temp: "18°F",
    age: "6 months",
  },
  {
    year: 2026, month: 1, label: "January 2026",
    headline: "New Year brings new rolls — Noah rolls over for the first time",
    song: "BIRDS OF A FEATHER", artist: "Billie Eilish",
    weather: "Deep freeze", temp: "7°F",
    age: "7 months",
  },
  {
    year: 2026, month: 2, label: "February 2026",
    headline: "Super Bowl LX comes to Minneapolis; Noah naps through halftime",
    song: "Now And Then", artist: "The Beatles",
    weather: "Cold & clear", temp: "22°F",
    age: "8 months",
  },
  {
    year: 2026, month: 3, label: "March 2026",
    headline: "Spring thaw begins; Noah starts pulling up to stand",
    song: "Not Like Us", artist: "Kendrick Lamar",
    weather: "Thawing, partly cloudy", temp: "41°F",
    age: "9 months",
    isCurrent: true,
  },
];

const CIRCLE_MEMBERS = [
  { name: "James Ellis", role: "Dad", initials: "JE", color: "#4A5E4C" },
  { name: "Sarah Ellis", role: "Mom", initials: "SE", color: "#6B8F6F" },
  { name: "Grandma Betty", role: "Paternal grandmother", initials: "GB", color: "#C8A87A" },
  { name: "Grandpa Jim", role: "Maternal grandfather", initials: "GJ", color: "#8B7355" },
  { name: "Uncle Paul", role: "Uncle", initials: "UP", color: "#7A8FA6" },
  { name: "Godmother Sarah", role: "Godmother", initials: "GS", color: "#B07BAC" },
  { name: "Aunt Rachel", role: "Maternal aunt", initials: "AR", color: "#C8A87A" },
  { name: "Family friend Mike", role: "Family friend", initials: "FM", color: "#6B8F6F" },
];

// ─── Sub-Components ──────────────────────────────────────────────────────────

function ContentTypeIcon({ type, size = 14 }: { type: string; size?: number }) {
  const props = { size, strokeWidth: 1.5, color: "var(--gold)" };
  if (type === "letter") return <FileText {...props} />;
  if (type === "voice") return <Mic {...props} />;
  if (type === "photo") return <ImageIcon {...props} />;
  if (type === "video") return <Video {...props} />;
  return <FileText {...props} />;
}

function SealIcon({ until }: { until: string }) {
  if (until === "graduation") return <GraduationCap size={12} strokeWidth={1.5} color="var(--gold)" />;
  if (until === "wedding") return <Heart size={12} strokeWidth={1.5} color="var(--gold)" />;
  return <Lock size={12} strokeWidth={1.5} color="var(--gold)" />;
}

function SealLabel({ until }: { until: string }) {
  const map: Record<string, string> = {
    "13": "Opens at 13",
    "18": "Opens at 18",
    "21": "Opens at 21",
    "graduation": "Opens at graduation",
    "wedding": "Opens on wedding day",
  };
  return <>{map[until] ?? `Opens at ${until}`}</>;
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

type Tab = "dashboard" | "vault" | "world" | "born" | "prompts";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "dashboard", label: "Dashboard", icon: <BookOpen size={15} strokeWidth={1.5} /> },
  { key: "vault", label: "Vault", icon: <Lock size={15} strokeWidth={1.5} /> },
  { key: "world", label: "World", icon: <Globe size={15} strokeWidth={1.5} /> },
  { key: "born", label: "Born Day", icon: <Newspaper size={15} strokeWidth={1.5} /> },
  { key: "prompts", label: "How Prompts Work", icon: <Mail size={15} strokeWidth={1.5} /> },
];

// ─── Screen: Dashboard ───────────────────────────────────────────────────────

function DashboardScreen() {
  const daysAlive = getDaysAlive();
  const ageStr = getAgeStr();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Greeting */}
      <div style={{
        background: "linear-gradient(135deg, var(--green) 0%, var(--green-mid) 100%)",
        borderRadius: "var(--radius-lg)",
        padding: "32px 28px",
        color: "#fff",
      }}>
        <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Good morning, Sarah & James
        </p>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 4,
          lineHeight: 1.2,
        }}>
          {CHILD.firstName}&apos;s Fable
        </h2>
        <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 20 }}>{ageStr}</p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}>
          <div style={{
            background: "rgba(255,255,255,0.12)",
            borderRadius: 12,
            padding: "16px 20px",
            backdropFilter: "blur(10px)",
          }}>
            <p style={{
              fontFamily: "var(--font-display)",
              fontSize: 36,
              fontWeight: 700,
              lineHeight: 1,
              marginBottom: 4,
            }}>
              {daysAlive.toLocaleString()}
            </p>
            <p style={{ fontSize: 11, opacity: 0.7, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Days alive
            </p>
          </div>
          <div style={{
            background: "rgba(255,255,255,0.12)",
            borderRadius: 12,
            padding: "16px 20px",
            backdropFilter: "blur(10px)",
          }}>
            <p style={{
              fontFamily: "var(--font-display)",
              fontSize: 36,
              fontWeight: 700,
              lineHeight: 1,
              marginBottom: 4,
            }}>
              47
            </p>
            <p style={{ fontSize: 11, opacity: 0.7, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Vault entries
            </p>
          </div>
        </div>
      </div>

      {/* Writing Block */}
      <div style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "20px 20px",
        boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Sparkles size={16} color="var(--gold)" strokeWidth={1.5} />
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Your monthly prompt</p>
          <span style={{
            marginLeft: "auto",
            fontSize: 10,
            color: "var(--text-3)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 100,
            padding: "3px 10px",
          }}>
            Due April 1
          </span>
        </div>
        <p style={{ fontSize: 15, fontStyle: "italic", color: "var(--text-2)", lineHeight: 1.7, marginBottom: 16 }}>
          &ldquo;What was the moment you realized your whole world had changed — the second you heard {CHILD.firstName} cry for the first time?&rdquo;
        </p>
        <div style={{
          border: "1.5px dashed var(--border)",
          borderRadius: 10,
          padding: "14px 16px",
          color: "var(--text-3)",
          fontSize: 14,
          background: "var(--bg-2)",
          cursor: "default",
        }}>
          <span style={{ opacity: 0.6 }}>Write your memory here… (demo mode)</span>
        </div>
      </div>

      {/* Vault Preview */}
      <div style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "20px 20px",
        boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Lock size={16} color="var(--gold)" strokeWidth={1.5} />
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>The Vault</p>
          <span style={{
            marginLeft: "auto",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            color: "var(--gold)",
          }}>
            47 sealed
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {VAULT_ENTRIES.slice(0, 3).map(e => (
            <div key={e.id} style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              background: "var(--gold-dim)",
              border: "1px solid var(--gold-border)",
              borderRadius: 10,
            }}>
              <div style={{
                width: 32, height: 32,
                borderRadius: 8,
                background: "rgba(200,168,122,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Lock size={14} color="var(--gold)" strokeWidth={1.5} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{e.name}</p>
                <p style={{ fontSize: 11, color: "var(--text-3)" }}>{e.contentType} · {e.sealedUntil}</p>
              </div>
            </div>
          ))}
          <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", marginTop: 4 }}>
            +44 more sealed entries
          </p>
        </div>
      </div>

      {/* Dispatches Card */}
      <div style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "20px 20px",
        boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Mail size={16} color="var(--sage)" strokeWidth={1.5} />
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Dispatches</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{
            display: "flex", gap: 12, padding: "12px 0",
            borderBottom: "1px solid var(--border)",
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "var(--green)", marginTop: 5, flexShrink: 0,
            }} />
            <div>
              <p style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>Grandma Betty responded</p>
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>March prompt · Sealed until Noah turns 13</p>
            </div>
            <Clock size={12} color="var(--text-4)" style={{ marginLeft: "auto", marginTop: 4, flexShrink: 0 }} />
          </div>
          <div style={{
            display: "flex", gap: 12, padding: "12px 0",
            borderBottom: "1px solid var(--border)",
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "var(--gold)", marginTop: 5, flexShrink: 0,
            }} />
            <div>
              <p style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>Uncle Paul sealed a letter</p>
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>For graduation day</p>
            </div>
            <Clock size={12} color="var(--text-4)" style={{ marginLeft: "auto", marginTop: 4, flexShrink: 0 }} />
          </div>
          <div style={{ display: "flex", gap: 12, padding: "12px 0" }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "var(--border-dark)", marginTop: 5, flexShrink: 0,
            }} />
            <div>
              <p style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>April prompts sending in 4 days</p>
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>8 circle members will receive prompts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Circle Card */}
      <div style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "20px 20px",
        boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Users size={16} color="var(--sage)" strokeWidth={1.5} />
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{CHILD.firstName}&apos;s Circle</p>
          <span style={{
            marginLeft: "auto",
            fontSize: 11,
            color: "var(--text-3)",
          }}>
            8 members
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {CIRCLE_MEMBERS.map(m => (
            <div key={m.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 64 }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: m.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 13, fontWeight: 700,
                flexShrink: 0,
              }}>
                {m.initials}
              </div>
              <p style={{ fontSize: 10, color: "var(--text-2)", textAlign: "center", lineHeight: 1.3 }}>
                {m.name.split(" ")[0]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Vault ───────────────────────────────────────────────────────────

function VaultScreen() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "var(--gold-dim)", border: "1px solid var(--gold-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Lock size={20} color="var(--gold)" strokeWidth={1.5} />
          </div>
          <div>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: 24,
              fontWeight: 700,
              color: "var(--text)",
            }}>
              {CHILD.firstName}&apos;s Vault
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>
              Every sealed entry, waiting for its moment.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 16 }}>
          {[
            { label: "Total", value: 47, color: "var(--text)" },
            { label: "Sealed", value: 47, color: "var(--gold)" },
            { label: "Open", value: 0, color: "var(--sage)" },
          ].map(s => (
            <div key={s.label} style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12, padding: "14px 0", textAlign: "center",
            }}>
              <p style={{
                fontFamily: "var(--font-display)",
                fontSize: 26, fontWeight: 300,
                color: s.color, lineHeight: 1,
              }}>
                {s.value}
              </p>
              <p style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Vault entries */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {VAULT_ENTRIES.map(entry => (
          <div key={entry.id} style={{
            background: "var(--card)",
            border: "1px solid var(--gold-border)",
            borderLeft: "3px solid var(--gold-border)",
            borderRadius: "var(--radius)",
            padding: "18px 20px",
            boxShadow: "var(--shadow-sm)",
            opacity: 0.9,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              {/* Lock icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: "var(--gold-dim)", border: "1px solid var(--gold-border)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Lock size={16} color="var(--gold)" strokeWidth={1.5} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <p style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 16, fontWeight: 400,
                    color: "var(--text)",
                  }}>
                    {entry.name}
                  </p>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>· {entry.relationship}</span>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {/* Sealed chip */}
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 10, padding: "3px 10px",
                    background: "var(--gold-dim)", border: "1px solid var(--gold-border)",
                    borderRadius: 100, color: "var(--gold)", fontWeight: 500,
                  }}>
                    <Lock size={9} strokeWidth={2} />
                    Sealed
                  </span>

                  {/* Content type chip */}
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 10, padding: "3px 10px",
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 100, color: "var(--text-3)",
                  }}>
                    <ContentTypeIcon type={entry.contentType} size={11} />
                    {entry.contentType === "photo" ? "Photo + letter" : entry.contentType.charAt(0).toUpperCase() + entry.contentType.slice(1)}
                  </span>

                  {/* Unlock age chip */}
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 10, padding: "3px 10px",
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 100, color: "var(--text-3)",
                  }}>
                    <SealIcon until={entry.sealIcon} />
                    <SealLabel until={entry.sealIcon} />
                  </span>
                </div>

                <p style={{ fontSize: 11, color: "var(--text-4)", marginTop: 10 }}>
                  Sealed {entry.date}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* More indicator */}
        <div style={{
          textAlign: "center", padding: "20px",
          background: "var(--surface)", border: "1px dashed var(--border)",
          borderRadius: "var(--radius)",
          color: "var(--text-3)", fontSize: 13,
        }}>
          <Lock size={16} color="var(--border-dark)" strokeWidth={1.5} style={{ marginBottom: 6 }} />
          <p>+39 more sealed entries waiting</p>
          <p style={{ fontSize: 11, marginTop: 4, color: "var(--text-4)" }}>
            Growing every month as {CHILD.firstName}&apos;s circle responds to prompts
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: World Snapshot ──────────────────────────────────────────────────

function WorldScreen() {
  const [selected, setSelected] = useState<MonthSnapshot>(SNAPSHOTS[SNAPSHOTS.length - 1]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 4,
        }}>
          {CHILD.firstName}&apos;s World Snapshots
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-3)" }}>
          Every month of {CHILD.firstName}&apos;s life, captured in time.
        </p>
      </div>

      {/* Selected snapshot */}
      <div style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        boxShadow: "var(--shadow)",
      }}>
        {/* Header */}
        <div style={{
          background: selected.isBirth
            ? "linear-gradient(135deg, #C8A87A 0%, #D4B88A 100%)"
            : selected.isCurrent
              ? "linear-gradient(135deg, var(--green) 0%, var(--green-mid) 100%)"
              : "linear-gradient(135deg, #4A5E4C 0%, #3D5040 100%)",
          padding: "24px 24px 20px",
          color: "#fff",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            {selected.isBirth && <Star size={14} color="rgba(255,255,255,0.8)" strokeWidth={1.5} />}
            <p style={{ fontSize: 11, opacity: 0.75, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {selected.isBirth ? "Birth month" : selected.isCurrent ? "Current month" : "Monthly snapshot"}
            </p>
          </div>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontSize: 28, fontWeight: 700, marginBottom: 4, lineHeight: 1.2,
          }}>
            {selected.label}
          </h3>
          <p style={{ fontSize: 14, opacity: 0.8 }}>{CHILD.firstName} · {selected.age}</p>
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {selected.headline && (
            <div style={{
              padding: "14px 16px",
              background: "var(--bg-2)",
              borderRadius: 10,
              borderLeft: "3px solid var(--border-dark)",
            }}>
              <p style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                Top headline
              </p>
              <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.5, fontStyle: "italic" }}>
                &ldquo;{selected.headline}&rdquo;
              </p>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {selected.song && (
              <div style={{
                padding: "14px 16px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Music size={13} color="var(--gold)" strokeWidth={1.5} />
                  <p style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    #1 Song
                  </p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>
                  {selected.song}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{selected.artist}</p>
              </div>
            )}

            {selected.weather && (
              <div style={{
                padding: "14px 16px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <MapPin size={13} color="var(--sage)" strokeWidth={1.5} />
                  <p style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Minneapolis
                  </p>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>
                  {selected.temp}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{selected.weather}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <p style={{ fontSize: 12, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
          All months
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[...SNAPSHOTS].reverse().map((snap, i) => (
            <button
              key={`${snap.year}-${snap.month}`}
              onClick={() => setSelected(snap)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 16px",
                background: selected === snap ? "var(--green-light)" : "var(--card)",
                border: `1px solid ${selected === snap ? "var(--green-border)" : "var(--border)"}`,
                borderRadius: 10,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 160ms",
              }}
            >
              {/* Timeline dot */}
              <div style={{
                width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                background: snap.isBirth
                  ? "var(--gold)"
                  : snap.isCurrent
                    ? "var(--green)"
                    : selected === snap
                      ? "var(--green)"
                      : "var(--border-dark)",
              }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <p style={{
                    fontSize: 13, fontWeight: 500,
                    color: selected === snap ? "var(--green)" : "var(--text)",
                  }}>
                    {snap.label}
                  </p>
                  {snap.isBirth && (
                    <span style={{
                      fontSize: 9, padding: "2px 7px",
                      background: "var(--gold-dim)", border: "1px solid var(--gold-border)",
                      borderRadius: 100, color: "var(--gold)",
                    }}>
                      BORN
                    </span>
                  )}
                  {snap.isCurrent && (
                    <span style={{
                      fontSize: 9, padding: "2px 7px",
                      background: "var(--green-light)", border: "1px solid var(--green-border)",
                      borderRadius: 100, color: "var(--green)",
                    }}>
                      NOW
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
                  {snap.age}
                  {snap.song && <> · {snap.song}</>}
                </p>
              </div>

              <ChevronRight size={14} color={selected === snap ? "var(--green)" : "var(--text-4)"} strokeWidth={1.5} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Born Day ────────────────────────────────────────────────────────

function GoldDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, margin: "16px auto", maxWidth: 200 }}>
      <div style={{ flex: 1, height: 1, background: "var(--gold-border)" }} />
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--gold)", opacity: 0.5 }} />
      <div style={{ flex: 1, height: 1, background: "var(--gold-border)" }} />
    </div>
  );
}

function BornDayScreen() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{
        background: "var(--card)",
        border: "1px solid var(--gold-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        boxShadow: "var(--shadow)",
      }}>
        {/* Masthead */}
        <div style={{
          padding: "28px 28px 20px",
          borderBottom: "2px solid var(--text)",
          textAlign: "center",
        }}>
          <p style={{
            fontSize: 9,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "var(--text-3)",
            marginBottom: 8,
          }}>
            ✦ Est. June 25, 2025 · Minneapolis, Minnesota ✦
          </p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: 32,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            color: "var(--text)",
            lineHeight: 1.05,
            marginBottom: 6,
          }}>
            The Ellis Gazette
          </h2>
          <div style={{ height: 2, background: "var(--text)", margin: "10px 0 8px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <p style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.1em" }}>
              VOL. I, NO. 1
            </p>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--gold)", opacity: 0.6 }} />
            <p style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.1em" }}>
              WEDNESDAY, JUNE 25, 2025
            </p>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--gold)", opacity: 0.6 }} />
            <p style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.1em" }}>
              ONE CENT
            </p>
          </div>
          <div style={{ height: 1, background: "var(--border)", margin: "8px 0 0" }} />
        </div>

        {/* Headline */}
        <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)" }}>
          <p style={{
            fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--gold)", fontWeight: 600, marginBottom: 10,
          }}>
            ★ SPECIAL EDITION ★
          </p>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontSize: 26, fontWeight: 900, lineHeight: 1.2,
            color: "var(--text)", marginBottom: 8,
          }}>
            A Child Is Born: Noah James Ellis Arrives
          </h3>
          <p style={{
            fontFamily: "var(--font-display)",
            fontSize: 16, fontStyle: "italic", fontWeight: 400,
            color: "var(--text-2)", lineHeight: 1.5, marginBottom: 14,
          }}>
            &ldquo;He opened his eyes and looked at us like he&apos;d been waiting his whole life for this moment — and he had.&rdquo;
          </p>

          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{
              background: "var(--green)",
              borderRadius: 6, padding: "8px 14px",
              color: "#fff", fontSize: 12, fontWeight: 600,
            }}>
              7 lbs, 4 oz
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>
              Born at 2:47 AM · Abbott Northwestern Hospital
            </div>
          </div>
        </div>

        {/* Two column */}
        <div style={{ padding: "0 28px", display: "grid", gridTemplateColumns: "1fr 1px 1fr", gap: 0 }}>
          {/* Left col */}
          <div style={{ padding: "20px 20px 20px 0" }}>
            <div style={{ height: 1, background: "var(--border)", marginBottom: 14 }} />
            <p style={{ fontSize: 10, color: "var(--gold)", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
              Weather Report
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Sun size={22} color="var(--gold)" strokeWidth={1.5} />
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, lineHeight: 1 }}>82°F</p>
                <p style={{ fontSize: 11, color: "var(--text-3)" }}>Sunny & beautiful</p>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
              A perfect summer morning welcomed Noah into the world. The sun was bright over Minneapolis, the air warm and still. The day could not have been more perfect.
            </p>
            <div style={{ height: 1, background: "var(--border)", margin: "14px 0" }} />
            <p style={{ fontSize: 10, color: "var(--gold)", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
              Song of the Day
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Music size={18} color="var(--gold)" strokeWidth={1.5} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Espresso</p>
                <p style={{ fontSize: 11, color: "var(--text-3)" }}>Sabrina Carpenter</p>
                <p style={{ fontSize: 10, color: "var(--text-4)" }}>#1 in America</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ background: "var(--border)" }} />

          {/* Right col */}
          <div style={{ padding: "20px 0 20px 20px" }}>
            <div style={{ height: 1, background: "var(--border)", marginBottom: 14 }} />
            <p style={{ fontSize: 10, color: "var(--gold)", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>
              In the World Today
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "World leaders gather for G7 summit in Canada",
                "US Open begins at Oakmont Country Club",
                "NASA announces new Mars mission plans",
              ].map((h, i) => (
                <div key={i} style={{
                  paddingBottom: 10,
                  borderBottom: i < 2 ? "1px solid var(--border)" : "none",
                }}>
                  <p style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.4, fontStyle: "italic" }}>
                    &ldquo;{h}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <GoldDivider />
        <div style={{
          padding: "16px 28px 24px",
          textAlign: "center",
          borderTop: "1px solid var(--border)",
        }}>
          <p style={{
            fontFamily: "var(--font-display)",
            fontSize: 14, fontStyle: "italic",
            color: "var(--text-3)", lineHeight: 1.7,
          }}>
            &ldquo;On this day, everything changed. A family became three.&rdquo;
          </p>
          <p style={{ fontSize: 10, color: "var(--text-4)", marginTop: 8, letterSpacing: "0.1em" }}>
            This edition is sealed in {CHILD.firstName}&apos;s Vault for him to read someday. ✦
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: How Prompts Work ────────────────────────────────────────────────

function PromptsScreen() {
  const [showRespond, setShowRespond] = useState(false);

  if (showRespond) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Back button */}
        <button
          onClick={() => setShowRespond(false)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-3)", fontSize: 13, padding: 0,
            textDecoration: "underline",
          }}
        >
          ← Back to email preview
        </button>

        {/* Respond page in accessibility mode */}
        <div style={{
          background: "#FDFBF7",
          border: "2px solid var(--green)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-lg)",
        }}>
          {/* Header */}
          <div style={{
            background: "var(--green)",
            padding: "24px 28px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "#fff" }}>
                Our Fable
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                Respond to Noah&apos;s prompt
              </p>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: 8, padding: "6px 12px",
              fontSize: 11, color: "#fff", fontWeight: 500,
            }}>
              ✦ Big text mode
            </div>
          </div>

          <div style={{ padding: "28px 28px" }}>
            {/* Accessibility mode notice */}
            <div style={{
              background: "var(--green-light)",
              border: "1px solid var(--green-border)",
              borderRadius: 12, padding: "14px 18px",
              marginBottom: 24,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <Star size={16} color="var(--green)" strokeWidth={1.5} />
              <p style={{ fontSize: 13, color: "var(--green)", fontWeight: 500 }}>
                Accessibility mode is on — larger text, simpler layout
              </p>
            </div>

            {/* From */}
            <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 6 }}>
              Prompt from
            </p>
            <p style={{
              fontFamily: "var(--font-display)",
              fontSize: 28, fontWeight: 700,
              color: "var(--text)", marginBottom: 24,
              lineHeight: 1.2,
            }}>
              Noah Ellis
            </p>

            {/* Question — big text */}
            <div style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14, padding: "22px 24px",
              marginBottom: 28,
            }}>
              <p style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
                This month&apos;s question
              </p>
              <p style={{
                fontFamily: "var(--font-display)",
                fontSize: 22, fontStyle: "italic",
                color: "var(--text)", lineHeight: 1.5,
              }}>
                &ldquo;Grandma Betty — what do you remember most about the first time you held me?&rdquo;
              </p>
            </div>

            {/* Response options — big buttons */}
            <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 16, fontWeight: 500 }}>
              Choose how to respond:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { icon: <FileText size={22} strokeWidth={1.5} />, label: "Write a letter", sub: "Type your response", color: "var(--green)" },
                { icon: <Mic size={22} strokeWidth={1.5} />, label: "Record your voice", sub: "Speak your memory aloud", color: "var(--sage)" },
                { icon: <ImageIcon size={22} strokeWidth={1.5} />, label: "Send a photo", sub: "With or without a note", color: "var(--gold)" },
                { icon: <Video size={22} strokeWidth={1.5} />, label: "Record a video", sub: "Say it on camera", color: "#7A8FA6" },
              ].map(opt => (
                <button
                  key={opt.label}
                  style={{
                    display: "flex", alignItems: "center", gap: 18,
                    padding: "20px 24px",
                    background: "var(--card)",
                    border: "2px solid var(--border)",
                    borderRadius: 14, cursor: "pointer",
                    textAlign: "left", transition: "all 160ms",
                    minHeight: 72,
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: "var(--surface)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: opt.color, flexShrink: 0,
                  }}>
                    {opt.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 17, fontWeight: 600, color: "var(--text)" }}>{opt.label}</p>
                    <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>{opt.sub}</p>
                  </div>
                  <ArrowRight size={20} color="var(--text-4)" style={{ marginLeft: "auto" }} />
                </button>
              ))}
            </div>

            {/* Seal note */}
            <div style={{
              marginTop: 28, padding: "16px 18px",
              background: "var(--gold-dim)", border: "1px solid var(--gold-border)",
              borderRadius: 12, display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <Lock size={16} color="var(--gold)" strokeWidth={1.5} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>
                  Your response will be sealed
                </p>
                <p style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
                  Noah won&apos;t be able to read it until his 13th birthday. Everything you share is private and permanent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 4,
        }}>
          How Prompts Work
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
          Every month, each person in {CHILD.firstName}&apos;s circle gets a personalized prompt email — with a single thoughtful question and a simple way to respond.
        </p>
      </div>

      {/* Email preview */}
      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        boxShadow: "var(--shadow)",
      }}>
        {/* Email header bar */}
        <div style={{
          background: "#f3f4f6",
          padding: "10px 16px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex", gap: 6,
        }}>
          {["#ef4444", "#f59e0b", "#10b981"].map(c => (
            <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
          ))}
          <p style={{ marginLeft: 8, fontSize: 11, color: "#6b7280" }}>Email preview</p>
        </div>

        {/* Email metadata */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid #f0f0f0",
          background: "#fafafa",
        }}>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
            <strong style={{ color: "#374151" }}>From:</strong> leo@ourfable.ai
          </p>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>
            <strong style={{ color: "#374151" }}>To:</strong> grandmabetty@gmail.com
          </p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
            Hi — it&apos;s Noah. 💛
          </p>
        </div>

        {/* Email body */}
        <div style={{ padding: "24px 24px" }}>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, var(--green) 0%, var(--green-mid) 100%)",
            borderRadius: 12, padding: "20px 24px", marginBottom: 20, textAlign: "center",
          }}>
            <p style={{
              fontFamily: "var(--font-display)",
              fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 4,
            }}>
              Our Fable
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
              A message from Noah Ellis
            </p>
          </div>

          {/* Greeting */}
          <p style={{ fontSize: 15, color: "#374151", marginBottom: 16, lineHeight: 1.7 }}>
            Hi Grandma Betty,
          </p>

          <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.7, marginBottom: 20 }}>
            I&apos;m 9 months old now, and I can&apos;t ask you this question myself yet — but someday I&apos;ll be old enough to read your answer. This is your chance to save a memory for me.
          </p>

          {/* Prompt box */}
          <div style={{
            background: "var(--bg-2)",
            border: "2px solid var(--gold-border)",
            borderRadius: 14, padding: "22px 24px",
            marginBottom: 24, textAlign: "center",
          }}>
            <p style={{ fontSize: 10, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>
              ✦ This month&apos;s prompt ✦
            </p>
            <p style={{
              fontFamily: "var(--font-display)",
              fontSize: 19, fontStyle: "italic",
              color: "var(--text)", lineHeight: 1.55,
            }}>
              &ldquo;What do you remember most about the first time you held me? What were you thinking?&rdquo;
            </p>
          </div>

          {/* CTA button */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <button
              onClick={() => setShowRespond(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "16px 32px",
                background: "var(--green)", color: "#fff",
                border: "none", borderRadius: 100,
                fontSize: 16, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 20px rgba(74,94,76,0.3)",
                transition: "all 160ms",
              }}
            >
              Respond to Noah
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 10 }}>
              Takes 2 minutes · Your response is sealed until Noah turns 13
            </p>
          </div>

          {/* Footer */}
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 16, textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.6 }}>
              You&apos;re receiving this because Sarah &amp; James Ellis added you to Noah&apos;s circle.<br />
              <span style={{ textDecoration: "underline", cursor: "pointer" }}>Unsubscribe</span> · <span style={{ textDecoration: "underline", cursor: "pointer" }}>Accessibility mode</span>
            </p>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "20px 20px",
        boxShadow: "var(--shadow-sm)",
      }}>
        <h3 style={{
          fontFamily: "var(--font-display)",
          fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 16,
        }}>
          How it works for your circle
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { step: "1", title: "Monthly prompt arrives", desc: "Each person in your circle gets a personalized question, tailored to their relationship with your child." },
            { step: "2", title: "They respond their way", desc: "Letter, voice memo, photo, or video — whatever feels right. No app to download." },
            { step: "3", title: "It seals in the Vault", desc: "Their response is sealed automatically — your child can't read it until they reach the milestone age you set." },
            { step: "4", title: "A life in voices", desc: "By the time your child turns 13 or 18, they'll have a vault full of love letters from everyone who knew them." },
          ].map(item => (
            <div key={item.step} style={{ display: "flex", gap: 14 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "var(--green)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, flexShrink: 0,
              }}>
                {item.step}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>{item.title}</p>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Demo Page ──────────────────────────────────────────────────────────

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Demo Banner */}
      <div style={{
        background: "linear-gradient(90deg, var(--green) 0%, var(--green-mid) 100%)",
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        position: "sticky",
        top: 0,
        zIndex: 100,
        flexWrap: "wrap",
      }}>
        <p style={{ fontSize: 13, color: "#fff", fontWeight: 500, opacity: 0.95 }}>
          🎭 You&apos;re exploring a demo — this is what your family&apos;s vault could look like
        </p>
        <Link
          href="/reserve"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 18px",
            background: "#fff", color: "var(--green)",
            borderRadius: 100, fontSize: 13, fontWeight: 700,
            textDecoration: "none",
            flexShrink: 0,
            transition: "opacity 160ms",
          }}
        >
          Reserve your spot →
        </Link>
      </div>

      {/* Page header */}
      <div style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "32px 20px 0",
      }}>
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 12, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
            Interactive Demo
          </p>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: 30, fontWeight: 900,
            color: "var(--text)", lineHeight: 1.15, marginBottom: 6,
          }}>
            {CHILD.firstName}&apos;s Fable
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-3)" }}>
            {CHILD.family} · {CHILD.location} · Born June 25, 2025
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div style={{
        position: "sticky",
        top: 49,
        zIndex: 90,
        background: "rgba(253,251,247,0.97)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        marginTop: 20,
      }}>
        <div style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          gap: 0,
          overflowX: "auto",
          WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"],
        }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "14px 16px",
                background: "none", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400,
                color: activeTab === tab.key ? "var(--green)" : "var(--text-3)",
                borderBottom: `2px solid ${activeTab === tab.key ? "var(--green)" : "transparent"}`,
                whiteSpace: "nowrap",
                transition: "all 160ms",
              }}
            >
              <span style={{ color: activeTab === tab.key ? "var(--green)" : "var(--text-4)" }}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "24px 20px 100px",
      }}>
        {activeTab === "dashboard" && <DashboardScreen />}
        {activeTab === "vault" && <VaultScreen />}
        {activeTab === "world" && <WorldScreen />}
        {activeTab === "born" && <BornDayScreen />}
        {activeTab === "prompts" && <PromptsScreen />}
      </div>

      {/* Mobile sticky CTA */}
      <div className="demo-mobile-cta">
        <Link
          href="/reserve"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "16px 32px",
            background: "var(--green)", color: "#fff",
            borderRadius: 100, fontSize: 15, fontWeight: 700,
            textDecoration: "none", width: "100%",
            boxShadow: "0 4px 20px rgba(74,94,76,0.3)",
          }}
        >
          Reserve your spot →
        </Link>
      </div>

      <style>{`
        .demo-mobile-cta {
          display: none;
        }

        @media (max-width: 680px) {
          .demo-mobile-cta {
            display: block;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 16px 20px calc(16px + env(safe-area-inset-bottom, 0px));
            background: rgba(253,251,247,0.97);
            border-top: 1px solid var(--border);
            backdrop-filter: blur(20px);
            z-index: 80;
          }
        }
      `}</style>
    </div>
  );
}
