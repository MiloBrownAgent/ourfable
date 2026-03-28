"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import WritingBlock from "@/components/WritingBlock";
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Sparkles,
  Users,
  PenLine,
  Heart,
} from "lucide-react";

interface CircleMember {
  name: string;
  email: string;
  relationship: string;
}

interface FamilyData {
  childName: string;
  familyName?: string;
}

const RELATIONSHIPS = [
  "Grandma",
  "Grandpa",
  "Aunt",
  "Uncle",
  "Godparent",
  "Family friend",
  "Other",
];

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const familyId = params.family as string;

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);
  const [family, setFamily] = useState<FamilyData | null>(null);
  const [loading, setLoading] = useState(true);

  // Step 2: Child details
  const [childFullName, setChildFullName] = useState("");
  const [childDob, setChildDob] = useState("");

  // Step 4: Circle members
  const [members, setMembers] = useState<CircleMember[]>([
    { name: "", email: "", relationship: "" },
  ]);

  // Derive child first name
  const childFirst =
    family?.childName?.split(" ")[0] ||
    childFullName.split(" ")[0] ||
    searchParams.get("child") ||
    "your child";

  useEffect(() => {
    async function loadFamily() {
      try {
        const res = await fetch("/api/ourfable/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "ourfable:getFamily",
            args: { familyId },
          }),
        });
        const data = await res.json();
        if (data?.value) {
          setFamily(data.value);
          if (data.value.childName) {
            setChildFullName(data.value.childName);
          }
        }
      } catch {
        // Fallback — continue without family data
      }
      setLoading(false);
    }
    loadFamily();
  }, [familyId]);

  function goTo(nextStep: number) {
    if (animating) return;
    setDirection(nextStep > step ? "forward" : "back");
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 200);
  }

  function updateMember(
    index: number,
    field: keyof CircleMember,
    value: string
  ) {
    setMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  }

  function addMember() {
    if (members.length >= 10) return;
    setMembers((prev) => [...prev, { name: "", email: "", relationship: "" }]);
  }

  function removeMember(index: number) {
    if (members.length <= 1) return;
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
        }}
      >
        <p style={{ fontSize: 13, color: "var(--text-3)" }}>
          Setting things up…
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        padding: "0 16px",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          paddingTop: 48,
          paddingBottom: 80,
        }}
      >
        {/* Wordmark */}
        <p
          className="font-display"
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--green)",
            letterSpacing: "-0.01em",
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          Our Fable
        </p>

        {/* Progress indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              style={{
                width: s === step ? 28 : 10,
                height: 10,
                borderRadius: 5,
                background:
                  s < step
                    ? "var(--green)"
                    : s === step
                    ? "var(--green)"
                    : "var(--border)",
                opacity: s < step ? 0.5 : 1,
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-4)",
            textAlign: "center",
            marginBottom: 40,
            letterSpacing: "0.04em",
          }}
        >
          Step {step} of {TOTAL_STEPS}
        </p>

        {/* Step content with fade */}
        <div
          style={{
            opacity: animating ? 0 : 1,
            transform: animating
              ? direction === "forward"
                ? "translateY(12px)"
                : "translateY(-12px)"
              : "translateY(0)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
          }}
        >
          {/* ─── Step 1: Welcome ─── */}
          {step === 1 && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "var(--green-light)",
                  border: "1px solid var(--green-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 28px",
                }}
              >
                <Heart size={28} color="var(--green)" />
              </div>

              <h1
                className="font-display"
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
                  fontWeight: 700,
                  color: "var(--green)",
                  marginBottom: 16,
                  lineHeight: 1.3,
                }}
              >
                Welcome to Our Fable
              </h1>

              <p
                style={{
                  fontSize: 16,
                  color: "var(--text-2)",
                  lineHeight: 1.7,
                  maxWidth: 400,
                  margin: "0 auto 40px",
                }}
              >
                {childFirst !== "your child"
                  ? `Let's set up ${childFirst}'s vault.`
                  : "Let's set up your child's vault."}
              </p>

              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-3)",
                  lineHeight: 1.8,
                  maxWidth: 380,
                  margin: "0 auto 44px",
                }}
              >
                A vault is a private, sealed collection of letters, photos, and
                voice memos from the people who love{" "}
                {childFirst !== "your child" ? childFirst : "them"} most —
                saved for the day they&apos;re ready to read them.
              </p>

              <button
                onClick={() => goTo(2)}
                className="btn-primary"
                style={{
                  padding: "14px 32px",
                  fontSize: 15,
                  borderRadius: 100,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                Get started <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ─── Step 2: Child Details ─── */}
          {step === 2 && (
            <div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "var(--green-light)",
                  border: "1px solid var(--green-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <Sparkles size={24} color="var(--gold)" />
              </div>

              <h1
                className="font-display"
                style={{
                  fontSize: "clamp(1.5rem, 4vw, 2rem)",
                  fontWeight: 700,
                  textAlign: "center",
                  marginBottom: 12,
                  lineHeight: 1.3,
                }}
              >
                Who is this vault for?
              </h1>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--text-3)",
                  textAlign: "center",
                  lineHeight: 1.7,
                  marginBottom: 32,
                  maxWidth: 400,
                  margin: "0 auto 32px",
                }}
              >
                Tell us about your child so we can personalize their vault.
              </p>

              <div
                style={{
                  background: "var(--card)",
                  border: "1.5px solid var(--border)",
                  borderRadius: 16,
                  padding: "28px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-3)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    Child&apos;s full name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Soren Thomas"
                    value={childFullName}
                    onChange={(e) => setChildFullName(e.target.value)}
                    style={{
                      width: "100%",
                      fontSize: 15,
                      padding: "12px 16px",
                      borderRadius: "var(--radius)",
                      border: "1.5px solid var(--border)",
                      background: "var(--bg)",
                      color: "var(--text)",
                      fontFamily: "var(--font-body)",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-3)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    Date of birth
                  </label>
                  <input
                    type="date"
                    value={childDob}
                    onChange={(e) => setChildDob(e.target.value)}
                    style={{
                      width: "100%",
                      fontSize: 15,
                      padding: "12px 16px",
                      borderRadius: "var(--radius)",
                      border: "1.5px solid var(--border)",
                      background: "var(--bg)",
                      color: childDob ? "var(--text)" : "var(--text-4)",
                      fontFamily: "var(--font-body)",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-3)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    Photo{" "}
                    <span
                      style={{
                        fontWeight: 400,
                        textTransform: "none",
                        color: "var(--text-4)",
                      }}
                    >
                      (optional)
                    </span>
                  </label>
                  <div
                    style={{
                      width: "100%",
                      padding: "20px",
                      borderRadius: "var(--radius)",
                      border: "1.5px dashed var(--border)",
                      background: "var(--bg)",
                      textAlign: "center",
                      color: "var(--text-4)",
                      fontSize: 13,
                    }}
                  >
                    Coming soon
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 32,
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={() => goTo(1)}
                  className="btn-ghost"
                  style={{
                    padding: "14px 20px",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={() => goTo(3)}
                  className="btn-primary"
                  style={{
                    padding: "14px 28px",
                    fontSize: 15,
                    borderRadius: 100,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 3: Your First Letter ─── */}
          {step === 3 && (
            <div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "var(--green-light)",
                  border: "1px solid var(--green-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <PenLine size={24} color="var(--green)" />
              </div>

              <h1
                className="font-display"
                style={{
                  fontSize: "clamp(1.5rem, 4vw, 2rem)",
                  fontWeight: 700,
                  textAlign: "center",
                  marginBottom: 12,
                  lineHeight: 1.3,
                }}
              >
                Write your first letter to {childFirst}
              </h1>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--text-3)",
                  textAlign: "center",
                  lineHeight: 1.7,
                  marginBottom: 32,
                  maxWidth: 400,
                  margin: "0 auto 32px",
                }}
              >
                Start the vault with something from you. A few sentences is
                plenty — you can always write more later.
              </p>

              <WritingBlock
                childFirst={childFirst}
                familyId={familyId}
              />

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 28,
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={() => goTo(2)}
                  className="btn-ghost"
                  style={{
                    padding: "14px 20px",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={() => goTo(4)}
                  className="btn-primary"
                  style={{
                    padding: "14px 28px",
                    fontSize: 15,
                    borderRadius: 100,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>

              <button
                onClick={() => goTo(4)}
                className="btn-ghost"
                style={{
                  display: "block",
                  margin: "12px auto 0",
                  fontSize: 13,
                }}
              >
                You can skip this for now
              </button>
            </div>
          )}

          {/* ─── Step 4: Invite Your Circle ─── */}
          {step === 4 && (
            <div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "var(--green-light)",
                  border: "1px solid var(--green-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <Users size={24} color="var(--green)" />
              </div>

              <h1
                className="font-display"
                style={{
                  fontSize: "clamp(1.5rem, 4vw, 2rem)",
                  fontWeight: 700,
                  textAlign: "center",
                  marginBottom: 12,
                  lineHeight: 1.3,
                }}
              >
                Who should write to {childFirst}?
              </h1>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--text-3)",
                  textAlign: "center",
                  lineHeight: 1.7,
                  marginBottom: 32,
                  maxWidth: 400,
                  margin: "0 auto 32px",
                }}
              >
                Grandparents, godparents, family friends — anyone whose words
                are worth preserving.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {members.map((member, i) => (
                  <div
                    key={i}
                    style={{
                      background: "var(--card)",
                      border: "1.5px solid var(--border)",
                      borderRadius: 16,
                      padding: "20px",
                      position: "relative",
                    }}
                  >
                    {members.length > 1 && (
                      <button
                        onClick={() => removeMember(i)}
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-4)",
                          padding: 4,
                        }}
                      >
                        <X size={16} />
                      </button>
                    )}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Name"
                        value={member.name}
                        onChange={(e) =>
                          updateMember(i, "name", e.target.value)
                        }
                        style={{
                          fontSize: 14,
                          padding: "10px 14px",
                          borderRadius: "var(--radius)",
                          border: "1.5px solid var(--border)",
                          background: "var(--bg)",
                          color: "var(--text)",
                          fontFamily: "var(--font-body)",
                          outline: "none",
                        }}
                      />
                      <select
                        value={member.relationship}
                        onChange={(e) =>
                          updateMember(i, "relationship", e.target.value)
                        }
                        style={{
                          fontSize: 14,
                          padding: "10px 14px",
                          background: "var(--bg)",
                          border: "1.5px solid var(--border)",
                          borderRadius: "var(--radius)",
                          color: member.relationship
                            ? "var(--text)"
                            : "var(--text-4)",
                          fontFamily: "var(--font-body)",
                          outline: "none",
                        }}
                      >
                        <option value="">Relationship</option>
                        {RELATIONSHIPS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={member.email}
                      onChange={(e) =>
                        updateMember(i, "email", e.target.value)
                      }
                      style={{
                        width: "100%",
                        fontSize: 14,
                        padding: "10px 14px",
                        borderRadius: "var(--radius)",
                        border: "1.5px solid var(--border)",
                        background: "var(--bg)",
                        color: "var(--text)",
                        fontFamily: "var(--font-body)",
                        outline: "none",
                      }}
                    />
                  </div>
                ))}
              </div>

              {members.length < 10 && (
                <button
                  onClick={addMember}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    margin: "16px auto 0",
                    background: "none",
                    border: "none",
                    color: "var(--green)",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                    padding: "8px 0",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <Plus size={16} /> Add another person
                </button>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 32,
                  justifyContent: "center",
                }}
              >
                <button
                  onClick={() => goTo(3)}
                  className="btn-ghost"
                  style={{
                    padding: "14px 20px",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  onClick={() => goTo(5)}
                  className="btn-primary"
                  style={{
                    padding: "14px 28px",
                    fontSize: 15,
                    borderRadius: 100,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  Continue <ArrowRight size={16} />
                </button>
              </div>

              <button
                onClick={() => goTo(5)}
                className="btn-ghost"
                style={{
                  display: "block",
                  margin: "12px auto 0",
                  fontSize: 13,
                }}
              >
                I&apos;ll do this later
              </button>
            </div>
          )}

          {/* ─── Step 5: Done ─── */}
          {step === 5 && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "var(--green-light)",
                  border: "1px solid var(--green-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 28px",
                }}
              >
                <Sparkles size={28} color="var(--gold)" />
              </div>

              <h1
                className="font-display"
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
                  fontWeight: 700,
                  marginBottom: 16,
                  lineHeight: 1.3,
                }}
              >
                You&apos;re all set.
              </h1>

              <p
                style={{
                  fontSize: 16,
                  color: "var(--text-2)",
                  lineHeight: 1.7,
                  maxWidth: 380,
                  margin: "0 auto 40px",
                }}
              >
                {childFirst !== "your child"
                  ? `${childFirst}'s vault is ready.`
                  : "The vault is ready."}
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  textAlign: "left",
                  maxWidth: 400,
                  margin: "0 auto 40px",
                }}
              >
                {[
                  {
                    emoji: "📬",
                    title: "Circle members get their first prompt",
                    desc: "We'll send a personalized question to each person you added — all they have to do is respond.",
                  },
                  {
                    emoji: "📅",
                    title: "New prompts go out every month",
                    desc: `Each month, ${childFirst}'s circle gets a new question. The vault grows on its own.`,
                  },
                  {
                    emoji: "",
                    title: `Everything stays sealed until ${childFirst} is ready`,
                    desc: "Letters, photos, voice memos — all locked until the milestone you chose.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 16,
                      alignItems: "flex-start",
                      background: "var(--card)",
                      border: "1.5px solid var(--border)",
                      borderRadius: 16,
                      padding: "20px",
                    }}
                  >
                    <span style={{ fontSize: 24, flexShrink: 0 }}>
                      {item.emoji}
                    </span>
                    <div>
                      <p
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          marginBottom: 4,
                          color: "var(--text)",
                        }}
                      >
                        {item.title}
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          color: "var(--text-3)",
                          lineHeight: 1.6,
                        }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href={`/${familyId}`}
                className="btn-primary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 32px",
                  fontSize: 15,
                  borderRadius: 100,
                  textDecoration: "none",
                }}
              >
                Go to dashboard <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
