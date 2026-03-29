"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Check, Shield, Sparkles, Users, Gift } from "lucide-react";

type PlanType = "standard" | "plus";
type BillingPeriod = "monthly" | "annual";

const PLAN_PRICES: Record<PlanType, Record<BillingPeriod, number>> = {
  standard: { monthly: 12, annual: 79 },
  plus: { monthly: 19, annual: 99 },
};

const NORMAL_PRICES: Record<PlanType, Record<BillingPeriod, number>> = {
  standard: { monthly: 12, annual: 99 },
  plus: { monthly: 19, annual: 149 },
};

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: done ? "var(--green)" : active ? "var(--gold-dim)" : "var(--surface)",
      border: `1px solid ${done || active ? "var(--green-border)" : "var(--border)"}`,
      fontSize: 11, fontWeight: 600,
      color: done ? "#0D0F0B" : active ? "var(--green)" : "var(--text-3)",
      transition: "all 300ms",
      flexShrink: 0,
    }}>
      {done ? <Check size={13} strokeWidth={2.5} aria-hidden="true" /> : n}
    </div>
  );
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} style={{
      display: "block", fontSize: 10, fontWeight: 500,
      letterSpacing: "0.15em", textTransform: "uppercase",
      color: "var(--text-3)", marginBottom: 8,
    }}>
      {children}
    </label>
  );
}

export default function SignupClient() {
  const searchParams = useSearchParams();
  const giftCodeParam = searchParams.get("gift") ?? "";
  const giftPlanParam = (searchParams.get("plan") ?? "standard") as PlanType;
  const isGiftRedemption = !!giftCodeParam;
  const isFoundingMember = searchParams.get("founding") === "true";
  const prefillEmail = searchParams.get("email") ?? "";
  const prefillChild = searchParams.get("child") ?? "";

  const [step, setStep] = useState(1);

  // Step 1
  const [childName, setChildName] = useState(prefillChild);
  const [childDob, setChildDob] = useState("");

  // Step 2
  const [parentNames, setParentNames] = useState("");

  // Step 3
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // Step 4 — Vault Guardians
  const [fac1Name, setFac1Name] = useState("");
  const [fac1Email, setFac1Email] = useState("");
  const [fac1Relationship, setFac1Relationship] = useState("");
  const [fac2Name, setFac2Name] = useState("");
  const [fac2Email, setFac2Email] = useState("");
  const [fac2Relationship, setFac2Relationship] = useState("");
  const [childEmail, setChildEmail] = useState("");
  const [noChildEmail, setNoChildEmail] = useState(false);
  const [notifyFacilitatorOnLapse, setNotifyFacilitatorOnLapse] = useState(true);

  // Step 5 — Plan selection
  const [planType, setPlanType] = useState<PlanType>(giftPlanParam === "plus" ? "plus" : "standard");
  const [billing, setBilling] = useState<BillingPeriod>("annual");
  const [coppaConsent, setCoppaConsent] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync plan type from URL param (gift redemption)
  useEffect(() => {
    if (giftPlanParam === "plus") setPlanType("plus");
  }, [giftPlanParam]);

  const childFirst = childName.split(" ")[0] || "your child";

  const canStep1 = childName.trim().length > 1 && !!childDob;
  const canStep2 = parentNames.trim().length > 1;
  const [tosConsent, setTosConsent] = useState(false);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canStep3 = emailValid && password.length >= 6 && password === passwordConfirm && tosConsent;
  const fac1EmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fac1Email.trim());
  const canStep4 = fac1Name.trim().length > 1 && fac1EmailValid && fac1Relationship.trim().length > 0;

  const selectedPrice = PLAN_PRICES[planType][billing];

  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      // Gift redemption: skip Stripe, create account directly
      if (isGiftRedemption && giftCodeParam) {
        const res = await fetch("/api/auth/create-gifted-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
            childName,
            childDob,
            parentNames,
            giftCode: giftCodeParam.toUpperCase(),
            facilitator1Name: fac1Name.trim() || undefined,
            facilitator1Email: fac1Email.trim() || undefined,
            facilitator1Relationship: fac1Relationship.trim() || undefined,
            facilitator2Name: fac2Name.trim() || undefined,
            facilitator2Email: fac2Email.trim() || undefined,
            facilitator2Relationship: fac2Relationship.trim() || undefined,
            childEmail: noChildEmail ? undefined : childEmail.trim() || undefined,
            notifyFacilitatorOnLapse,
          }),
        });
        const data = await res.json();
        if (res.ok && data.familyId) {
          const welcomeParams = new URLSearchParams({ familyId: data.familyId, child: childName.split(" ")[0], dob: childDob });
          window.location.href = `/welcome?${welcomeParams.toString()}`;
        } else {
          setError(data.error ?? "Something went wrong. Try again.");
          setLoading(false);
        }
        return;
      }

      // Normal Stripe checkout
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          childName,
          childDob,
          parentNames,
          planType,
          billingPeriod: billing,
          facilitator1Name: fac1Name.trim() || undefined,
          facilitator1Email: fac1Email.trim() || undefined,
          facilitator1Relationship: fac1Relationship.trim() || undefined,
          facilitator2Name: fac2Name.trim() || undefined,
          facilitator2Email: fac2Email.trim() || undefined,
          facilitator2Relationship: fac2Relationship.trim() || undefined,
          childEmail: noChildEmail ? undefined : childEmail.trim() || undefined,
          notifyFacilitatorOnLapse,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Something went wrong. Try again.");
        setLoading(false);
      }
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 24px",
    }}>

      {/* Logo */}
      <div style={{ marginBottom: isFoundingMember ? 24 : 48, textAlign: "center" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-playfair)", fontSize: 24, fontWeight: 700, color: "var(--green)", letterSpacing: "0.12em" }}>Our Fable</span>
        </Link>
      </div>

      {/* Founding Member Badge */}
      {isFoundingMember && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          marginBottom: 32, padding: "10px 20px",
          background: "rgba(200,168,122,0.08)",
          border: "1px solid rgba(200,168,122,0.25)",
          borderRadius: 100,
        }}>
          <Sparkles size={14} color="var(--gold, #C8A87A)" strokeWidth={2} />
          <span style={{
            fontFamily: "var(--font-playfair)", fontSize: 13, fontWeight: 600,
            color: "var(--gold, #C8A87A)", letterSpacing: "0.06em",
          }}>
            Founding Member
          </span>
        </div>
      )}

      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Step indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40, justifyContent: "center" }}>
          {[1, 2, 3, 4, 5].map((n, i) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StepDot n={n} active={step === n} done={step > n} />
              {i < 4 && (
                <div style={{ width: 20, height: 1, background: step > n ? "var(--green-border)" : "var(--border)" }} />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 1: Child ── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 30, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                Tell me about your child.
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
                This is who Our Fable is for. Everything will be built around them.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <Label htmlFor="signup-child-name">Child&apos;s full name</Label>
                <input
                  id="signup-child-name"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="e.g. Oliver James Miller"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="signup-child-dob">Date of birth</Label>
                <input
                  id="signup-child-dob"
                  type="date"
                  value={childDob}
                  onChange={(e) => setChildDob(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </div>
            </div>

            <button onClick={() => setStep(2)} disabled={!canStep1} className="btn-gold" style={{ justifyContent: "center" }}>
              Continue <ArrowRight size={15} aria-hidden="true" />
            </button>

            <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--green)", textDecoration: "none" }}>Sign in</Link>
            </p>
          </div>
        )}

        {/* ── Step 2: Parents ── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 30, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                And who are {childFirst}&apos;s parents?
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
                Shown in invite emails so family members know who set this up.
              </p>
            </div>

            <div>
              <Label htmlFor="signup-parent-names">Parent names</Label>
              <input
                id="signup-parent-names"
                value={parentNames}
                onChange={(e) => setParentNames(e.target.value)}
                placeholder="e.g. James & Emily"
                autoFocus
              />
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>
                Shown as: &ldquo;Set up by {parentNames || "the family"} — not on social, not public, just family.&rdquo;
              </p>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(1)} className="btn-outline" style={{ flex: "0 0 auto" }}>
                <ArrowLeft size={15} aria-hidden="true" />
              </button>
              <button onClick={() => setStep(3)} disabled={!canStep2} className="btn-gold" style={{ flex: 1, justifyContent: "center" }}>
                Continue <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Email + Password ── */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 30, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                Create your account.
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
                Your email is how you sign in. The password is shared with family members who need full access.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <Label htmlFor="signup-email">Email address</Label>
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="signup-password">Password</Label>
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <Label htmlFor="signup-password-confirm">Confirm password</Label>
                <input
                  id="signup-password-confirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
                {passwordConfirm && password !== passwordConfirm && (
                  <p style={{ fontSize: 12, color: "#E07070", marginTop: 6 }}>Passwords don&apos;t match</p>
                )}
              </div>
            </div>

            {/* Terms of Service consent */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={tosConsent}
                onChange={(e) => setTosConsent(e.target.checked)}
                style={{ marginTop: 3, flexShrink: 0, width: 16, height: 16, accentColor: "var(--green)" }}
              />
              <span style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
                I agree to the{" "}
                <Link href="/terms" style={{ color: "var(--green)", textDecoration: "underline" }}>Terms of Service</Link>{" "}
                and{" "}
                <Link href="/privacy" style={{ color: "var(--green)", textDecoration: "underline" }}>Privacy Policy</Link>.
              </span>
            </label>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(2)} className="btn-outline" style={{ flex: "0 0 auto" }}>
                <ArrowLeft size={15} aria-hidden="true" />
              </button>
              <button onClick={() => setStep(4)} disabled={!canStep3} className="btn-gold" style={{ flex: 1, justifyContent: "center" }}>
                Continue <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>

            {/* Summary card */}
            <div className="card" style={{ padding: "16px 20px" }}>
              <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>Your vault</p>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
                <span style={{ color: "var(--green)" }}>{childName}</span><br />
                Born {childDob ? new Date(childDob + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}<br />
                Parents: {parentNames}
              </p>
            </div>
          </div>
        )}

        {/* ── Step 4: Vault Guardians ── */}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <Users size={20} color="var(--green)" strokeWidth={1.5} />
                <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 30, fontWeight: 700, color: "var(--text)" }}>
                  Vault Guardians
                </h1>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
                If something happens to you, who should make sure {childFirst} receives their vault?
                These people can trigger delivery but can never see sealed content.
              </p>
            </div>

            {/* Primary Facilitator (required) */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--green)", marginBottom: 14 }}>
                Primary Guardian <span style={{ color: "var(--red)", fontSize: 9 }}>Required</span>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <Label htmlFor="fac1-name">Full name</Label>
                  <input id="fac1-name" value={fac1Name} onChange={(e) => setFac1Name(e.target.value)} placeholder="e.g. Sarah Johnson" />
                </div>
                <div>
                  <Label htmlFor="fac1-email">Email</Label>
                  <input id="fac1-email" type="email" value={fac1Email} onChange={(e) => setFac1Email(e.target.value)} placeholder="their@email.com" />
                </div>
                <div>
                  <Label htmlFor="fac1-rel">Relationship to {childFirst}</Label>
                  <input id="fac1-rel" value={fac1Relationship} onChange={(e) => setFac1Relationship(e.target.value)} placeholder="e.g. Aunt, Godparent, Family friend" />
                </div>
              </div>
            </div>

            {/* Secondary Facilitator (optional) */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 14 }}>
                Secondary Guardian <span style={{ fontSize: 9, color: "var(--text-4)" }}>Optional</span>
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <Label htmlFor="fac2-name">Full name</Label>
                  <input id="fac2-name" value={fac2Name} onChange={(e) => setFac2Name(e.target.value)} placeholder="e.g. Michael Chen" />
                </div>
                <div>
                  <Label htmlFor="fac2-email">Email</Label>
                  <input id="fac2-email" type="email" value={fac2Email} onChange={(e) => setFac2Email(e.target.value)} placeholder="their@email.com" />
                </div>
                <div>
                  <Label htmlFor="fac2-rel">Relationship to {childFirst}</Label>
                  <input id="fac2-rel" value={fac2Relationship} onChange={(e) => setFac2Relationship(e.target.value)} placeholder="e.g. Grandfather, Uncle" />
                </div>
              </div>
            </div>

            {/* Dead man's switch */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "16px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
              <input
                type="checkbox"
                checked={notifyFacilitatorOnLapse}
                onChange={(e) => setNotifyFacilitatorOnLapse(e.target.checked)}
                style={{ marginTop: 3, flexShrink: 0, width: 16, height: 16, accentColor: "var(--green)" }}
              />
              <div>
                <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, display: "block", marginBottom: 4 }}>
                  Notify my vault guardian if payments lapse for more than 60 days
                </span>
                <span style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.5 }}>
                  If something happens to you, this ensures your child&apos;s vault stays active.
                </span>
              </div>
            </label>

            {/* Child's email */}
            <div>
              <Label htmlFor="child-email">{childFirst}&apos;s email address</Label>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 8, lineHeight: 1.5 }}>
                We&apos;ll use this when it&apos;s time to deliver the vault.
              </p>
              {!noChildEmail && (
                <input id="child-email" type="email" value={childEmail} onChange={(e) => setChildEmail(e.target.value)} placeholder={`${childFirst.toLowerCase()}@example.com`} />
              )}
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={noChildEmail} onChange={(e) => { setNoChildEmail(e.target.checked); if (e.target.checked) setChildEmail(""); }}
                  style={{ width: 14, height: 14, accentColor: "var(--green)" }} />
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>They don&apos;t have one yet</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(3)} className="btn-outline" style={{ flex: "0 0 auto" }}>
                <ArrowLeft size={15} aria-hidden="true" />
              </button>
              <button onClick={() => setStep(5)} disabled={!canStep4} className="btn-gold" style={{ flex: 1, justifyContent: "center" }}>
                Continue <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Choose Plan ── */}
        {step === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-playfair)", fontSize: 30, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                {isGiftRedemption ? "You're all set." : "Choose your plan."}
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
                {isGiftRedemption
                  ? `Your gift covers the first year — no payment needed. Review your plan and create your vault.`
                  : `${childFirst}'s vault, monthly prompts, sealed letters — all included. Pick the plan that fits your family.`
                }
              </p>
            </div>

            {/* Gift redemption banner */}
            {isGiftRedemption && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "var(--green-light)", border: "1px solid var(--green-border)", borderRadius: 12, padding: "16px 20px" }}>
                <Gift size={18} color="var(--green)" strokeWidth={1.75} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--green)", marginBottom: 4 }}>Gift code applied: {giftCodeParam.toUpperCase()}</p>
                  <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>Your first year is covered. No credit card required today.</p>
                </div>
              </div>
            )}

            {/* Billing toggle */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ display: "inline-flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 3 }}>
                <button
                  onClick={() => setBilling("monthly")}
                  style={{
                    padding: "8px 18px", borderRadius: 8, border: "none",
                    background: billing === "monthly" ? "var(--green)" : "transparent",
                    color: billing === "monthly" ? "#fff" : "var(--text-3)",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 200ms",
                  }}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling("annual")}
                  style={{
                    padding: "8px 18px", borderRadius: 8, border: "none",
                    background: billing === "annual" ? "var(--green)" : "transparent",
                    color: billing === "annual" ? "#fff" : "var(--text-3)",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 200ms",
                  }}
                >
                  Annual
                </button>
              </div>
            </div>

            {/* Plan cards */}
            <div style={{ display: "flex", gap: 12 }}>
              {/* Standard */}
              <button
                onClick={() => setPlanType("standard")}
                style={{
                  flex: 1,
                  padding: "20px 16px",
                  borderRadius: 12,
                  border: `2px solid ${planType === "standard" ? "var(--green)" : "var(--border)"}`,
                  background: planType === "standard" ? "var(--green-light)" : "var(--surface)",
                  cursor: "pointer",
                  textAlign: "left",
                  position: "relative",
                  transition: "all 200ms",
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--green)", marginBottom: 6 }}>
                  Our Fable
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                  <p style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-cormorant)", margin: 0 }}>
                    ${PLAN_PRICES.standard[billing]}
                  </p>
                  {isFoundingMember && billing === "annual" && NORMAL_PRICES.standard.annual !== PLAN_PRICES.standard.annual && (
                    <p style={{ fontSize: 14, color: "var(--text-3)", textDecoration: "line-through", margin: 0 }}>
                      ${NORMAL_PRICES.standard.annual}
                    </p>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 10 }}>
                  {billing === "monthly" ? "per month" : "per year"}
                </p>
                <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.7 }}>
                  <p>Up to 10 circle members</p>
                  <p>5GB storage</p>
                </div>
                {planType === "standard" && (
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 4 }}>
                    <Check size={11} strokeWidth={2.5} color="var(--green)" />
                    <span style={{ fontSize: 11, color: "var(--green)" }}>Selected</span>
                  </div>
                )}
              </button>

              {/* Plus */}
              <button
                onClick={() => setPlanType("plus")}
                style={{
                  flex: 1,
                  padding: "20px 16px",
                  borderRadius: 12,
                  border: `2px solid ${planType === "plus" ? "var(--green)" : "var(--border)"}`,
                  background: planType === "plus" ? "var(--green-light)" : "var(--surface)",
                  cursor: "pointer",
                  textAlign: "left",
                  position: "relative",
                  transition: "all 200ms",
                }}
              >
                {/* Popular badge */}
                <div style={{
                  position: "absolute", top: -10, right: 12,
                  background: "var(--green)", color: "#fff",
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                  padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <Sparkles size={10} strokeWidth={2.5} /> Popular
                </div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--green)", marginBottom: 6 }}>
                  Our Fable+
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                  <p style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-cormorant)", margin: 0 }}>
                    ${PLAN_PRICES.plus[billing]}
                  </p>
                  {isFoundingMember && billing === "annual" && NORMAL_PRICES.plus.annual !== PLAN_PRICES.plus.annual && (
                    <p style={{ fontSize: 14, color: "var(--text-3)", textDecoration: "line-through", margin: 0 }}>
                      ${NORMAL_PRICES.plus.annual}
                    </p>
                  )}
                </div>
                <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 10 }}>
                  {billing === "monthly" ? "per month" : "per year"}
                </p>
                <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.7 }}>
                  <p>Dispatches + Voice Messages</p>
                  <p>Unlimited circle · 25GB</p>
                </div>
                {planType === "plus" && (
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 4 }}>
                    <Check size={11} strokeWidth={2.5} color="var(--green)" />
                    <span style={{ fontSize: 11, color: "var(--green)" }}>Selected</span>
                  </div>
                )}
              </button>
            </div>

            {billing === "annual" && (
              <p style={{ fontSize: 12, color: "var(--green)", textAlign: "center", fontWeight: 500 }}>
                {planType === "standard" ? "Save $65/yr vs monthly" : "Save $129/yr vs monthly"}
              </p>
            )}

            {/* Age Verification */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                style={{ marginTop: 3, flexShrink: 0, width: 16, height: 16, accentColor: "var(--green)" }}
              />
              <span style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
                I confirm I am 18 years of age or older.
              </span>
            </label>

            {/* COPPA Consent */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={coppaConsent}
                onChange={(e) => setCoppaConsent(e.target.checked)}
                style={{ marginTop: 3, flexShrink: 0, width: 16, height: 16, accentColor: "var(--green)" }}
              />
              <span style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>
                I confirm I am the parent or legal guardian of this child and consent to the collection of their information per our{" "}
                <Link href="/privacy" style={{ color: "var(--green)", textDecoration: "underline" }}>Privacy Policy</Link>.
              </span>
            </label>

            {error && (
              <p style={{ fontSize: 13, color: "#E07070", textAlign: "center" }}>{error}</p>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(4)} className="btn-outline" style={{ flex: "0 0 auto" }}>
                <ArrowLeft size={15} aria-hidden="true" />
              </button>
              <button
                onClick={handleCheckout}
                disabled={loading || !coppaConsent || !ageConfirmed}
                className="btn-gold"
                style={{ flex: 1, justifyContent: "center", fontSize: 15, padding: "16px 24px" }}
              >
                {loading
                ? "Creating your vault…"
                : isGiftRedemption
                  ? <>Create my vault — free with gift <ArrowRight size={15} aria-hidden="true" /></>
                  : <>Continue to Payment — ${selectedPrice}{billing === "monthly" ? "/mo" : "/yr"} <ArrowRight size={15} aria-hidden="true" /></>
              }
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: -8 }}>
              <Shield size={12} color="var(--text-3)" strokeWidth={1.5} aria-hidden="true" />
              <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                Secure checkout via Stripe · Cancel anytime
              </p>
            </div>

            {/* Summary */}
            <div className="card" style={{ padding: "16px 20px" }}>
              <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 8, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>Your vault</p>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
                <span style={{ color: "var(--green)" }}>{childName}</span><br />
                Born {childDob ? new Date(childDob + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}<br />
                Parents: {parentNames}<br />
                Account: {email}<br />
                Plan: {planType === "plus" ? "Our Fable+" : "Our Fable"} · {billing === "annual" ? "Annual" : "Monthly"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
