"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, FileText, Mic, Video, Image as ImageIcon, Play } from "lucide-react";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SampleEntry {
  id: number;
  timeLabel: string;
  author: string;
  initials: string;
  type: "letter" | "voice" | "photo" | "video";
  preview: string;
  duration?: string;
}

// ─── Sample Data (child name injected dynamically) ──────────────────────────

function getSampleEntries(childName: string): SampleEntry[] {
  return [
    { id: 1, timeLabel: "Month 1", author: "Grandma Ruth", initials: "GR", type: "letter", preview: `The day you were born, I held you and whispered: you are the best thing that ever happened to us.` },
    { id: 2, timeLabel: "Month 3", author: "Uncle James", initials: "UJ", type: "voice", preview: "Voice Recording", duration: "0:42" },
    { id: 3, timeLabel: "Month 6", author: "Aunt Maria", initials: "AM", type: "photo", preview: `This is from the first time I held you.` },
    { id: 4, timeLabel: "Month 9", author: "Grandpa Joe", initials: "GJ", type: "letter", preview: `There's something I never told anyone about the night you were born...` },
    { id: 5, timeLabel: "Month 12", author: "Mom & Dad", initials: "M&D", type: "video", preview: "Video Message", duration: "1:23" },
    { id: 6, timeLabel: "Month 18", author: "Family Friend Sarah", initials: "FS", type: "letter", preview: `Your parents are the best people I know. Here's why...` },
    { id: 7, timeLabel: "Year 2", author: "Grandma Ruth", initials: "GR", type: "voice", preview: "Voice Recording", duration: "3:17" },
    { id: 8, timeLabel: "Year 3", author: "Uncle James", initials: "UJ", type: "photo", preview: `You won't believe how small you were` },
    { id: 9, timeLabel: "Year 5", author: "Aunt Maria", initials: "AM", type: "letter", preview: `I hope you grow up knowing how fiercely you are loved` },
    { id: 10, timeLabel: "Year 10", author: "Grandpa Joe", initials: "GJ", type: "video", preview: "Video Message", duration: "2:45" },
  ];
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  letter: { icon: <FileText size={11} strokeWidth={1.5} />, label: "Letter" },
  voice: { icon: <Mic size={11} strokeWidth={1.5} />, label: "Voice Memo" },
  photo: { icon: <ImageIcon size={11} strokeWidth={1.5} />, label: "Photo" },
  video: { icon: <Video size={11} strokeWidth={1.5} />, label: "Video" },
};

// ─── Vault Entry Card ───────────────────────────────────────────────────────

function VaultEntryCard({ entry, visible }: { entry: SampleEntry; visible: boolean }) {
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
        {entry.timeLabel}
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
            fontFamily: "var(--font-cormorant)", fontSize: 18, fontWeight: 400,
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
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
            }}>
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
            <div style={{
              display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
            }}>
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
  const [memoryCounter, setMemoryCounter] = useState(0);
  const [showOverlay1, setShowOverlay1] = useState(false);
  const [showOverlay2, setShowOverlay2] = useState(false);
  const [showFinalCounter, setShowFinalCounter] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const vaultRef = useRef<HTMLDivElement>(null);

  const childFirst = (childName || "your child").split(" ")[0];
  const entries = getSampleEntries(childFirst);

  // Calculate years until vault opens (age 18)
  const getYearsUntilOpen = useCallback(() => {
    if (!childDob) return 18;
    const dob = new Date(childDob + "T00:00:00");
    const now = new Date();
    const ageYears = (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.max(1, Math.round(18 - ageYears));
  }, [childDob]);

  // Load data from Stripe session or params
  useEffect(() => {
    async function load() {
      if (bypass) {
        setChildName(childParam || "Oliver");
        setFamilyId("demo");
        setPhase("reveal");
        return;
      }

      if (childParam) {
        // Came from signup with query params
        setPhase("reveal");
        return;
      }

      if (directFamilyId && !childParam) {
        // Old flow: redirect to onboarding (no child name in params)
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
  }, [sessionId, bypass, childParam, directFamilyId, router]);

  // Phase: reveal → vault (after name animation)
  useEffect(() => {
    if (phase !== "reveal") return;
    const timer = setTimeout(() => setPhase("vault"), 2800);
    return () => clearTimeout(timer);
  }, [phase]);

  // Phase: vault — animate entries appearing + auto-scroll
  useEffect(() => {
    if (phase !== "vault" || skipped) return;

    // Stagger entry reveals
    let count = 0;
    const revealInterval = setInterval(() => {
      count++;
      setVisibleCount(count);
      setMemoryCounter(count);

      // Scroll down smoothly
      if (vaultRef.current) {
        vaultRef.current.scrollTo({
          top: vaultRef.current.scrollHeight,
          behavior: "smooth",
        });
      }

      if (count >= entries.length) {
        clearInterval(revealInterval);
      }
    }, 600);

    // Show overlay text mid-scroll
    const overlay1Timer = setTimeout(() => setShowOverlay1(true), 2500);
    const overlay2Timer = setTimeout(() => setShowOverlay2(true), 4200);

    // Show final counter and transition to CTA
    const finalTimer = setTimeout(() => {
      setShowFinalCounter(true);
    }, entries.length * 600 + 400);

    const ctaTimer = setTimeout(() => {
      setPhase("cta");
    }, entries.length * 600 + 2500);

    return () => {
      clearInterval(revealInterval);
      clearTimeout(overlay1Timer);
      clearTimeout(overlay2Timer);
      clearTimeout(finalTimer);
      clearTimeout(ctaTimer);
    };
  }, [phase, skipped, entries.length]);

  // Skip handler
  const handleSkip = useCallback(() => {
    setSkipped(true);
    setPhase("cta");
  }, []);

  const dashboardPath = familyId ? `/${familyId}` : "/login";
  const circlePath = familyId ? `/${familyId}/circle` : "/login";

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (phase === "loading") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#1b4332",
      }}>
        <p style={{ fontSize: 13, color: "rgba(253,251,247,0.4)" }}>Preparing your vault…</p>
      </div>
    );
  }

  // ─── Reveal Phase ─────────────────────────────────────────────────────────

  if (phase === "reveal") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#1b4332", padding: "40px 24px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Skip */}
        <button onClick={handleSkip} style={{
          position: "absolute", top: 20, right: 20,
          background: "none", border: "none", color: "rgba(253,251,247,0.3)",
          fontSize: 13, cursor: "pointer", padding: "8px 12px",
          zIndex: 10,
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
            fontFamily: "var(--font-cormorant)", fontSize: "clamp(32px, 8vw, 48px)",
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
        minHeight: "100vh", display: "flex", flexDirection: "column",
        background: "#1b4332", position: "relative", overflow: "hidden",
      }}>
        {/* Skip */}
        <button onClick={handleSkip} style={{
          position: "absolute", top: 20, right: 20,
          background: "none", border: "none", color: "rgba(253,251,247,0.3)",
          fontSize: 13, cursor: "pointer", padding: "8px 12px",
          zIndex: 20,
        }}>
          Skip
        </button>

        {/* Ambient glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 60% 10%, rgba(200,168,122,0.07), transparent 70%)",
          zIndex: 0,
        }} />

        {/* Memory counter */}
        <div style={{
          position: "sticky", top: 0, zIndex: 10,
          padding: "20px 24px 16px",
          background: "linear-gradient(180deg, #1b4332 60%, transparent)",
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
              {memoryCounter} {memoryCounter === 1 ? "memory" : "memories"} sealed
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
            {entries.map((entry, i) => (
              <VaultEntryCard key={entry.id} entry={entry} visible={i < visibleCount} />
            ))}
          </div>

          {/* Final counter */}
          {showFinalCounter && (
            <div className="final-counter" style={{
              textAlign: "center", padding: "40px 20px", marginTop: 20,
            }}>
              <p style={{
                fontFamily: "var(--font-cormorant)", fontSize: 22, fontWeight: 300,
                fontStyle: "italic", color: "#FDFBF7", lineHeight: 1.4,
              }}>
                🔒 10 of ∞ memories sealed
              </p>
              <p style={{
                fontSize: 13, color: "rgba(200,168,122,0.7)", marginTop: 8,
              }}>
                {childFirst}&apos;s vault opens in {getYearsUntilOpen()} years
              </p>
            </div>
          )}
        </div>

        {/* Emotional copy overlays */}
        {showOverlay1 && (
          <div className="emotional-overlay" style={{
            position: "fixed", bottom: 100, left: 0, right: 0,
            textAlign: "center", padding: "0 30px",
            pointerEvents: "none", zIndex: 15,
          }}>
            <p style={{
              fontFamily: "var(--font-cormorant)", fontSize: 18, fontWeight: 300,
              fontStyle: "italic", color: "rgba(253,251,247,0.6)",
              textShadow: "0 2px 20px rgba(27,67,50,0.8)",
              lineHeight: 1.5,
            }}>
              This is what {childFirst}&apos;s vault will look like.
            </p>
          </div>
        )}
        {showOverlay2 && !showOverlay1 && (
          <div className="emotional-overlay" style={{
            position: "fixed", bottom: 100, left: 0, right: 0,
            textAlign: "center", padding: "0 30px",
            pointerEvents: "none", zIndex: 15,
          }}>
            <p style={{
              fontFamily: "var(--font-cormorant)", fontSize: 18, fontWeight: 300,
              fontStyle: "italic", color: "rgba(253,251,247,0.6)",
              textShadow: "0 2px 20px rgba(27,67,50,0.8)",
              lineHeight: 1.5,
            }}>
              Every month, the people who love them will add to it.
            </p>
          </div>
        )}

        {/* Bottom gradient */}
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, height: 80,
          background: "linear-gradient(transparent, #1b4332)",
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
      background: "#1b4332", padding: "40px 24px",
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
          fontFamily: "var(--font-cormorant)", fontSize: "clamp(24px, 6vw, 32px)",
          fontWeight: 300, fontStyle: "italic",
          color: "#FDFBF7", lineHeight: 1.3, marginBottom: 12,
        }}>
          Your vault is empty right now.
          <br />Let&apos;s change that.
        </h1>

        <p style={{
          fontSize: 13, color: "rgba(253,251,247,0.4)", lineHeight: 1.7,
          marginBottom: 40,
        }}>
          Everything you just saw is what {childFirst}&apos;s vault could look like.
          It starts with one letter.
        </p>

        {/* Primary CTA */}
        <a
          href={dashboardPath}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            width: "100%", padding: "16px 24px", borderRadius: 12,
            background: "rgba(200,168,122,0.9)", color: "#1b4332",
            fontSize: 15, fontWeight: 600, textDecoration: "none",
            letterSpacing: "0.02em",
            transition: "all 200ms",
          }}
        >
          <FileText size={16} strokeWidth={2} />
          Write your first letter to {childFirst}
        </a>

        {/* Secondary CTA */}
        <a
          href={circlePath}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            width: "100%", padding: "14px 24px", borderRadius: 12, marginTop: 12,
            background: "transparent",
            border: "1px solid rgba(200,168,122,0.3)",
            color: "rgba(200,168,122,0.85)",
            fontSize: 14, fontWeight: 500, textDecoration: "none",
            transition: "all 200ms",
          }}
        >
          Invite your first circle member
        </a>

        {/* Skip to dashboard */}
        <Link
          href={dashboardPath}
          style={{
            display: "block", marginTop: 24,
            fontSize: 12, color: "rgba(253,251,247,0.3)",
            textDecoration: "none",
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

  .final-counter {
    animation: glowPulse 2s ease-in-out infinite alternate;
  }

  @keyframes glowPulse {
    0% { opacity: 0.8; }
    100% { opacity: 1; }
  }

  .emotional-overlay {
    animation: overlayFade 1.5s ease forwards;
  }

  @keyframes overlayFade {
    0% { opacity: 0; transform: translateY(10px); }
    20% { opacity: 1; transform: translateY(0); }
    80% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-5px); }
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
