"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const params = useSearchParams();
  const redirectTo = params.get("redirect") ?? "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // 2FA state
  const [needs2fa, setNeeds2fa] = useState(false);
  const [familyId2fa, setFamilyId2fa] = useState("");
  const [email2fa, setEmail2fa] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [verifying2fa, setVerifying2fa] = useState(false);
  const [twoFaError, setTwoFaError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, redirect: redirectTo || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.requires2fa) {
          setNeeds2fa(true);
          setFamilyId2fa(data.familyId);
          setEmail2fa(data.email ?? email.trim().toLowerCase());
          setChallengeToken(data.challengeToken ?? "");
          setLoading(false);
        } else {
          window.location.href = data.redirect;
        }
      } else {
        setAttempts((a) => a + 1);
        setError(res.status === 429 ? data.error : data.error ?? "Incorrect email or password.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  async function submit2fa(e: React.FormEvent) {
    e.preventDefault();
    if (!totpCode.trim()) return;
    setVerifying2fa(true);
    setTwoFaError("");

    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: familyId2fa,
          email: email2fa,
          code: totpCode,
          rememberDevice,
          challengeToken,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = data.redirect;
      } else {
        setTwoFaError(data.error ?? "Invalid code");
        setVerifying2fa(false);
      }
    } catch {
      setTwoFaError("Something went wrong. Try again.");
      setVerifying2fa(false);
    }
  }

  // 2FA verification screen
  if (needs2fa) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ width: 56, height: 56, border: "1.5px solid var(--green-border)", borderRadius: "50%", background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Lock size={20} color="var(--green)" />
            </div>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
              Two-factor authentication
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>
              Enter the 6-digit code from your authenticator app.
            </p>
          </div>

          <form onSubmit={submit2fa} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input
              type="text"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              placeholder="000000"
              autoFocus
              autoComplete="one-time-code"
              inputMode="numeric"
              style={{ fontSize: 28, textAlign: "center", letterSpacing: "0.4em", padding: "14px 20px" }}
            />

            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "var(--green)" }}
              />
              <span style={{ fontSize: 13, color: "var(--text-3)" }}>Remember this device for 30 days</span>
            </label>

            {twoFaError && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(196,96,96,0.08)", border: "1px solid rgba(196,96,96,0.2)", borderRadius: 8 }}>
                <Lock size={13} color="var(--red)" strokeWidth={2} />
                <p style={{ fontSize: 13, color: "var(--red)" }}>{twoFaError}</p>
              </div>
            )}

            <button type="submit" disabled={verifying2fa || totpCode.length < 6} className="btn-primary"
              style={{ padding: "14px 24px", fontSize: 14 }}>
              {verifying2fa ? "Verifying…" : "Verify"}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: "center" }}>
            <button
              onClick={() => { setNeeds2fa(false); setTotpCode(""); setTwoFaError(""); setChallengeToken(""); }}
              style={{ background: "none", border: "none", fontSize: 13, color: "var(--text-3)", cursor: "pointer", fontFamily: "inherit" }}
            >
              ← Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg)" }}>

      {/* Left panel — desktop only */}
      <div style={{
        flex: "0 0 480px", display: "none",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 64, position: "relative", overflow: "hidden",
      }} className="login-panel">
        <div className="dot-grid" style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 400, height: 400, background: "radial-gradient(circle, rgba(200,169,106,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", textAlign: "center", maxWidth: 320 }}>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 40, fontWeight: 700, color: "var(--text)", letterSpacing: "0.02em", marginBottom: 16, lineHeight: 1.2 }}>
            Our Fable
          </p>
          <div style={{ width: 40, height: 1, background: "var(--gold)", margin: "0 auto 20px" }} />
          <p style={{ fontSize: 13, color: "var(--text-3)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 32 }}>
            Private · Permanent · Personal
          </p>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 400, fontStyle: "italic", color: "var(--text-2)", lineHeight: 1.7 }}>
            The people who love your child won&apos;t always be here. Their words will be.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative" }}>
        <div className="dot-grid hide-desktop" style={{ position: "absolute", inset: 0, opacity: 0.5 }} />

        <div style={{ width: "100%", maxWidth: 360, position: "relative" }}>
          {/* Mobile wordmark */}
          <div className="hide-desktop" style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--green)", letterSpacing: "-0.01em", marginBottom: 8 }}>Our Fable</p>
            <p style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Private · Permanent · Personal</p>
          </div>

          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 26, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
              Welcome back.
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>Sign in to your family vault.</p>
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Email */}
            <div>
              <label htmlFor="login-email" style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                autoComplete="email"
                style={{ fontSize: 15 }}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your family password"
                  autoComplete="current-password"
                  style={{ paddingRight: 44, fontSize: 15 }}
                />
                <button type="button" onClick={() => setShow((v) => !v)} className="btn-ghost"
                  aria-label={show ? "Hide password" : "Show password"}
                  style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", padding: 8 }}>
                  {show ? <EyeOff size={15} strokeWidth={1.5} aria-hidden="true" /> : <Eye size={15} strokeWidth={1.5} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(196,96,96,0.08)", border: "1px solid rgba(196,96,96,0.2)", borderRadius: 8 }}>
                <Lock size={13} color="var(--red)" strokeWidth={2} aria-hidden="true" />
                <p style={{ fontSize: 13, color: "var(--red)" }}>{error}</p>
              </div>
            )}

            {attempts >= 3 && !error && (
              <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center" }}>
                Need help? Contact whoever set up this vault.
              </p>
            )}

            <button type="submit" disabled={loading || !email.trim() || !password.trim()} className="btn-primary"
              style={{ padding: "14px 24px", fontSize: 14, marginTop: 4 }}>
              {loading ? "Signing in…" : <><span>Sign in</span> <ArrowRight size={14} strokeWidth={2} aria-hidden="true" /></>}
            </button>
          </form>

          <div style={{ marginTop: 12, textAlign: "center" }}>
            <Link href="/forgot-password" style={{ fontSize: 13, color: "var(--text-3)", textDecoration: "none", padding: "12px 0", display: "inline-block" }}>
              Forgot password?
            </Link>
          </div>

          <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>
              Don&apos;t have an account?{" "}
              <Link href="/signup" style={{ color: "var(--green)", textDecoration: "none" }}>Sign up</Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) { .login-panel { display: flex !important; } }
      `}</style>
    </div>
  );
}

export default function LoginClient() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
