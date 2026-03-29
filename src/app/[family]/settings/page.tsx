"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  User, CreditCard, HardDrive, Shield, Check, X, Loader2,
  ChevronRight, AlertTriangle, Sparkles, Download, Trash2,
  Users, Lock, Smartphone, Gift, Clock, Baby, Plus,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FamilyData {
  parentNames?: string;
  parentEmail?: string;
  familyName: string;
  childName: string;
}

interface AccountData {
  email: string;
  planType: string;
  subscriptionStatus: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  parentNames?: string;
}

interface StorageData {
  used: number;
  limit: number;
  percentage: number;
  planType: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function apiPost(path: string, body: Record<string, unknown> = {}) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res;
}

async function convexFetch(queryPath: string, args: Record<string, unknown>) {
  const res = await fetch("/api/ourfable/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: queryPath, args }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.value ?? null;
}

async function convexMutate(mutPath: string, args: Record<string, unknown>) {
  const res = await fetch("/api/ourfable/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: mutPath, args, type: "mutation" }),
  });
  return res.ok;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

// ── Plan Features ──────────────────────────────────────────────────────────────

const STANDARD_FEATURES = [
  "5 GB storage",
  "Up to 10 circle members",
  "Letters, photos & voice memos",
  "Monthly world snapshots",
  "Email support",
];

const PLUS_FEATURES = [
  "25 GB storage",
  "Unlimited circle members",
  "Video messages up to 10 min",
  "Priority support",
  "Annual print book included",
  "Everything in Standard",
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function SettingsPage({ params }: { params: Promise<{ family: string }> }) {
  const { family: familyId } = use(params);

  const [family, setFamily] = useState<FamilyData | null>(null);
  const [account, setAccount] = useState<AccountData | null>(null);
  const [storage, setStorage] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile editing
  const [editingName, setEditingName] = useState(false);
  const [parentNames, setParentNames] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Password change
  const [showPassword, setShowPassword] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Upgrade
  const [upgrading, setUpgrading] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  // Delete
  const [showDelete, setShowDelete] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Exporting
  const [exporting, setExporting] = useState(false);

  // Vault Guardians
  const [fac1Name, setFac1Name] = useState("");
  const [fac1Email, setFac1Email] = useState("");
  const [fac1Rel, setFac1Rel] = useState("");
  const [fac2Name, setFac2Name] = useState("");
  const [fac2Email, setFac2Email] = useState("");
  const [fac2Rel, setFac2Rel] = useState("");
  const [childEmail, setChildEmail] = useState("");
  const [editingGuardians, setEditingGuardians] = useState(false);
  const [savingGuardians, setSavingGuardians] = useState(false);
  const [guardianSuccess, setGuardianSuccess] = useState(false);

  // 2FA
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpSetupUri, setTotpSetupUri] = useState("");
  const [totpQrData, setTotpQrData] = useState("");
  const [totpVerifyCode, setTotpVerifyCode] = useState("");
  const [totpError, setTotpError] = useState("");
  const [setting2fa, setSetting2fa] = useState(false);
  const [confirming2fa, setConfirming2fa] = useState(false);
  const [disabling2fa, setDisabling2fa] = useState(false);
  const [disable2faPassword, setDisable2faPassword] = useState("");
  const [disable2faCode, setDisable2faCode] = useState("");
  const [disable2faError, setDisable2faError] = useState("");
  const [showDisable2fa, setShowDisable2fa] = useState(false);

  // Dead man's switch
  const [notifyOnLapse, setNotifyOnLapse] = useState(true);
  const [savingLapse, setSavingLapse] = useState(false);

  // Legacy mode
  const [legacyMode, setLegacyMode] = useState(false);
  const [guardianCheckIn, setGuardianCheckIn] = useState(false);
  const [savingLegacy, setSavingLegacy] = useState(false);
  const [savingGuardianCheckIn, setSavingGuardianCheckIn] = useState(false);

  // Children
  interface ChildRecord {
    _id: string;
    childName: string;
    childDob: string;
    isFirst: boolean;
  }
  const [childList, setChildList] = useState<ChildRecord[]>([]);
  const [cancelingChildId, setCancelingChildId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  // Milestones
  interface Milestone {
    _id: string;
    milestoneName: string;
    milestoneDate: number;
    deliveryStatus: string;
  }
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Load data
  useEffect(() => {
    async function load() {
      const [fam, acct, stor, facData, twoFA, ms, me, kids, legacyData] = await Promise.all([
        convexFetch("ourfable:getFamily", { familyId }),
        convexFetch("ourfable:getOurFableFamilyByIdSafe", { familyId }),
        convexFetch("ourfable:getOurFableStorageUsage", { familyId }),
        convexFetch("ourfable:getOurFableFacilitators", { familyId }),
        convexFetch("ourfable:getOurFable2FAStatusPublic", { familyId }),
        convexFetch("ourfable:listOurFableDeliveryMilestones", { familyId }),
        fetch("/api/auth/me").then(r => r.ok ? r.json() : null).catch(() => null),
        convexFetch("ourfable:listChildren", { familyId }),
        convexFetch("ourfable:getLegacySettings", { familyId }),
      ]);
      setFamily(fam as FamilyData);
      // Merge account data — use auth email (from session) if available, falling back to Convex record
      const acctData = acct as AccountData;
      if (acctData && me?.email) {
        acctData.email = me.email;
      }
      setAccount(acctData);
      setStorage(stor as StorageData);
      if (fam?.parentNames) setParentNames(fam.parentNames);
      if (facData) {
        const fd = facData as Record<string, string | undefined>;
        setFac1Name(fd.facilitator1Name ?? "");
        setFac1Email(fd.facilitator1Email ?? "");
        setFac1Rel(fd.facilitator1Relationship ?? "");
        setFac2Name(fd.facilitator2Name ?? "");
        setFac2Email(fd.facilitator2Email ?? "");
        setFac2Rel(fd.facilitator2Relationship ?? "");
        setChildEmail(fd.childEmail ?? "");
      }
      if (twoFA) {
        setTotpEnabled((twoFA as { totpEnabled: boolean }).totpEnabled);
      }
      if (acct && typeof (acct as Record<string, unknown>).notifyFacilitatorOnLapse === "boolean") {
        setNotifyOnLapse((acct as Record<string, unknown>).notifyFacilitatorOnLapse as boolean);
      }
      setMilestones((ms as Milestone[]) ?? []);
      setChildList((kids as ChildRecord[]) ?? []);
      if (legacyData) {
        const ld = legacyData as { legacyMode: boolean; guardianCheckIn: boolean };
        setLegacyMode(ld.legacyMode ?? false);
        // Default guardianCheckIn to true if guardians are set
        const hasGuardian = !!(facData && (facData as Record<string, string>).facilitator1Email);
        setGuardianCheckIn(ld.guardianCheckIn ?? hasGuardian);
      }
      setLoading(false);
    }
    load();

    // Check for upgrade success param
    if (typeof window !== "undefined" && window.location.search.includes("upgraded=true")) {
      setUpgraded(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [familyId]);

  // Save parent names
  async function handleSaveName() {
    setSavingName(true);
    const ok = await convexMutate("ourfable:patchFamily", { familyId, parentNames });
    setSavingName(false);
    if (ok) {
      setEditingName(false);
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 2000);
    }
  }

  // Change password
  async function handleChangePassword() {
    setPwError("");
    if (newPw !== confirmPw) { setPwError("Passwords don't match"); return; }
    if (newPw.length < 8) { setPwError("Password must be at least 8 characters"); return; }

    setSavingPw(true);
    const res = await apiPost("/api/auth/change-password", { currentPassword: currentPw, newPassword: newPw });
    setSavingPw(false);

    if (res.ok) {
      setPwSuccess(true);
      setShowPassword(false);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPwSuccess(false), 3000);
    } else {
      const data = await res.json();
      setPwError(data.error ?? "Failed to change password");
    }
  }

  // Upgrade
  async function handleUpgrade() {
    setUpgrading(true);
    const res = await apiPost("/api/stripe/upgrade", { billingPeriod: "annual" });
    if (res.ok) {
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    }
    setUpgrading(false);
  }

  // Manage billing
  async function handleManageBilling() {
    const res = await apiPost("/api/stripe/portal");
    if (res.ok) {
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    }
  }

  // Export data
  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/ourfable/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ourfable-export-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  }

  // Save guardians
  async function handleSaveGuardians() {
    setSavingGuardians(true);
    const ok = await convexMutate("ourfable:updateOurFableFacilitators", {
      familyId,
      facilitator1Name: fac1Name || undefined,
      facilitator1Email: fac1Email || undefined,
      facilitator1Relationship: fac1Rel || undefined,
      facilitator2Name: fac2Name || undefined,
      facilitator2Email: fac2Email || undefined,
      facilitator2Relationship: fac2Rel || undefined,
      childEmail: childEmail || undefined,
    });
    setSavingGuardians(false);
    if (ok) {
      setEditingGuardians(false);
      setGuardianSuccess(true);
      setTimeout(() => setGuardianSuccess(false), 3000);
    }
  }

  // 2FA setup
  async function handleSetup2FA() {
    setSetting2fa(true);
    setTotpError("");
    const res = await apiPost("/api/auth/2fa/setup");
    if (res.ok) {
      const data = await res.json();
      setTotpSetupUri(data.otpauthUri);
      setTotpQrData(data.qrDataUrl ?? "");
      setConfirming2fa(true);
    } else {
      setTotpError("Failed to set up 2FA");
    }
    setSetting2fa(false);
  }

  async function handleConfirm2FA() {
    setTotpError("");
    const res = await apiPost("/api/auth/2fa/confirm", { code: totpVerifyCode });
    if (res.ok) {
      setTotpEnabled(true);
      setConfirming2fa(false);
      setTotpVerifyCode("");
      setTotpSetupUri("");
    } else {
      const data = await res.json();
      setTotpError(data.error ?? "Invalid code");
    }
  }

  async function handleDisable2FA() {
    setDisable2faError("");
    const res = await apiPost("/api/auth/2fa/disable", {
      password: disable2faPassword,
      code: disable2faCode,
    });
    if (res.ok) {
      setTotpEnabled(false);
      setShowDisable2fa(false);
      setDisable2faPassword("");
      setDisable2faCode("");
    } else {
      const data = await res.json();
      setDisable2faError(data.error ?? "Failed to disable 2FA");
    }
  }

  // Delete account
  async function handleDelete() {
    setDeleteError("");
    if (!deletePw) { setDeleteError("Enter your password to confirm"); return; }

    setDeleting(true);
    const res = await apiPost("/api/auth/delete-account", { password: deletePw });
    setDeleting(false);

    if (res.ok) {
      window.location.href = "/";
    } else {
      const data = await res.json();
      setDeleteError(data.error ?? "Failed to delete account");
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "var(--text-3)" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isPlus = account?.planType === "plus";
  const isStandard = !isPlus && account?.planType !== "pilot";

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 className="font-display" style={{
          fontSize: 28, fontWeight: 700,
          color: "var(--green)", letterSpacing: "0.02em", marginBottom: 6,
        }}>
          Account Settings
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-3)", lineHeight: 1.65 }}>
          Manage your profile, plan, and data.
        </p>
      </div>

      {/* Upgrade success banner */}
      {upgraded && (
        <div style={{
          background: "var(--green-light)", border: "1px solid var(--green-border)",
          borderRadius: 12, padding: "16px 20px", marginBottom: 24,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <Sparkles size={16} style={{ color: "var(--green)" }} />
          <span style={{ fontSize: 14, color: "var(--green)", fontWeight: 500 }}>
            Welcome to Our Fable+! Your upgrade is active.
          </span>
        </div>
      )}

      {/* ═══ CHILDREN ═══ */}
      <Section icon={<Baby size={16} />} title="Children">
        <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-3)", lineHeight: 1.65, marginBottom: 20 }}>
          Manage the children in your fable.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {childList.length === 0 && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-3)", fontStyle: "italic" }}>
              No children found.
            </p>
          )}
          {childList.map((child, idx) => {
            const firstName = child.childName.split(" ")[0];
            const dob = child.childDob ? new Date(child.childDob + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";
            const planLabel = child.isFirst ? "Included" : "Add-on";
            const isAddOn = !child.isFirst;
            return (
              <div key={child._id} style={{
                padding: "16px 20px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, flexWrap: "wrap",
              }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>{child.childName}</p>
                  <p style={{ fontSize: 12, color: "var(--text-3)" }}>{dob}</p>
                  <span style={{
                    display: "inline-block", marginTop: 6,
                    padding: "2px 10px", borderRadius: 20,
                    fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
                    background: child.isFirst ? "var(--green-light)" : "var(--gold-dim)",
                    color: child.isFirst ? "var(--green)" : "var(--gold)",
                    border: child.isFirst ? "1px solid var(--green-border)" : "1px solid var(--gold-border)",
                  }}>
                    {planLabel}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {isAddOn && (
                    cancelConfirmId === child._id ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "var(--text-3)" }}>Cancel add-on?</span>
                        <button
                          onClick={async () => {
                            setCancelingChildId(child._id);
                            try {
                              // Redirect to Stripe Customer Portal to cancel the add-on subscription
                              const res = await fetch("/api/stripe/portal", { method: "POST" });
                              const data = await res.json();
                              if (data.url) {
                                window.location.href = data.url;
                              } else {
                                console.error("[cancel add-on] No portal URL:", data);
                                alert("Could not open billing portal. Please contact support@ourfable.ai");
                              }
                            } catch (err) {
                              console.error("[cancel add-on] Error:", err);
                              alert("Something went wrong. Please contact support@ourfable.ai");
                            } finally {
                              setCancelingChildId(null);
                              setCancelConfirmId(null);
                            }
                          }}
                          disabled={cancelingChildId === child._id}
                          style={{ fontSize: 12, color: "#c0392b", background: "none", border: "1px solid rgba(192,57,43,0.3)", borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}
                        >
                          {cancelingChildId === child._id ? "Opening portal…" : "Confirm"}
                        </button>
                        <button onClick={() => setCancelConfirmId(null)} style={{ fontSize: 12, color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                          Never mind
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCancelConfirmId(child._id)}
                        style={{ fontSize: 12, color: "var(--text-3)", background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 10px", cursor: "pointer" }}
                      >
                        Cancel add-on
                      </button>
                    )
                  )}
                  <Link
                    href={`/${familyId}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      fontSize: 13, fontWeight: 500,
                      color: "var(--green)",
                      textDecoration: "none",
                    }}
                  >
                    Manage <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        <Link
          href={`/${familyId}/add-child`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "11px 20px",
            borderRadius: 100,
            fontSize: 13, fontWeight: 600,
            background: "var(--green)", color: "#fff",
            textDecoration: "none",
            transition: "opacity 160ms",
          }}
        >
          <Plus size={14} strokeWidth={2} />
          Add another child
        </Link>
      </Section>

      {/* ═══ FEATURES ═══ */}
      <Section icon={<Gift size={16} />} title="Features & Extras">
        <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-3)", lineHeight: 1.65, marginBottom: 20 }}>
          Access additional features for {family?.childName?.split(" ")[0] ?? "your child"}&apos;s fable.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Milestone Deliveries", desc: "Schedule vault deliveries for special moments", href: `/${familyId}/delivery` },
            { label: "Vault Delivery", desc: "Deliver the vault when the time comes", href: `/${familyId}/delivery` },
            { label: "Year in Print", desc: "Turn a year of memories into a printed book", href: `/${familyId}/print` },
          ].map(item => (
            <a key={item.label} href={item.href} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px", borderRadius: 10,
              background: "var(--surface)", border: "1px solid var(--border)",
              textDecoration: "none", transition: "all 160ms",
            }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>{item.label}</p>
                <p style={{ fontSize: 12, color: "var(--text-3)" }}>{item.desc}</p>
              </div>
              <ChevronRight size={16} color="var(--text-3)" />
            </a>
          ))}
        </div>
      </Section>

      {/* ═══ PROFILE ═══ */}
      <Section icon={<User size={16} />} title="Profile">
        <Row label="Email" value={account?.email ?? "—"} muted />
        <Row label="Parent Names">
          {editingName ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
              <input
                value={parentNames}
                onChange={(e) => setParentNames(e.target.value)}
                style={inputStyle}
                placeholder="e.g. Dave & Amanda"
              />
              <button onClick={handleSaveName} disabled={savingName} style={btnSmall}>
                {savingName ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Save"}
              </button>
              <button onClick={() => setEditingName(false)} style={{ ...btnSmall, background: "transparent", color: "var(--text-3)" }}>
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, color: "var(--text)" }}>{family?.parentNames ?? "—"}</span>
              {nameSuccess && <Check size={14} style={{ color: "var(--green)" }} />}
              <button onClick={() => setEditingName(true)} style={editBtn}>Edit</button>
            </div>
          )}
        </Row>

        {/* Change Password */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 8 }}>
          {!showPassword ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "var(--text-2)" }}>Password</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {pwSuccess && <span style={{ fontSize: 12, color: "var(--green)" }}>Password updated ✓</span>}
                <button onClick={() => setShowPassword(true)} style={editBtn}>Change password</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="password" placeholder="Current password" value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)} style={inputStyle}
              />
              <input
                type="password" placeholder="New password (min 8 chars)" value={newPw}
                onChange={(e) => setNewPw(e.target.value)} style={inputStyle}
              />
              <input
                type="password" placeholder="Confirm new password" value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)} style={inputStyle}
              />
              {pwError && <p style={{ fontSize: 12, color: "#c0392b" }}>{pwError}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleChangePassword} disabled={savingPw} style={btnPrimary}>
                  {savingPw ? "Updating..." : "Update password"}
                </button>
                <button onClick={() => { setShowPassword(false); setPwError(""); }} style={btnGhost}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ═══ PLAN & BILLING ═══ */}
      <Section icon={<CreditCard size={16} />} title="Plan & Billing">
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
        }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: isPlus ? "var(--green)" : "var(--gold-dim)",
            color: isPlus ? "#fff" : "var(--gold)",
            border: isPlus ? "none" : "1px solid var(--gold-border)",
          }}>
            {isPlus && <Sparkles size={12} />}
            {isPlus ? "Our Fable+" : account?.planType === "pilot" ? "Pilot" : "Standard"}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-3)" }}>
            {account?.subscriptionStatus === "active" ? "Active" : account?.subscriptionStatus ?? "—"}
          </span>
        </div>

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--sage)", marginBottom: 10 }}>
            {isPlus ? "Plus features" : "Standard features"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(isPlus ? PLUS_FEATURES : STANDARD_FEATURES).map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-2)" }}>
                <Check size={12} style={{ color: "var(--green)", flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {isStandard && (
            <button onClick={handleUpgrade} disabled={upgrading} style={btnPrimary}>
              {upgrading ? "Redirecting..." : "Upgrade to Our Fable+"}
              <ChevronRight size={14} style={{ marginLeft: 4 }} />
            </button>
          )}
          {account?.stripeCustomerId && (
            <button onClick={handleManageBilling} style={btnGhost}>
              Manage billing
              <ChevronRight size={14} style={{ marginLeft: 4 }} />
            </button>
          )}
        </div>
      </Section>

      {/* ═══ STORAGE ═══ */}
      <Section icon={<HardDrive size={16} />} title="Storage">
        {(() => {
          // Use real storage data if available, otherwise show a default 0-usage state
          const displayStorage = storage ?? { used: 0, limit: isPlus ? 25 * 1024 * 1024 * 1024 : 5 * 1024 * 1024 * 1024, percentage: 0, planType: account?.planType ?? "standard" };
          const displayColor = displayStorage.percentage >= 90 ? "#c0392b" : displayStorage.percentage >= 70 ? "#d4a017" : "#4A5E4C";
          return (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "var(--text-2)" }}>
                  {formatBytes(displayStorage.used)} of {formatBytes(displayStorage.limit)} used
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: displayColor }}>
                  {displayStorage.percentage}%
                </span>
              </div>
              <div style={{
                height: 8, borderRadius: 4, background: "var(--border)",
                overflow: "hidden", marginBottom: 16,
              }}>
                <div style={{
                  height: "100%", borderRadius: 4, background: displayColor,
                  width: `${Math.min(displayStorage.percentage, 100)}%`,
                  transition: "width 0.6s ease",
                }} />
              </div>
              {isStandard && (
                <div style={{
                  background: "var(--gold-light)", border: "1px solid var(--gold-border)",
                  borderRadius: 10, padding: "14px 18px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Need more space?</p>
                    <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>Upgrade to Our Fable+ for 25 GB</p>
                  </div>
                  <button onClick={handleUpgrade} disabled={upgrading} style={{ ...btnSmall, background: "var(--green)", color: "#fff" }}>
                    Upgrade
                  </button>
                </div>
              )}
            </>
          );
        })()}
      </Section>

      {/* ═══ VAULT GUARDIANS ═══ */}
      <Section icon={<Users size={16} />} title="Vault Guardians">
        <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-3)", lineHeight: 1.65, marginBottom: 20 }}>
          If something happens to you, these people can trigger delivery of your child&apos;s vault. They can never see sealed content.
        </p>

        {!editingGuardians ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)" }}>Primary Guardian</span>
                <p style={{ fontSize: 14, color: "var(--text)", marginTop: 4 }}>
                  {fac1Name ? `${fac1Name} (${fac1Rel})` : "Not set"}
                </p>
                {fac1Email && <p style={{ fontSize: 12, color: "var(--text-3)" }}>{fac1Email}</p>}
              </div>
              {guardianSuccess && <Check size={14} style={{ color: "var(--green)" }} />}
            </div>
            {fac2Name && (
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)" }}>Secondary Guardian</span>
                <p style={{ fontSize: 14, color: "var(--text)", marginTop: 4 }}>{fac2Name} ({fac2Rel})</p>
                {fac2Email && <p style={{ fontSize: 12, color: "var(--text-3)" }}>{fac2Email}</p>}
              </div>
            )}
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)" }}>Child&apos;s Email</span>
              <p style={{ fontSize: 14, color: "var(--text)", marginTop: 4 }}>{childEmail || "Not set"}</p>
            </div>
            <button onClick={() => setEditingGuardians(true)} style={editBtn}>Edit guardians</button>

            {/* Dead man's switch toggle */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={notifyOnLapse}
                  onChange={async (e) => {
                    const val = e.target.checked;
                    setNotifyOnLapse(val);
                    setSavingLapse(true);
                    await convexMutate("ourfable:updateOurFableLapseNotification", {
                      familyId,
                      notifyFacilitatorOnLapse: val,
                    });
                    setSavingLapse(false);
                  }}
                  style={{ marginTop: 3, flexShrink: 0, width: 16, height: 16, accentColor: "var(--green)" }}
                />
                <div>
                  <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, display: "block", marginBottom: 2 }}>
                    Notify vault guardian if payments lapse
                    {savingLapse && <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 8 }}>Saving...</span>}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>
                    If your payments fail for more than 60 days, your vault guardian will be notified so they can keep the vault active.
                  </span>
                </div>
              </label>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--green)", marginBottom: 10 }}>Primary</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input value={fac1Name} onChange={(e) => setFac1Name(e.target.value)} placeholder="Name" style={inputStyle} />
                <input value={fac1Email} onChange={(e) => setFac1Email(e.target.value)} placeholder="Email" type="email" style={inputStyle} />
                <input value={fac1Rel} onChange={(e) => setFac1Rel(e.target.value)} placeholder="Relationship" style={inputStyle} />
              </div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--sage)", marginBottom: 10 }}>Secondary (optional)</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input value={fac2Name} onChange={(e) => setFac2Name(e.target.value)} placeholder="Name" style={inputStyle} />
                <input value={fac2Email} onChange={(e) => setFac2Email(e.target.value)} placeholder="Email" type="email" style={inputStyle} />
                <input value={fac2Rel} onChange={(e) => setFac2Rel(e.target.value)} placeholder="Relationship" style={inputStyle} />
              </div>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--sage)", marginBottom: 8 }}>Child&apos;s email</p>
              <input value={childEmail} onChange={(e) => setChildEmail(e.target.value)} placeholder="child@example.com" type="email" style={inputStyle} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleSaveGuardians} disabled={savingGuardians} style={btnPrimary}>
                {savingGuardians ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setEditingGuardians(false)} style={btnGhost}>Cancel</button>
            </div>
          </div>
        )}

        {/* Delivery milestones timeline */}
        {milestones.length > 0 && (
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Clock size={14} color="var(--green)" />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)" }}>
                Delivery Timeline
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {milestones.sort((a, b) => a.milestoneDate - b.milestoneDate).map((m) => (
                <div key={m._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {m.deliveryStatus === "delivered" ? (
                      <Check size={12} color="var(--green)" />
                    ) : (
                      <Gift size={12} color="var(--text-3)" />
                    )}
                    <span style={{ fontSize: 13, color: "var(--text)" }}>{m.milestoneName}</span>
                  </div>
                  <span style={{ fontSize: 12, color: m.deliveryStatus === "delivered" ? "var(--green)" : "var(--text-3)" }}>
                    {m.deliveryStatus === "delivered" ? "Delivered" : new Date(m.milestoneDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* ═══ LEGACY & GUARDIANS ═══ */}
      <Section icon={<Clock size={16} />} title="Legacy & Guardians">
        {/* Legacy Recording Toggle */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                Legacy Recording
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
                If you&apos;d like help recording what matters most — structured prompts designed for capturing your story, your voice, and your wishes for your child.
              </p>
              {legacyMode && (
                <div style={{
                  marginTop: 16,
                  padding: "14px 16px",
                  background: "var(--green-light)",
                  border: "1px solid var(--green-border)",
                  borderRadius: 10,
                }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--green)", marginBottom: 8 }}>Legacy prompts enabled in your vault:</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      "What do you want them to know about who you are?",
                      "What's the advice you most want to give?",
                      "What do you wish someone had told you at their age?",
                      "What are your hopes for their future?",
                      "What family stories should they carry forward?",
                      "Record a message they can play whenever they need to hear your voice.",
                    ].map((q) => (
                      <div key={q} style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <span style={{ color: "var(--green)", marginTop: 2, flexShrink: 0 }}>→</span>
                        <span style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ flexShrink: 0, paddingTop: 2 }}>
              <button
                onClick={async () => {
                  const newVal = !legacyMode;
                  setLegacyMode(newVal);
                  setSavingLegacy(true);
                  await convexMutate("ourfable:setLegacyMode", { familyId, enabled: newVal });
                  setSavingLegacy(false);
                }}
                disabled={savingLegacy}
                style={{
                  position: "relative",
                  width: 44, height: 24,
                  borderRadius: 12,
                  border: "none",
                  background: legacyMode ? "var(--green)" : "var(--border-dark)",
                  cursor: "pointer",
                  transition: "background 200ms",
                  padding: 0,
                }}
                aria-label="Toggle legacy recording"
              >
                <span style={{
                  position: "absolute",
                  top: 3, left: legacyMode ? 23 : 3,
                  width: 18, height: 18,
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  transition: "left 200ms",
                  display: "block",
                }} />
              </button>
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
          {/* Guardian Check-In Toggle */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                Guardian check-in
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
                If we don&apos;t hear from you for an extended period, we&apos;ll reach out to your vault guardian to make sure everything is okay.
              </p>
            </div>
            <div style={{ flexShrink: 0, paddingTop: 2 }}>
              <button
                onClick={async () => {
                  const newVal = !guardianCheckIn;
                  setGuardianCheckIn(newVal);
                  setSavingGuardianCheckIn(true);
                  await convexMutate("ourfable:setGuardianCheckIn", { familyId, enabled: newVal });
                  setSavingGuardianCheckIn(false);
                }}
                disabled={savingGuardianCheckIn}
                style={{
                  position: "relative",
                  width: 44, height: 24,
                  borderRadius: 12,
                  border: "none",
                  background: guardianCheckIn ? "var(--green)" : "var(--border-dark)",
                  cursor: "pointer",
                  transition: "background 200ms",
                  padding: 0,
                }}
                aria-label="Toggle guardian check-in"
              >
                <span style={{
                  position: "absolute",
                  top: 3, left: guardianCheckIn ? 23 : 3,
                  width: 18, height: 18,
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  transition: "left 200ms",
                  display: "block",
                }} />
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ TWO-FACTOR AUTH ═══ */}
      <Section icon={<Smartphone size={16} />} title="Two-Factor Authentication">
        {totpEnabled ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)" }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--green)" }}>2FA is enabled</span>
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-3)", lineHeight: 1.65, marginBottom: 16 }}>
              Your account is protected with two-factor authentication via authenticator app.
            </p>
            {!showDisable2fa ? (
              <button onClick={() => setShowDisable2fa(true)} style={{ ...btnGhost, color: "#c0392b", borderColor: "rgba(192,57,43,0.2)" }}>
                Disable 2FA
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input type="password" placeholder="Your password" value={disable2faPassword}
                  onChange={(e) => setDisable2faPassword(e.target.value)} style={inputStyle} />
                <input type="text" placeholder="6-digit code" value={disable2faCode} maxLength={6}
                  onChange={(e) => setDisable2faCode(e.target.value.replace(/\D/g, ""))} style={inputStyle} />
                {disable2faError && <p style={{ fontSize: 12, color: "#c0392b" }}>{disable2faError}</p>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleDisable2FA} disabled={disabling2fa} style={{ ...btnPrimary, background: "#c0392b" }}>
                    {disabling2fa ? "Disabling..." : "Disable 2FA"}
                  </button>
                  <button onClick={() => { setShowDisable2fa(false); setDisable2faError(""); }} style={btnGhost}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ) : confirming2fa ? (
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>Scan this QR code with your authenticator app:</p>
            {totpQrData ? (
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <img src={totpQrData} alt="2FA QR Code" style={{ width: 200, height: 200, borderRadius: 8 }} />
              </div>
            ) : (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 12, marginBottom: 20, wordBreak: "break-all" }}>
                <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>Manual entry URI:</p>
                <p style={{ fontSize: 12, color: "var(--text)", fontFamily: "monospace" }}>{totpSetupUri}</p>
              </div>
            )}
            <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 12 }}>Enter the 6-digit code from your authenticator app:</p>
            <input type="text" placeholder="123456" value={totpVerifyCode} maxLength={6}
              onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, ""))}
              style={{ ...inputStyle, textAlign: "center", fontSize: 24, letterSpacing: "0.3em" }} />
            {totpError && <p style={{ fontSize: 12, color: "#c0392b", marginTop: 8 }}>{totpError}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={handleConfirm2FA} disabled={totpVerifyCode.length < 6} style={btnPrimary}>Verify & enable</button>
              <button onClick={() => { setConfirming2fa(false); setTotpVerifyCode(""); setTotpError(""); }} style={btnGhost}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--text-3)", lineHeight: 1.65, marginBottom: 16 }}>
              Add an extra layer of security to your account. After enabling, you&apos;ll need your authenticator app code each time you sign in.
            </p>
            <button onClick={handleSetup2FA} disabled={setting2fa} style={btnPrimary}>
              <Lock size={14} style={{ marginRight: 4 }} />
              {setting2fa ? "Setting up..." : "Enable 2FA"}
            </button>
          </div>
        )}
      </Section>

      {/* ═══ DATA & PRIVACY ═══ */}
      <Section icon={<Shield size={16} />} title="Data & Privacy">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={handleExport} disabled={exporting} style={{ ...btnGhost, justifyContent: "flex-start" }}>
            <Download size={14} />
            {exporting ? "Preparing export..." : "Export all data"}
          </button>

          {!showDelete ? (
            <button onClick={() => setShowDelete(true)} style={{
              ...btnGhost, justifyContent: "flex-start", color: "#c0392b",
              borderColor: "rgba(192,57,43,0.2)",
            }}>
              <Trash2 size={14} />
              Delete account
            </button>
          ) : (
            <div style={{
              background: "#FEF2F2", border: "1px solid rgba(192,57,43,0.2)",
              borderRadius: 12, padding: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <AlertTriangle size={16} style={{ color: "#c0392b" }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#c0392b" }}>Delete your account?</span>
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "#7f1d1d", lineHeight: 1.65, marginBottom: 16 }}>
                This will cancel your subscription and deactivate your account. Your data will be retained for 30 days before permanent deletion.
              </p>
              <input
                type="password" placeholder="Enter your password to confirm"
                value={deletePw} onChange={(e) => setDeletePw(e.target.value)}
                style={{ ...inputStyle, borderColor: "rgba(192,57,43,0.3)" }}
              />
              {deleteError && <p style={{ fontSize: 12, color: "#c0392b", marginTop: 8 }}>{deleteError}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={handleDelete} disabled={deleting} style={{
                  ...btnPrimary, background: "#c0392b",
                }}>
                  {deleting ? "Deleting..." : "Permanently delete"}
                </button>
                <button onClick={() => { setShowDelete(false); setDeletePw(""); setDeleteError(""); }} style={btnGhost}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </Section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Shared Components ──────────────────────────────────────────────────────────

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)", padding: 24,
      marginBottom: 20, boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ color: "var(--green)" }}>{icon}</div>
        <h2 className="font-display" style={{
          fontSize: 20, fontWeight: 700,
          color: "var(--green)", letterSpacing: "0.02em",
        }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, muted, children }: { label: string; value?: string; muted?: boolean; children?: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 0", flexWrap: "wrap", gap: 8,
    }}>
      <span style={{ fontSize: 13, color: "var(--text-2)", minWidth: 100 }}>{label}</span>
      {children ?? (
        <span style={{ fontSize: 14, color: muted ? "var(--text-3)" : "var(--text)" }}>{value}</span>
      )}
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  fontSize: 14,
  border: "1px solid var(--border)",
  borderRadius: 10,
  background: "var(--bg)",
  color: "var(--text)",
  outline: "none",
  fontFamily: "inherit",
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "12px 24px", fontSize: 14, fontWeight: 600,
  background: "var(--green)", color: "#fff",
  border: "none", borderRadius: 100, cursor: "pointer",
  fontFamily: "var(--font-body)", letterSpacing: "-0.01em",
  transition: "background 160ms, transform 120ms",
};

const btnGhost: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "12px 24px", fontSize: 14, fontWeight: 500,
  background: "transparent", color: "var(--text-2)",
  border: "1.5px solid var(--border-dark)", borderRadius: 100, cursor: "pointer",
  fontFamily: "var(--font-body)",
  transition: "border-color 160ms, color 160ms",
};

const btnSmall: React.CSSProperties = {
  display: "inline-flex", alignItems: "center",
  padding: "6px 14px", fontSize: 12, fontWeight: 600,
  background: "var(--green-light)", color: "var(--green)",
  border: "1px solid var(--green-border)", borderRadius: 100, cursor: "pointer",
  fontFamily: "var(--font-body)", whiteSpace: "nowrap",
};

const editBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer",
  fontSize: 12, color: "var(--green)", fontWeight: 600,
  fontFamily: "var(--font-body)", padding: "2px 6px",
};
