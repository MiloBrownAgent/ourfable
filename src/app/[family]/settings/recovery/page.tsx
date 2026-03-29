"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Shield, Download, Copy, Check, RefreshCw, ArrowLeft, AlertTriangle } from "lucide-react";
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

export default function RecoveryCodesPage({ params }: { params: Promise<{ family: string }> }) {
  const { family: familyId } = use(params);

  const [codes, setCodes] = useState<string[]>([]);
  const [status, setStatus] = useState<{ total: number; used: number; remaining: number; recoverySetupComplete: boolean } | null>(null);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, [familyId]);

  async function loadStatus() {
    setLoading(true);
    try {
      const s = await convexFetch("ourfable:getRecoveryCodeStatus", { familyId });
      setStatus(s);
    } catch {
      // No codes yet
    }
    setLoading(false);
  }

  function handleGenerate() {
    const newCodes = generateRecoveryCodes(10);
    setCodes(newCodes);
    setHasDownloaded(false);
    setHasSaved(false);
    setSaved(false);
    setShowSetup(true);
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
      // Get family encryption keys
      const keys = await convexFetch("ourfable:getFamilyEncryptionKeys", { familyId });

      if (!keys?.encryptedFamilyKey || !keys?.keySalt) {
        // No encryption set up yet — just store the hashes without wrapped keys
        const hashes = await hashAllRecoveryCodes(codes);
        await convexMutate("ourfable:storeRecoveryCodeHashes", {
          familyId,
          hashes,
          wrappedKeys: codes.map(() => ""), // no wrapped keys if no encryption
        });
      } else {
        // Get the session password from sessionStorage to unwrap family key
        const sessionPassword = sessionStorage.getItem(`ourfable-pwd-${familyId}`);
        if (!sessionPassword) {
          setError("Session expired. Please re-enter your password on the settings page to set up recovery codes.");
          setSaving(false);
          return;
        }

        // Derive KEK and unwrap family key
        const kek = await deriveKeyEncryptionKey(sessionPassword, keys.keySalt);
        const wrappedData = JSON.parse(keys.encryptedFamilyKey);
        const familyKey = await unwrapFamilyKey(wrappedData, kek);

        // Hash all codes and wrap family key with each code
        const hashes = await hashAllRecoveryCodes(codes);
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

      await convexMutate("ourfable:markRecoverySetupComplete", { familyId });
      setSaved(true);
      setShowSetup(false);
      loadStatus();
    } catch (err) {
      console.error("Failed to save recovery codes:", err);
      setError("Failed to save recovery codes. Please try again.");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <p style={{ color: "var(--text-3)", fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "24px 24px 80px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        {/* Back link */}
        <Link href={`/${familyId}/settings`} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 13, color: "var(--text-3)", textDecoration: "none", marginBottom: 32,
        }}>
          <ArrowLeft size={14} strokeWidth={1.5} /> Settings
        </Link>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "var(--green-light)", border: "1.5px solid var(--green-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={20} color="var(--green)" strokeWidth={1.5} />
          </div>
          <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700, color: "var(--text)" }}>
            Recovery Codes
          </h1>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.7, marginBottom: 32 }}>
          Recovery codes let you regain access to your encrypted vault if you forget your password.
        </p>

        {/* Status card */}
        {status && status.total > 0 && !showSetup && (
          <div style={{
            padding: "24px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            marginBottom: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                Recovery codes active
              </p>
              <span style={{
                padding: "4px 12px", borderRadius: 100,
                background: status.remaining > 3 ? "var(--green-light)" : "rgba(224,112,112,0.1)",
                border: `1px solid ${status.remaining > 3 ? "var(--green-border)" : "rgba(224,112,112,0.3)"}`,
                fontSize: 12, fontWeight: 600,
                color: status.remaining > 3 ? "var(--green)" : "#E07070",
              }}>
                {status.remaining} of {status.total} remaining
              </span>
            </div>

            {status.remaining <= 3 && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(224,112,112,0.06)",
                border: "1px solid rgba(224,112,112,0.15)",
                marginBottom: 16,
              }}>
                <AlertTriangle size={14} color="#E07070" />
                <p style={{ fontSize: 13, color: "#E07070" }}>
                  You&apos;re running low on recovery codes. Consider regenerating.
                </p>
              </div>
            )}

            <button
              onClick={() => { setRegenerating(true); handleGenerate(); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 20px", borderRadius: 10,
                background: "var(--bg)", border: "1px solid var(--border)",
                fontSize: 13, fontWeight: 600, color: "var(--text)",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={14} strokeWidth={2} /> Regenerate codes
            </button>
            {regenerating && (
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>
                ⚠️ This will invalidate all existing recovery codes.
              </p>
            )}
          </div>
        )}

        {/* No codes yet */}
        {(!status || status.total === 0) && !showSetup && (
          <div style={{
            padding: "32px 24px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            textAlign: "center",
            marginBottom: 24,
          }}>
            <Shield size={32} color="var(--text-3)" strokeWidth={1} style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
              No recovery codes set up
            </p>
            <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.7, marginBottom: 24 }}>
              Generate recovery codes to protect your vault in case you lose your password.
            </p>
            <button
              onClick={handleGenerate}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 24px", borderRadius: 10,
                background: "var(--green)", color: "#fff", border: "none",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Generate recovery codes
            </button>
          </div>
        )}

        {/* Setup flow - show codes */}
        {showSetup && codes.length > 0 && (
          <div style={{
            padding: "28px 24px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            marginBottom: 24,
          }}>
            {/* Warning */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "14px 16px", borderRadius: 10,
              background: "rgba(200,168,122,0.08)",
              border: "1px solid rgba(200,168,122,0.2)",
              marginBottom: 24,
            }}>
              <AlertTriangle size={16} color="var(--gold)" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 13, color: "var(--gold)", lineHeight: 1.6 }}>
                Save these codes somewhere safe. Print them. Put them in a drawer. Each code can only be used once.
              </p>
            </div>

            {/* Code grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "10px 20px",
              marginBottom: 24,
              padding: "20px",
              background: "var(--bg)",
              borderRadius: 12,
              border: "1px solid var(--border)",
            }}>
              {codes.map((code, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  fontFamily: "monospace", fontSize: 15, color: "var(--text)",
                  padding: "6px 0",
                }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)", width: 20, textAlign: "right" }}>
                    {i + 1}.
                  </span>
                  <span style={{ letterSpacing: "0.05em" }}>{code}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              <button
                onClick={downloadCodes}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 20px", borderRadius: 10,
                  background: hasDownloaded ? "var(--green-light)" : "var(--green)",
                  color: hasDownloaded ? "var(--green)" : "#fff",
                  border: hasDownloaded ? "1px solid var(--green-border)" : "none",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                {hasDownloaded ? <Check size={14} strokeWidth={2} /> : <Download size={14} strokeWidth={2} />}
                {hasDownloaded ? "Downloaded" : "Download codes"}
              </button>

              <button
                onClick={copyAll}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 20px", borderRadius: 10,
                  background: "var(--bg)", border: "1px solid var(--border)",
                  fontSize: 13, fontWeight: 600, color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                {copied ? <Check size={14} strokeWidth={2} /> : <Copy size={14} strokeWidth={2} />}
                {copied ? "Copied!" : "Copy all"}
              </button>
            </div>

            {/* Checkbox */}
            <label style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "14px 16px", borderRadius: 10,
              background: hasSaved ? "rgba(74,94,76,0.06)" : "var(--bg)",
              border: `1px solid ${hasSaved ? "var(--green-border)" : "var(--border)"}`,
              cursor: "pointer", marginBottom: 20,
              transition: "all 150ms",
            }}>
              <input
                type="checkbox"
                checked={hasSaved}
                onChange={(e) => setHasSaved(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "var(--green)" }}
              />
              <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>
                I have saved these codes somewhere safe
              </span>
            </label>

            {error && (
              <p style={{ fontSize: 13, color: "#E07070", marginBottom: 16 }}>{error}</p>
            )}

            {/* Save button */}
            <button
              onClick={saveCodes}
              disabled={!hasDownloaded || !hasSaved || saving}
              style={{
                width: "100%",
                padding: "14px 24px", borderRadius: 10,
                background: hasDownloaded && hasSaved ? "var(--green)" : "var(--border)",
                color: hasDownloaded && hasSaved ? "#fff" : "var(--text-3)",
                border: "none",
                fontSize: 14, fontWeight: 600,
                cursor: hasDownloaded && hasSaved && !saving ? "pointer" : "not-allowed",
                transition: "all 150ms",
              }}
            >
              {saving ? "Saving…" : saved ? "Saved!" : "Save recovery codes"}
            </button>

            {!hasDownloaded && (
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 10, textAlign: "center" }}>
                Download your codes before saving
              </p>
            )}
          </div>
        )}

        {/* Saved success */}
        {saved && !showSetup && (
          <div style={{
            padding: "20px",
            background: "rgba(74,94,76,0.06)",
            border: "1px solid var(--green-border)",
            borderRadius: 12,
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: 24,
          }}>
            <Check size={16} color="var(--green)" strokeWidth={2} />
            <p style={{ fontSize: 14, color: "var(--green)", fontWeight: 500 }}>
              Recovery codes saved successfully.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
