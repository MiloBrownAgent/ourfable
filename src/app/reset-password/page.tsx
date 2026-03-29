"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Lock, Shield, AlertTriangle, Key } from "lucide-react";
import Link from "next/link";
import {
  hashRecoveryCode,
  unwrapFamilyKeyWithRecoveryCode,
} from "@/lib/recovery-codes";
import {
  deriveKeyEncryptionKey,
  wrapFamilyKey,
  generateSalt,
  exportKey,
  importKey,
} from "@/lib/vault-encryption";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://rightful-eel-502.convex.cloud";

// Route through the data proxy (which handles auth + routes to Convex internal gateway)
async function convexQuery(path: string, args: Record<string, unknown>) {
  const res = await fetch("/api/ourfable/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.value ?? null;
}

async function convexMutation(path: string, args: Record<string, unknown>) {
  const res = await fetch("/api/ourfable/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, type: "mutation" }),
  });
  const data = await res.json();
  return data.value ?? data;
}

type ResetStep = "password" | "vault-recovery" | "vault-warning";

interface RecoveryInfo {
  familyId: string;
  hasEncryption: boolean;
  encryptedFamilyKey: string | null;
  keySalt: string | null;
  hasRecoveryCodes: boolean;
  recoveryCodesRemaining: number;
  hasGuardian: boolean;
  guardianEmails: string[];
}

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Vault recovery state
  const [step, setStep] = useState<ResetStep>("password");
  const [recoveryInfo, setRecoveryInfo] = useState<RecoveryInfo | null>(null);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryVerified, setRecoveryVerified] = useState(false);
  const [unwrappedKeyB64, setUnwrappedKeyB64] = useState<string | null>(null);
  const [confirmLoss, setConfirmLoss] = useState("");

  const canSubmit = password.length >= 6 && password === confirm && !!token;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    try {
      // Check if vault recovery is needed (first submission)
      if (step === "password" && email) {
        const info = await convexQuery("ourfable:getRecoveryInfo", { email }) as RecoveryInfo | null;
        if (info?.hasEncryption) {
          setRecoveryInfo(info);
          if (info.hasRecoveryCodes && info.recoveryCodesRemaining > 0) {
            setStep("vault-recovery");
          } else if (info.hasGuardian) {
            setStep("vault-recovery");
          } else {
            setStep("vault-warning");
          }
          setLoading(false);
          return;
        }
      }

      await performReset();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  async function performReset() {
    setLoading(true);
    setError("");

    try {
      // Reset the password
      const res = await fetch("/api/auth/reset-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      // If we have an unwrapped key, re-wrap with new password
      if (unwrappedKeyB64 && recoveryInfo) {
        try {
          const familyKey = await importKey(unwrappedKeyB64);
          const newSalt = generateSalt();
          const newKek = await deriveKeyEncryptionKey(password, newSalt);
          const newWrapped = await wrapFamilyKey(familyKey, newKek);

          await fetch("/api/auth/vault-recovery", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "updateEncryptedFamilyKey",
              familyId: recoveryInfo.familyId,
              encryptedFamilyKey: JSON.stringify(newWrapped),
              keySalt: newSalt,
            }),
          });
        } catch (err) {
          console.error("Failed to re-wrap family key:", err);
          // Password was still reset, just key re-wrap failed
        }
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Try again.");
    }
    setLoading(false);
  }

  async function verifyRecoveryCodeHandler() {
    if (!recoveryCode.trim() || !recoveryInfo) return;
    setLoading(true);
    setError("");

    try {
      // H3: Pass keySalt for PBKDF2 hashing
      const codeHash = await hashRecoveryCode(recoveryCode.trim(), recoveryInfo.keySalt ?? undefined);

      // Verify and consume the code
      const recoveryRes = await fetch("/api/auth/vault-recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verifyAndConsumeRecoveryCode",
          familyId: recoveryInfo.familyId,
          codeHash,
        }),
      });
      if (!recoveryRes.ok) throw new Error("Invalid recovery code");
      const recoveryData = await recoveryRes.json();
      const result = recoveryData.value as { wrappedFamilyKey: string | null; encryptedFamilyKey: string | null; keySalt: string | null };

      if (result.wrappedFamilyKey && result.keySalt) {
        // Unwrap family key with recovery code
        const familyKey = await unwrapFamilyKeyWithRecoveryCode(
          result.wrappedFamilyKey,
          recoveryCode.trim(),
          result.keySalt
        );
        const keyB64 = await exportKey(familyKey);
        setUnwrappedKeyB64(keyB64);
      }

      setRecoveryVerified(true);
      setError("");
    } catch (err) {
      console.error("Recovery code verification failed:", err);
      setError("Invalid or already used recovery code. Please try another.");
    }
    setLoading(false);
  }

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
        <div style={{ maxWidth: 360, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Lock size={22} color="var(--text-3)" strokeWidth={1.5} />
          </div>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>
            Invalid reset link
          </p>
          <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7 }}>
            This password reset link is missing or invalid.{" "}
            <Link href="/login" style={{ color: "var(--green)", textDecoration: "none" }}>Back to sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
        <div style={{ maxWidth: 360, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--green-light)", border: "1.5px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <Check size={22} color="var(--green)" strokeWidth={2} />
          </div>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>
            Password updated.
          </p>
          <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7, marginBottom: 24 }}>
            {recoveryVerified
              ? "Your password has been reset and your vault key has been re-encrypted with your new password."
              : "Your password has been reset. You can now sign in with your new password."}
          </p>
          <Link href="/login" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--green)", color: "#fff", borderRadius: 10,
            padding: "14px 24px", fontSize: 14, fontWeight: 600,
            textDecoration: "none",
          }}>
            Sign in <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>
      </div>
    );
  }

  // ── Vault Recovery Step ──
  if (step === "vault-recovery") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--green-light)", border: "1.5px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Shield size={22} color="var(--green)" strokeWidth={1.5} />
            </div>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
              Your vault is encrypted
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7 }}>
              To keep access to your memories, enter a recovery code.
            </p>
          </div>

          {!recoveryVerified ? (
            <>
              {recoveryInfo?.hasRecoveryCodes && recoveryInfo.recoveryCodesRemaining > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                    Recovery code
                  </label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input
                      type="text"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                      placeholder="XXXX-XXXX"
                      style={{ flex: 1, fontSize: 17, fontFamily: "monospace", letterSpacing: "0.08em", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                    />
                    <button
                      onClick={verifyRecoveryCodeHandler}
                      disabled={!recoveryCode.trim() || loading}
                      style={{
                        padding: "12px 20px", borderRadius: 10,
                        background: recoveryCode.trim() ? "var(--green)" : "var(--border)",
                        color: recoveryCode.trim() ? "#fff" : "var(--text-3)",
                        border: "none", fontSize: 14, fontWeight: 600,
                        cursor: recoveryCode.trim() && !loading ? "pointer" : "not-allowed",
                      }}
                    >
                      {loading ? "…" : "Verify"}
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>
                    {recoveryInfo.recoveryCodesRemaining} code{recoveryInfo.recoveryCodesRemaining !== 1 ? "s" : ""} remaining
                  </p>
                </div>
              )}

              {recoveryInfo?.hasGuardian && (
                <div style={{
                  padding: "16px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  marginBottom: 24,
                }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                    Or request guardian approval
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>
                    Your vault guardian ({recoveryInfo.guardianEmails[0]}) can help you recover access. Contact them directly.
                  </p>
                </div>
              )}

              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(196,96,96,0.08)", border: "1px solid rgba(196,96,96,0.2)", borderRadius: 8, marginBottom: 16 }}>
                  <AlertTriangle size={13} color="#E07070" strokeWidth={2} />
                  <p style={{ fontSize: 13, color: "#E07070" }}>{error}</p>
                </div>
              )}

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, marginTop: 8 }}>
                <button
                  onClick={() => setStep("vault-warning")}
                  style={{
                    width: "100%", padding: "12px", borderRadius: 10,
                    background: "none", border: "1px solid var(--border)",
                    fontSize: 13, color: "var(--text-3)", cursor: "pointer",
                  }}
                >
                  I don&apos;t have a recovery code
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "14px 16px", borderRadius: 12,
                background: "rgba(74,94,76,0.06)",
                border: "1px solid var(--green-border)",
                marginBottom: 24,
              }}>
                <Check size={16} color="var(--green)" strokeWidth={2} />
                <p style={{ fontSize: 14, color: "var(--green)", fontWeight: 500 }}>
                  Recovery code verified. Your vault will be re-encrypted with your new password.
                </p>
              </div>

              <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 20 }}>
                Now choose your new password to complete the reset.
              </p>

              <form onSubmit={(e) => { e.preventDefault(); performReset(); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                    New password
                  </label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" autoComplete="new-password" style={{ fontSize: 15 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                    Confirm password
                  </label>
                  <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" autoComplete="new-password" style={{ fontSize: 15 }} />
                  {confirm && password !== confirm && <p style={{ fontSize: 12, color: "#E07070", marginTop: 6 }}>Passwords don&apos;t match</p>}
                </div>
                {error && <p style={{ fontSize: 13, color: "#E07070" }}>{error}</p>}
                <button type="submit" disabled={!canSubmit || loading} style={{
                  display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center",
                  background: "var(--green)", color: "#fff", border: "none", borderRadius: 10,
                  padding: "14px 24px", fontSize: 14, fontWeight: 600,
                  cursor: canSubmit && !loading ? "pointer" : "not-allowed",
                  opacity: canSubmit && !loading ? 1 : 0.6,
                }}>
                  {loading ? "Resetting…" : <><span>Reset password & re-encrypt vault</span> <ArrowRight size={14} strokeWidth={2} /></>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Vault Warning (no recovery code) ──
  if (step === "vault-warning") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(224,112,112,0.1)", border: "1.5px solid rgba(224,112,112,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <AlertTriangle size={22} color="#E07070" strokeWidth={1.5} />
            </div>
            <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>
              Warning: Vault content will be lost
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7 }}>
              Resetting your password without a recovery code will make your encrypted vault content <strong style={{ color: "var(--text)" }}>permanently unrecoverable</strong>.
            </p>
          </div>

          <div style={{
            padding: "16px",
            background: "rgba(224,112,112,0.04)",
            border: "1px solid rgba(224,112,112,0.15)",
            borderRadius: 12,
            marginBottom: 24,
          }}>
            <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.7 }}>
              Your metadata (who contributed, when, entry types) will remain, but the actual content cannot be decrypted. This cannot be undone.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
              Type &quot;I understand&quot; to proceed
            </label>
            <input
              type="text"
              value={confirmLoss}
              onChange={(e) => setConfirmLoss(e.target.value)}
              placeholder="I understand"
              style={{ fontSize: 15, width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
            />
          </div>

          {confirmLoss.toLowerCase() === "i understand" ? (
            <form onSubmit={(e) => { e.preventDefault(); performReset(); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                  New password
                </label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" autoComplete="new-password" style={{ fontSize: 15 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                  Confirm password
                </label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" autoComplete="new-password" style={{ fontSize: 15 }} />
                {confirm && password !== confirm && <p style={{ fontSize: 12, color: "#E07070", marginTop: 6 }}>Passwords don&apos;t match</p>}
              </div>
              {error && <p style={{ fontSize: 13, color: "#E07070" }}>{error}</p>}
              <button type="submit" disabled={!canSubmit || loading} style={{
                display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center",
                background: "#C46060", color: "#fff", border: "none", borderRadius: 10,
                padding: "14px 24px", fontSize: 14, fontWeight: 600,
                cursor: canSubmit && !loading ? "pointer" : "not-allowed",
                opacity: canSubmit && !loading ? 1 : 0.6,
              }}>
                {loading ? "Resetting…" : "Reset password (vault content will be lost)"}
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                if (recoveryInfo?.hasRecoveryCodes && recoveryInfo.recoveryCodesRemaining > 0) {
                  setStep("vault-recovery");
                } else {
                  setStep("password");
                }
              }}
              style={{
                width: "100%", padding: "12px", borderRadius: 10,
                background: "none", border: "1px solid var(--border)",
                fontSize: 13, color: "var(--text-3)", cursor: "pointer",
              }}
            >
              ← Go back
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Default password reset form ──
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1.5px solid var(--green-border)", background: "var(--green-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <span style={{ fontFamily: "var(--font-playfair)", fontSize: 18, fontWeight: 800, color: "var(--green)" }}>Our Fable</span>
          </div>
          <p style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700, color: "var(--text)", letterSpacing: "0.06em" }}>Our Fable</p>
        </div>

        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 26, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
            Choose a new password.
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>Must be at least 6 characters.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              autoComplete="new-password"
              autoFocus
              style={{ fontSize: 15 }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
              style={{ fontSize: 15 }}
            />
            {confirm && password !== confirm && (
              <p style={{ fontSize: 12, color: "#E07070", marginTop: 6 }}>Passwords don&apos;t match</p>
            )}
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(196,96,96,0.08)", border: "1px solid rgba(196,96,96,0.2)", borderRadius: 8 }}>
              <Lock size={13} color="var(--red)" strokeWidth={2} />
              <p style={{ fontSize: 13, color: "var(--red)" }}>{error}</p>
            </div>
          )}

          <button type="submit" disabled={!canSubmit || loading} className="btn-primary"
            style={{ padding: "14px 24px", fontSize: 14, marginTop: 4, display: "inline-flex", alignItems: "center", gap: 8, background: "var(--green)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: canSubmit && !loading ? "pointer" : "not-allowed" }}>
            {loading ? "Resetting…" : <><span>Reset password</span> <ArrowRight size={14} strokeWidth={2} /></>}
          </button>
        </form>

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <Link href="/login" style={{ fontSize: 13, color: "var(--green)", textDecoration: "none" }}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={null}><ResetPasswordForm /></Suspense>;
}
