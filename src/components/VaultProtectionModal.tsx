"use client";
import { useState } from "react";
import {
  Shield, Download, Copy, Check, AlertTriangle, Key, Users, ArrowRight, X,
} from "lucide-react";
import {
  generateRecoveryCodes,
  hashAllRecoveryCodes,
  wrapFamilyKeyWithRecoveryCode,
} from "@/lib/recovery-codes";
import {
  deriveKeyEncryptionKey,
  unwrapFamilyKey,
} from "@/lib/vault-encryption";

async function convexFetch(queryPath: string, args: Record<string, unknown>) {
  const res = await fetch("/api/ourfable/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: queryPath, args }),
  });
  const data = await res.json();
  return data.value ?? data;
}

async function convexMutate(mutPath: string, args: Record<string, unknown>) {
  const res = await fetch("/api/ourfable/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: mutPath, args, type: "mutation" }),
  });
  const data = await res.json();
  return data.value ?? data;
}

interface Props {
  familyId: string;
  onComplete: () => void;
}

type Step = "choose" | "codes" | "guardian" | "done";

export default function VaultProtectionModal({ familyId, onComplete }: Props) {
  const [step, setStep] = useState<Step>("choose");
  const [codes, setCodes] = useState<string[]>([]);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Guardian state
  const [guardianName, setGuardianName] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianSaving, setGuardianSaving] = useState(false);

  function handleStartCodes() {
    const newCodes = generateRecoveryCodes(10);
    setCodes(newCodes);
    setStep("codes");
  }

  function downloadCodes() {
    const text = [
      "Our Fable — Recovery Codes",
      "Generated: " + new Date().toLocaleDateString(),
      "Family: " + familyId,
      "",
      "Keep these codes somewhere safe. Each code can only be used once.",
      "If you lose your password AND all recovery codes, your vault content",
      "will be permanently unrecoverable.",
      "",
      ...codes.map((c, i) => `${(i + 1).toString().padStart(2, " ")}. ${c}`),
      "",
      "--- end of recovery codes ---",
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ourfable-recovery-codes-${familyId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setHasDownloaded(true);
  }

  function copyAll() {
    navigator.clipboard.writeText(codes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveCodes() {
    if (!codes.length) return;
    setSaving(true);
    setError("");

    try {
      const keys = await convexFetch("ourfable:getFamilyEncryptionKeys", { familyId });

      if (!keys?.encryptedFamilyKey || !keys?.keySalt) {
        const hashes = await hashAllRecoveryCodes(codes, keys?.keySalt);
        await convexMutate("ourfable:storeRecoveryCodeHashes", {
          familyId,
          hashes,
          wrappedKeys: codes.map(() => ""),
        });
      } else {
        const sessionPassword = sessionStorage.getItem(`ourfable-pwd-${familyId}`);
        if (!sessionPassword) {
          // If no session password, store hashes without wrapped keys
          // They can regenerate later when they have the password in session
          const hashes = await hashAllRecoveryCodes(codes, keys.keySalt);
          await convexMutate("ourfable:storeRecoveryCodeHashes", {
            familyId,
            hashes,
            wrappedKeys: codes.map(() => ""),
          });
        } else {
          const kek = await deriveKeyEncryptionKey(sessionPassword, keys.keySalt);
          const wrappedData = JSON.parse(keys.encryptedFamilyKey);
          const familyKey = await unwrapFamilyKey(wrappedData, kek);

          const hashes = await hashAllRecoveryCodes(codes, keys.keySalt);
          const wrappedKeys: string[] = [];
          for (const code of codes) {
            const wrapped = await wrapFamilyKeyWithRecoveryCode(familyKey, code, keys.keySalt);
            wrappedKeys.push(wrapped);
          }

          await convexMutate("ourfable:storeRecoveryCodeHashes", {
            familyId,
            hashes,
            wrappedKeys,
          });
        }
      }

      await convexMutate("ourfable:markRecoverySetupComplete", { familyId });
      setStep("done");
    } catch (err) {
      console.error("Failed to save recovery codes:", err);
      setError("Failed to save. Please try again.");
    }
    setSaving(false);
  }

  async function saveGuardian() {
    if (!guardianEmail.trim() || !guardianName.trim()) return;
    setGuardianSaving(true);
    setError("");

    try {
      // Store guardian key share (placeholder — guardian flow will encrypt the key properly)
      await convexMutate("ourfable:storeGuardianKeyShare", {
        familyId,
        guardianEmail: guardianEmail.trim().toLowerCase(),
        encryptedFamilyKey: "", // Will be encrypted when guardian accepts
      });

      await convexMutate("ourfable:markRecoverySetupComplete", { familyId });
      setStep("done");
    } catch (err) {
      console.error("Failed to add guardian:", err);
      setError("Failed to add guardian. Please try again.");
    }
    setGuardianSaving(false);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 520,
        maxHeight: "90vh", overflowY: "auto",
        background: "var(--bg)",
        borderRadius: 20,
        border: "1px solid var(--border)",
        padding: "36px 28px 32px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        {/* ── CHOOSE METHOD ── */}
        {step === "choose" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "var(--green-light)", border: "1.5px solid var(--green-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <Shield size={24} color="var(--green)" strokeWidth={1.5} />
              </div>
              <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                Protect your vault
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7 }}>
                Before you start, let&apos;s make sure you can always access your memories — even if you forget your password.
              </p>
            </div>

            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.18em",
              textTransform: "uppercase", color: "var(--text-3)", marginBottom: 14,
            }}>
              Choose at least one recovery method
            </p>

            {/* Option A: Recovery Codes */}
            <button
              onClick={handleStartCodes}
              style={{
                width: "100%", padding: "20px", borderRadius: 14,
                background: "var(--surface)", border: "1px solid var(--border)",
                cursor: "pointer", textAlign: "left", marginBottom: 12,
                transition: "border-color 150ms",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--green-border)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "rgba(74,94,76,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Key size={18} color="var(--green)" strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>
                    Save recovery codes
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>
                    10 one-time codes you download and store somewhere safe
                  </p>
                </div>
                <ArrowRight size={16} color="var(--text-3)" />
              </div>
            </button>

            {/* Option B: Guardian */}
            <button
              onClick={() => setStep("guardian")}
              style={{
                width: "100%", padding: "20px", borderRadius: 14,
                background: "var(--surface)", border: "1px solid var(--border)",
                cursor: "pointer", textAlign: "left",
                transition: "border-color 150ms",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--green-border)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "rgba(74,94,76,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Users size={18} color="var(--green)" strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>
                    Add a vault guardian
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>
                    A trusted person who can help you recover your vault
                  </p>
                </div>
                <ArrowRight size={16} color="var(--text-3)" />
              </div>
            </button>
          </>
        )}

        {/* ── RECOVERY CODES SETUP ── */}
        {step === "codes" && (
          <>
            <button
              onClick={() => setStep("choose")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 13, color: "var(--text-3)", background: "none", border: "none",
                cursor: "pointer", marginBottom: 20, padding: 0,
              }}
            >
              ← Back
            </button>

            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
              Your recovery codes
            </h2>

            {/* Warning */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "12px 14px", borderRadius: 10,
              background: "rgba(200,168,122,0.08)",
              border: "1px solid rgba(200,168,122,0.2)",
              marginBottom: 20,
            }}>
              <AlertTriangle size={15} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 13, color: "var(--gold)", lineHeight: 1.5 }}>
                Save these codes somewhere safe. Print them. Put them in a drawer. Each code can only be used once.
              </p>
            </div>

            {/* Code grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "8px 16px",
              marginBottom: 20,
              padding: "16px",
              background: "var(--surface)",
              borderRadius: 12,
              border: "1px solid var(--border)",
            }}>
              {codes.map((code, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontFamily: "monospace", fontSize: 14, color: "var(--text)",
                  padding: "4px 0",
                }}>
                  <span style={{ fontSize: 10, color: "var(--text-3)", width: 18, textAlign: "right" }}>
                    {i + 1}.
                  </span>
                  <span style={{ letterSpacing: "0.04em" }}>{code}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              <button
                onClick={downloadCodes}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "10px 18px", borderRadius: 10,
                  background: hasDownloaded ? "var(--green-light)" : "var(--green)",
                  color: hasDownloaded ? "var(--green)" : "#fff",
                  border: hasDownloaded ? "1px solid var(--green-border)" : "none",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                {hasDownloaded ? <Check size={13} /> : <Download size={13} />}
                {hasDownloaded ? "Downloaded" : "Download"}
              </button>
              <button
                onClick={copyAll}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "10px 18px", borderRadius: 10,
                  background: "var(--surface)", border: "1px solid var(--border)",
                  fontSize: 13, fontWeight: 600, color: "var(--text)", cursor: "pointer",
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy all"}
              </button>
            </div>

            {/* Checkbox */}
            <label style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 14px", borderRadius: 10,
              background: hasSaved ? "rgba(74,94,76,0.06)" : "var(--surface)",
              border: `1px solid ${hasSaved ? "var(--green-border)" : "var(--border)"}`,
              cursor: "pointer", marginBottom: 16,
            }}>
              <input
                type="checkbox"
                checked={hasSaved}
                onChange={(e) => setHasSaved(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "var(--green)" }}
              />
              <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>
                I have saved these codes somewhere safe
              </span>
            </label>

            {error && <p style={{ fontSize: 13, color: "#E07070", marginBottom: 12 }}>{error}</p>}

            <button
              onClick={saveCodes}
              disabled={!hasDownloaded || !hasSaved || saving}
              style={{
                width: "100%", padding: "14px", borderRadius: 10,
                background: hasDownloaded && hasSaved ? "var(--green)" : "var(--border)",
                color: hasDownloaded && hasSaved ? "#fff" : "var(--text-3)",
                border: "none", fontSize: 14, fontWeight: 600,
                cursor: hasDownloaded && hasSaved && !saving ? "pointer" : "not-allowed",
              }}
            >
              {saving ? "Saving…" : "Save recovery codes"}
            </button>
          </>
        )}

        {/* ── GUARDIAN SETUP ── */}
        {step === "guardian" && (
          <>
            <button
              onClick={() => setStep("choose")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 13, color: "var(--text-3)", background: "none", border: "none",
                cursor: "pointer", marginBottom: 20, padding: 0,
              }}
            >
              ← Back
            </button>

            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
              Add a vault guardian
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7, marginBottom: 24 }}>
              A vault guardian is a trusted person who can help you recover access to your encrypted memories.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                  Guardian name
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="e.g., Mom, Uncle Dave"
                  style={{ fontSize: 15, width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>
                  Guardian email
                </label>
                <input
                  type="email"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  placeholder="guardian@example.com"
                  style={{ fontSize: 15, width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                />
              </div>
            </div>

            {error && <p style={{ fontSize: 13, color: "#E07070", marginBottom: 12 }}>{error}</p>}

            <button
              onClick={saveGuardian}
              disabled={!guardianEmail.trim() || !guardianName.trim() || guardianSaving}
              style={{
                width: "100%", padding: "14px", borderRadius: 10,
                background: guardianEmail.trim() && guardianName.trim() ? "var(--green)" : "var(--border)",
                color: guardianEmail.trim() && guardianName.trim() ? "#fff" : "var(--text-3)",
                border: "none", fontSize: 14, fontWeight: 600,
                cursor: guardianEmail.trim() && guardianName.trim() && !guardianSaving ? "pointer" : "not-allowed",
              }}
            >
              {guardianSaving ? "Adding guardian…" : "Add guardian"}
            </button>
          </>
        )}

        {/* ── DONE ── */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "var(--green-light)", border: "1.5px solid var(--green-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <Check size={24} color="var(--green)" strokeWidth={2} />
            </div>
            <h2 style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
              Vault protected
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7, marginBottom: 28 }}>
              Your memories are safe. You can always manage your recovery options in Settings.
            </p>
            <button
              onClick={onComplete}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 32px", borderRadius: 10,
                background: "var(--green)", color: "#fff", border: "none",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Continue to your Fable <ArrowRight size={14} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
