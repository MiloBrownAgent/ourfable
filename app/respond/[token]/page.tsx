"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";

type PageState =
  | { status: "loading" }
  | { status: "ready"; question_text: string; contributor_name: string; child_name: string }
  | { status: "already_answered" }
  | { status: "expired" }
  | { status: "not_found" }
  | { status: "submitted"; child_name: string; contributor_name: string }
  | { status: "error"; message: string };

export default function RespondPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";

  const [state, setState] = useState<PageState>({ status: "loading" });
  const [responseText, setResponseText] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!token) return;
    fetch(`/api/questions/respond?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (res.status === 409) return setState({ status: "already_answered" });
        if (res.status === 410) return setState({ status: "expired" });
        if (res.status === 404) return setState({ status: "not_found" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json().then((data) => {
          setState({
            status: "ready",
            question_text: data.question_text,
            contributor_name: data.contributor_name,
            child_name: data.child_name,
          });
        });
      })
      .catch((err) => {
        console.error(err);
        setState({ status: "error", message: "Something went wrong loading this question." });
      });
  }, [token]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!responseText.trim() || isPending) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/questions/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, response_text: responseText.trim() }),
        });

        if (res.status === 409) {
          setState({ status: "already_answered" });
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setState({
            status: "error",
            message: (data as { error?: string }).error ?? "Submission failed — please try again.",
          });
          return;
        }

        if (state.status === "ready") {
          setState({
            status: "submitted",
            child_name: state.child_name,
            contributor_name: state.contributor_name,
          });
        }
      } catch {
        setState({ status: "error", message: "Network error — please try again." });
      }
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <p style={styles.logo}>
            OurFable<span style={styles.logoSuffix}>.ai</span>
          </p>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {state.status === "loading" && (
            <div style={styles.center}>
              <p style={styles.subtle}>Loading your question…</p>
            </div>
          )}

          {state.status === "not_found" && (
            <div style={styles.center}>
              <p style={styles.emoji}>🔍</p>
              <h1 style={styles.heading}>Question not found</h1>
              <p style={styles.para}>
                This link may be invalid or has already been used.
              </p>
            </div>
          )}

          {state.status === "expired" && (
            <div style={styles.center}>
              <p style={styles.emoji}>⏰</p>
              <h1 style={styles.heading}>This question has expired</h1>
              <p style={styles.para}>
                You&apos;ll receive a new question next month. We&apos;d love to hear your story then.
              </p>
            </div>
          )}

          {state.status === "already_answered" && (
            <div style={styles.center}>
              <p style={styles.emoji}>✅</p>
              <h1 style={styles.heading}>Already answered</h1>
              <p style={styles.para}>
                Your response is safely stored in the vault. Thank you — it means a lot.
              </p>
            </div>
          )}

          {state.status === "error" && (
            <div style={styles.center}>
              <p style={styles.emoji}>⚠️</p>
              <h1 style={styles.heading}>Something went wrong</h1>
              <p style={styles.para}>{state.message}</p>
            </div>
          )}

          {state.status === "submitted" && (
            <div style={styles.center}>
              <p style={styles.emoji}>📬</p>
              <h1 style={styles.heading}>Received. ✓</h1>
              <p style={styles.para}>
                {state.contributor_name.split(" ")[0]}, your words are in the vault.
              </p>
              <p style={styles.para}>
                One day, <strong>{state.child_name}</strong> will sit down and read what
                the people who loved them wrote when they were small. Your answer will be there.
              </p>
              <div style={styles.vaultBadge}>
                🔒 Stored privately in {state.child_name}&apos;s family vault
              </div>
              <p style={styles.closing}>Thank you for taking the time. It matters more than you know.</p>
            </div>
          )}

          {state.status === "ready" && (
            <>
              <p style={styles.greeting}>
                Hi {state.contributor_name.split(" ")[0]},
              </p>
              <p style={styles.intro}>
                You&apos;re part of{" "}
                <strong>{state.child_name}</strong>&apos;s family vault — a private collection
                of voices from the people who love them most. Each month you&apos;ll get one
                question. Your answer goes straight into the vault.{" "}
                <strong>{state.child_name}</strong> will read it when they&apos;re older.
              </p>

              <div style={styles.questionBox}>
                <p style={styles.questionLabel}>This month&apos;s question</p>
                <p style={styles.questionText}>&ldquo;{state.question_text}&rdquo;</p>
              </div>

              <form onSubmit={handleSubmit}>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder={`Write your answer here… Take your time. There are no wrong answers.`}
                  required
                  disabled={isPending}
                  style={styles.textarea}
                  rows={7}
                  maxLength={10000}
                />
                <p style={styles.charCount}>
                  {responseText.length.toLocaleString()} / 10,000
                </p>
                <button
                  type="submit"
                  disabled={isPending || responseText.trim().length === 0}
                  style={{
                    ...styles.button,
                    ...(isPending || responseText.trim().length === 0
                      ? styles.buttonDisabled
                      : {}),
                  }}
                >
                  {isPending ? "Saving…" : "Add to the vault →"}
                </button>
              </form>

              <p style={styles.footer}>
                Your response is private. Only <strong>{state.child_name}</strong>&apos;s family can
                read it.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #F3E8FF 0%, #FFF0E6 50%, #E0F2FE 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    fontFamily: "'Georgia', serif",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 8px 30px rgba(74,29,150,0.12)",
    width: "100%",
    maxWidth: "560px",
  },
  header: {
    background: "linear-gradient(135deg, #4A1D96 0%, #6D28D9 50%, #EC4899 100%)",
    padding: "28px 40px 22px",
    textAlign: "center",
  },
  logo: {
    fontSize: "22px",
    fontWeight: 800,
    color: "#ffffff",
    margin: 0,
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  logoSuffix: {
    fontWeight: 400,
    fontSize: "14px",
    opacity: 0.8,
  },
  body: {
    padding: "36px 40px 40px",
  },
  center: {
    textAlign: "center",
  },
  emoji: {
    fontSize: "48px",
    margin: "0 0 12px",
    lineHeight: 1,
  },
  heading: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#4A1D96",
    margin: "0 0 12px",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  para: {
    fontSize: "16px",
    color: "#3D3D50",
    lineHeight: 1.7,
    margin: "0 0 16px",
  },
  vaultBadge: {
    background: "linear-gradient(135deg, #F3E8FF, #E0F2FE)",
    borderRadius: "12px",
    padding: "14px 20px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#4A1D96",
    margin: "20px 0",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  closing: {
    fontSize: "15px",
    color: "#6B6B85",
    lineHeight: 1.6,
    fontStyle: "italic",
    margin: "16px 0 0",
  },
  subtle: {
    fontSize: "15px",
    color: "#9090A8",
    fontStyle: "italic",
  },
  greeting: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#4A1D96",
    margin: "0 0 12px",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  intro: {
    fontSize: "15px",
    color: "#3D3D50",
    lineHeight: 1.7,
    margin: "0 0 24px",
  },
  questionBox: {
    background: "linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%)",
    borderLeft: "4px solid #6D28D9",
    borderRadius: "0 12px 12px 0",
    padding: "20px 24px",
    margin: "0 0 28px",
  },
  questionLabel: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#6D28D9",
    margin: "0 0 8px",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  questionText: {
    fontSize: "20px",
    color: "#2D2D45",
    lineHeight: 1.5,
    margin: 0,
    fontStyle: "italic",
  },
  textarea: {
    width: "100%",
    borderRadius: "12px",
    border: "2px solid #E9D5FF",
    padding: "16px",
    fontSize: "16px",
    lineHeight: 1.6,
    color: "#2D2D45",
    fontFamily: "'Georgia', serif",
    resize: "vertical" as const,
    outline: "none",
    boxSizing: "border-box" as const,
    background: "#FDFAFF",
    transition: "border-color 0.2s",
  },
  charCount: {
    fontSize: "12px",
    color: "#9090A8",
    textAlign: "right" as const,
    margin: "6px 0 16px",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  button: {
    width: "100%",
    background: "linear-gradient(135deg, #4A1D96 0%, #7C3AED 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: "12px",
    padding: "16px",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    transition: "opacity 0.2s",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  footer: {
    fontSize: "13px",
    color: "#9090A8",
    textAlign: "center" as const,
    margin: "20px 0 0",
    lineHeight: 1.5,
  },
};
