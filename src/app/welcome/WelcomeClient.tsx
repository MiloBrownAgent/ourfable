"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, FileText, Mic, Video, Image as ImageIcon, Play } from "lucide-react";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SampleEntry {
  id: number;
  monthOffset: number; // months after DOB
  author: string;
  initials: string;
  type: "letter" | "voice" | "photo" | "video";
  preview: string;
  duration?: string;
}

// ─── Sample Data ────────────────────────────────────────────────────────────

function getSampleEntries(childName: string): SampleEntry[] {
  const c = childName;
  return [
    { id: 1, monthOffset: 0, author: "Mom", initials: "M", type: "letter", preview: `You're here. I've been waiting my whole life to meet you and I didn't even know it.` },
    { id: 2, monthOffset: 1, author: "Grandma Ruth", initials: "GR", type: "letter", preview: `I sang you 'You Are My Sunshine' today and you grabbed my finger. I don't ever want to forget that.` },
    { id: 3, monthOffset: 2, author: "Uncle James", initials: "UJ", type: "voice", preview: "Voice Recording", duration: "1:12" },
    { id: 4, monthOffset: 4, author: "Dad", initials: "D", type: "letter", preview: `You said 'dada' today. Your mom pretended she wasn't jealous. She was.` },
    { id: 5, monthOffset: 5, author: "Aunt Maria", initials: "AM", type: "photo", preview: `You have your mama's eyes. Don't tell her I said that.` },
    { id: 6, monthOffset: 7, author: "Grandpa Joe", initials: "GJ", type: "letter", preview: `When your dad was your age, he used to fall asleep on my chest just like you do now.` },
    { id: 7, monthOffset: 9, author: "Family Friend Sarah", initials: "FS", type: "letter", preview: `Your parents don't know this yet but they're the best parents I've ever seen.` },
    { id: 8, monthOffset: 12, author: "Mom & Dad", initials: "M&D", type: "video", preview: "Video Message", duration: "2:14" },
    { id: 9, monthOffset: 14, author: "Grandma Ruth", initials: "GR", type: "voice", preview: "Voice Recording", duration: "3:17" },
    { id: 10, monthOffset: 18, author: "Uncle James", initials: "UJ", type: "photo", preview: `You won't believe how small you were.` },
    { id: 11, monthOffset: 24, author: "Aunt Maria", initials: "AM", type: "letter", preview: `I hope you grow up knowing how fiercely you are loved.` },
    { id: 12, monthOffset: 30, author: "Grandpa Joe", initials: "GJ", type: "letter", preview: `Took you fishing today. You threw the rod in the lake. Best day of my life.` },
    { id: 13, monthOffset: 36, author: "Dad", initials: "D", type: "voice", preview: "Voice Recording", duration: "0:48" },
    { id: 14, monthOffset: 48, author: "Mom", initials: "M", type: "letter", preview: `You asked me where people go when they die. I didn't have a good answer. I'm still thinking about it.` },
    { id: 15, monthOffset: 60, author: "Grandma Ruth", initials: "GR", type: "letter", preview: `Five already. Slow down, baby.` },
    { id: 16, monthOffset: 72, author: "Family Friend Sarah", initials: "FS", type: "photo", preview: `Your birthday party. Pure chaos. Pure joy.` },
    { id: 17, monthOffset: 84, author: "Uncle James", initials: "UJ", type: "letter", preview: `You beat me at chess today. I wasn't going easy on you.` },
    { id: 18, monthOffset: 96, author: "Aunt Maria", initials: "AM", type: "voice", preview: "Voice Recording", duration: "1:34" },
    { id: 19, monthOffset: 120, author: "Grandpa Joe", initials: "GJ", type: "video", preview: "Video Message", duration: "2:45" },
    { id: 20, monthOffset: 144, author: "Mom & Dad", initials: "M&D", type: "letter", preview: `We're so proud of the person you're becoming, ${c}. Every single day.` },
    { id: 21, monthOffset: 156, author: "Grandma Ruth", initials: "GR", type: "letter", preview: `Thirteen years of letters. You'll understand someday.` },
    { id: 22, monthOffset: 168, author: "Dad", initials: "D", type: "letter", preview: `I still remember the weight of you in my arms. Fourteen years.` },
    { id: 23, monthOffset: 180, author: "Mom", initials: "M", type: "letter", preview: `Almost time. I hope you feel what I feel reading these back.` },
  ];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatMonthOffset(dob: string, monthOffset: number): string {
  if (!dob) {
    if (monthOffset < 12) return `Month ${monthOffset || 1}`;
    return `Year ${Math.floor(monthOffset / 12)}`;
  }
  const d = new Date(dob + "T00:00:00");
  d.setMonth(d.getMonth() + monthOffset);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function countUniquePeople(entries: SampleEntry[]): number {
  return new Set(entries.map(e => e.author)).size;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  letter: { icon: <FileText size={11} strokeWidth={1.5} />, label: "Letter" },
  voice: { icon: <Mic size={11} strokeWidth={1.5} />, label: "Voice Memo" },
  photo: { icon: <ImageIcon size={11} strokeWidth={1.5} />, label: "Photo" },
  video: { icon: <Video size={11} strokeWidth={1.5} />, label: "Video" },
};

// ─── Vault Entry Card ───────────────────────────────────────────────────────

function VaultEntryCard({ entry, visible, dob }: { entry: SampleEntry; visible: boolean; dob: string }) {
  const typeInfo = TYPE_CONFIG[entry.type];

  return (
    <div
      className="vault-entry-card"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      {/* Time label */}
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase",
        color: "rgba(200,168,122,0.6)", marginBottom: 10,
        fontFamily: "var(--font-body)",
      }}>
        {formatMonthOffset(dob, entry.monthOffset)}
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        {/* Avatar */}
        <div style={{
          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
          background: "rgba(200,168,122,0.12)", border: "1px solid rgba(200,168,122,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 600, color: "rgba(200,168,122,0.85)",
          fontFamily: "var(--font-body)", letterSpacing: "0.02em",
        }}>
          {entry.initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Author */}
          <p style={{
            fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 18, fontWeight: 400,
            fontStyle: "italic", color: "#FDFBF7", marginBottom: 6,
          }}>
            {entry.author}
          </p>

          {/* Content preview */}
          {entry.type === "letter" && (
            <p style={{
              fontSize: 13, color: "rgba(253,251,247,0.55)", lineHeight: 1.6,
              fontStyle: "italic", marginBottom: 10,
              overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            } as React.CSSProperties}>
              &ldquo;{entry.preview}&rdquo;
            </p>
          )}

          {entry.type === "voice" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(200,168,122,0.15)", border: "1px solid rgba(200,168,122,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Play size={12} color="rgba(200,168,122,0.9)" fill="rgba(200,168,122,0.9)" />
              </div>
              <span style={{ fontSize: 12, color: "rgba(253,251,247,0.45)" }}>
                {entry.preview} · {entry.duration}
              </span>
            </div>
          )}

          {entry.type === "photo" && (
            <div style={{ marginBottom: 10 }}>
              <div style={{
                width: "100%", height: 80, borderRadius: 8,
                background: "linear-gradient(135deg, rgba(200,168,122,0.08) 0%, rgba(107,143,111,0.08) 100%)",
                border: "1px solid rgba(253,251,247,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 6,
              }}>
                <ImageIcon size={20} color="rgba(253,251,247,0.2)" strokeWidth={1} />
              </div>
              <p style={{ fontSize: 12, color: "rgba(253,251,247,0.45)", fontStyle: "italic" }}>
                &ldquo;{entry.preview}&rdquo;
              </p>
            </div>
          )}

          {entry.type === "video" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(200,168,122,0.15)", border: "1px solid rgba(200,168,122,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Play size={12} color="rgba(200,168,122,0.9)" fill="rgba(200,168,122,0.9)" />
              </div>
              <span style={{ fontSize: 12, color: "rgba(253,251,247,0.45)" }}>
                {entry.preview} · {entry.duration}
              </span>
            </div>
          )}

          {/* Badges */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              border: "0.5px solid rgba(200,168,122,0.45)",
              borderRadius: 100, padding: "3px 10px",
              fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "rgba(200,168,122,0.9)", fontFamily: "var(--font-body)",
            }}>
              <Lock size={9} strokeWidth={2} />
              Sealed
            </span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              border: "0.5px solid rgba(253,251,247,0.15)",
              borderRadius: 100, padding: "3px 10px",
              fontSize: 10, letterSpacing: "0.05em", textTransform: "capitalize",
              color: "rgba(253,251,247,0.4)", fontFamily: "var(--font-body)",
            }}>
              {typeInfo.icon}
              {typeInfo.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Welcome Experience ────────────────────────────────────────────────

type Phase = "loading" | "reveal" | "vault" | "cta";

export default function WelcomeClient() {
  const params = useSearchParams();
  const router = useRouter();

  // Parse params
  const sessionId = params.get("session_id");
  const directFamilyId = params.get("familyId");
  const childParam = params.get("child");
  const dobParam = params.get("dob");
  const bypass = params.get("bypass") === "true";

  // State
  const [phase, setPhase] = useState<Phase>("loading");
  const [childName, setChildName] = useState(childParam || "");
  const [childDob, setChildDob] = useState(dobParam || "");
  const [familyId, setFamilyId] = useState(directFamilyId || "");
  const [visibleCount, setVisibleCount] = useState(0);
  const [voiceCounter, setVoiceCounter] = useState(0);
  const [showFinalText, setShowFinalText] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const vaultRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<{ timers: ReturnType<typeof setTimeout>[] }>({ timers: [] });

  const childFirst = (childName || "your child").split(" ")[0];
  const entries = getSampleEntries(childFirst);
  const uniquePeopleCount = countUniquePeople(entries);

  // Calculate vault open year
  const getVaultOpenYear = useCallback(() => {
    if (!childDob) return new Date().getFullYear() + 18;
    const dob = new Date(childDob + "T00:00:00");
    return dob.getFullYear() + 18;
  }, [childDob]);

  // Load data from Stripe session or params
  useEffect(() => {
    async function load() {
      if (bypass) {
        setChildName(childParam || "Oliver");
        setChildDob(dobParam || "2025-06-15");
        setFamilyId("demo");
        setPhase("reveal");
        return;
      }

      if (childParam) {
        setPhase("reveal");
        return;
      }

      if (directFamilyId && !childParam) {
        router.replace(`/${directFamilyId}/onboarding`);
        return;
      }

      if (!sessionId) {
        router.replace("/login");
        return;
      }

      try {
        const res = await fetch(`/api/stripe/session?session_id=${sessionId}`);
        if (res.ok) {
          const d = await res.json();
          setChildName(d.childName || "your child");
          setChildDob(d.childDob || "");
          setFamilyId(d.familyId || "");
          setPhase("reveal");
        } else {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
    }
    load();
  }, [sessionId, bypass, childParam, directFamilyId, dobParam, router]);

  // Phase: reveal → vault
  useEffect(() => {
    if (phase !== "reveal") return;
    const timer = setTimeout(() => setPhase("vault"), 2800);
    return () => clearTimeout(timer);
  }, [phase]);

  // Phase: vault — accelerating entry reveals + auto-scroll
  useEffect(() => {
    if (phase !== "vault" || skipped) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    animationRef.current.timers = timers;
    const total = entries.length;

    // Calculate accelerating delays
    // First 4: 800ms, then ramp down to 100ms
    function getDelay(index: number): number {
      if (index < 4) return 800;
      if (index < 8) return 500;
      if (index < 12) return 300;
      if (index < 16) return 200;
      return 100;
    }

    let cumulativeDelay = 0;
    for (let i = 0; i < total; i++) {
      cumulativeDelay += getDelay(i);
      const idx = i + 1;
      const t = setTimeout(() => {
        setVisibleCount(idx);
        setVoiceCounter(idx);

        // Auto-scroll — smooth at first, then instant as entries accelerate
        if (vaultRef.current) {
          requestAnimationFrame(() => {
            if (vaultRef.current) {
              vaultRef.current.scrollTo({
                top: vaultRef.current.scrollHeight,
                behavior: idx <= 4 ? "smooth" : "auto",
              });
            }
          });
        }
      }, cumulativeDelay);
      timers.push(t);
    }

    // Show final text after all entries
    const finalDelay = cumulativeDelay + 800;
    timers.push(setTimeout(() => setShowFinalText(true), finalDelay));

    // Transition to CTA
    timers.push(setTimeout(() => setPhase("cta"), finalDelay + 3000));

    return () => timers.forEach(clearTimeout);
  }, [phase, skipped, entries.length]);

  // Skip handler
  const handleSkip = useCallback(() => {
    animationRef.current.timers.forEach(clearTimeout);
    setSkipped(true);
    setPhase("cta");
  }, []);

  const dashboardPath = familyId && familyId !== "demo" ? `/${familyId}` : "/login";
  const circlePath = familyId && familyId !== "demo" ? `/${familyId}/circle` : "/login";

  const BG = "linear-gradient(160deg, #1C2B1E 0%, #142016 100%)";

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (phase === "loading") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: BG,
      }}>
        <p style={{ fontSize: 13, color: "rgba(253,251,247,0.4)", fontFamily: "var(--font-body)" }}>
          Preparing your vault…
        </p>
      </div>
    );
  }

  // ─── Reveal Phase ─────────────────────────────────────────────────────────

  if (phase === "reveal") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: BG, padding: "40px 24px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Skip */}
        <button onClick={handleSkip} style={{
          position: "absolute", top: 20, right: 20,
          background: "none", border: "none", color: "rgba(253,251,247,0.3)",
          fontSize: 13, cursor: "pointer", padding: "8px 12px",
          fontFamily: "var(--font-body)", zIndex: 10,
        }}>
          Skip
        </button>

        {/* Ambient glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 40%, rgba(200,168,122,0.08), transparent 70%)",
        }} />

        {/* Name reveal */}
        <div className="welcome-reveal" style={{ textAlign: "center", position: "relative" }}>
          <p style={{
            fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.25em", textTransform: "uppercase",
            color: "rgba(200,168,122,0.7)", marginBottom: 20,
          }}>
            THE VAULT
          </p>
          <h1 style={{
            fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(32px, 8vw, 48px)",
            fontWeight: 300, fontStyle: "italic",
            color: "#FDFBF7", lineHeight: 1.2,
            marginBottom: 12,
          }}>
            {childFirst}&apos;s Fable
          </h1>
          <div style={{
            width: 50, height: "0.5px",
            background: "rgba(200,168,122,0.5)",
            margin: "0 auto",
          }} />
        </div>

        <style>{revealStyles}</style>
      </div>
    );
  }

  // ─── Vault Phase ──────────────────────────────────────────────────────────

  if (phase === "vault") {
    return (
      <div style={{
        minHeight: "100vh", height: "100vh", display: "flex", flexDirection: "column",
        background: BG, position: "relative", overflow: "hidden",
      }}>
        {/* Skip */}
        <button onClick={handleSkip} style={{
          position: "absolute", top: 20, right: 20,
          background: "none", border: "none", color: "rgba(253,251,247,0.3)",
          fontSize: 13, cursor: "pointer", padding: "8px 12px",
          fontFamily: "var(--font-body)", zIndex: 20,
        }}>
          Skip
        </button>

        {/* Ambient glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 60% 10%, rgba(200,168,122,0.07), transparent 70%)",
          zIndex: 0,
        }} />

        {/* Voice counter */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          padding: "20px 24px 16px",
          background: "linear-gradient(180deg, #1C2B1E 60%, transparent)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{
              fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600,
              letterSpacing: "0.2em", textTransform: "uppercase",
              color: "rgba(200,168,122,0.9)",
            }}>
              {childFirst}&apos;s Vault
            </p>
            <p className="memory-counter" style={{
              fontFamily: "var(--font-body)", fontSize: 12,
              color: "rgba(200,168,122,0.7)",
            }}>
              {voiceCounter} {voiceCounter === 1 ? "voice" : "voices"}. Waiting for {childFirst}.
            </p>
          </div>
        </div>

        {/* Scrollable vault */}
        <div
          ref={vaultRef}
          style={{
            flex: 1, overflowY: "auto", padding: "0 20px 40px",
            position: "relative",
            scrollbarWidth: "none",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
            {entries.slice(0, visibleCount).map((entry, i) => (
              <VaultEntryCard key={entry.id} entry={entry} visible={true} dob={childDob} />
            ))}
          </div>

          {/* Final glowing text */}
          {showFinalText && (
            <div className="final-glow" style={{
              textAlign: "center", padding: "40px 20px", marginTop: 20,
            }}>
              <p style={{
                fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 22, fontWeight: 300,
                fontStyle: "italic", color: "#FDFBF7", lineHeight: 1.4,
              }}>
                Sealed: {entries.length} memories from {uniquePeopleCount} people who love {childFirst}.
              </p>
              <p style={{
                fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 18, fontWeight: 300,
                fontStyle: "italic", color: "rgba(200,168,122,0.7)", marginTop: 8,
              }}>
                Sealed until they&apos;re ready. Opening {getVaultOpenYear()}.
              </p>
            </div>
          )}
        </div>

        {/* Bottom gradient */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, height: 80,
          background: "linear-gradient(transparent, #142016)",
          pointerEvents: "none", zIndex: 5,
        }} />

        <style>{vaultStyles}</style>
      </div>
    );
  }

  // ─── CTA Phase ────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: BG, padding: "40px 24px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 30%, rgba(200,168,122,0.06), transparent 70%)",
      }} />

      <div className="cta-container" style={{
        textAlign: "center", maxWidth: 400, position: "relative", width: "100%",
      }}>
        {/* Lock icon */}
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(200,168,122,0.08)", border: "1px solid rgba(200,168,122,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 28px",
        }}>
          <Lock size={24} color="rgba(200,168,122,0.85)" strokeWidth={1.5} />
        </div>

        <p style={{
          fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600,
          letterSpacing: "0.2em", textTransform: "uppercase",
          color: "rgba(200,168,122,0.7)", marginBottom: 16,
        }}>
          {childFirst}&apos;s Vault
        </p>

        <h1 style={{
          fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "clamp(24px, 6vw, 32px)",
          fontWeight: 300, fontStyle: "italic",
          color: "#FDFBF7", lineHeight: 1.3, marginBottom: 12,
        }}>
          {childFirst}&apos;s vault is empty — for now.
        </h1>

        <p style={{
          fontSize: 13, color: "rgba(253,251,247,0.4)", lineHeight: 1.7,
          marginBottom: 40, fontFamily: "var(--font-body)",
        }}>
          It starts with one letter.
        </p>

        {/* Primary CTA */}
        <a
          href={dashboardPath}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            width: "100%", padding: "16px 24px", borderRadius: 12,
            background: "rgba(200,168,122,0.9)", color: "#1C2B1E",
            fontSize: 15, fontWeight: 600, textDecoration: "none",
            letterSpacing: "0.02em", fontFamily: "var(--font-body)",
            transition: "all 200ms",
          }}
        >
          <FileText size={16} strokeWidth={2} />
          Write your first letter to {childFirst}
        </a>

        {/* Secondary text link */}
        <Link
          href={circlePath}
          style={{
            display: "block", marginTop: 20,
            fontSize: 13, color: "rgba(200,168,122,0.6)",
            textDecoration: "none", fontFamily: "var(--font-body)",
          }}
        >
          or invite your circle →
        </Link>

        {/* Dashboard link */}
        <Link
          href={dashboardPath}
          style={{
            display: "block", marginTop: 16,
            fontSize: 12, color: "rgba(253,251,247,0.3)",
            textDecoration: "none", fontFamily: "var(--font-body)",
          }}
        >
          Go to dashboard →
        </Link>
      </div>

      <style>{ctaStyles}</style>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const revealStyles = `
  .welcome-reveal {
    animation: revealFadeIn 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes revealFadeIn {
    0% { opacity: 0; transform: scale(0.92); }
    100% { opacity: 1; transform: scale(1); }
  }
`;

const vaultStyles = `
  .vault-entry-card {
    padding: 20px;
    background: rgba(45,106,79,0.25);
    border: 1px solid rgba(253,251,247,0.06);
    border-radius: 14px;
    border-left: 3px solid rgba(200,168,122,0.4);
  }

  .memory-counter {
    transition: all 300ms ease;
  }

  .final-glow {
    animation: glowPulse 2s ease-in-out infinite alternate;
  }

  @keyframes glowPulse {
    0% { opacity: 0.7; }
    100% { opacity: 1; }
  }

  /* Hide scrollbar */
  div::-webkit-scrollbar {
    display: none;
  }
`;

const ctaStyles = `
  .cta-container {
    animation: ctaFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes ctaFadeUp {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  .cta-container a:hover {
    opacity: 0.9;
  }
`;
