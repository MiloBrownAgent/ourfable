import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { addAccount } from "@/lib/accounts";
import { internalConvexQuery, internalConvexMutation } from "@/lib/convex-internal";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY required");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET required");
  return secret;
}

const RESEND_API_KEY = process.env.RESEND_FULL_API_KEY ?? "";
async function sendResendEmail(to: string, subject: string, html: string, extraHeaders?: Record<string, string>) {
  if (!RESEND_API_KEY) {
    console.warn("[webhook] No RESEND_FULL_API_KEY — skipping email to", to);
    return;
  }
  const headers: Record<string, string> = {
    "List-Unsubscribe": "<https://ourfable.ai/unsubscribe>",
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    ...extraHeaders,
  };
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Our Fable <hello@ourfable.ai>",
      to,
      subject,
      html,
      headers,
    }),
  });
}

function emailFooter(lightMode = true): string {
  if (lightMode) {
    return `<tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#9A9590;">ourfable.ai</p>
          <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;color:#B0A9A0;"><a href="https://ourfable.ai/unsubscribe" style="color:#B0A9A0;text-decoration:underline;">Unsubscribe</a></p>
        </td></tr>`;
  }
  return `<tr><td align="center" style="padding-top:32px;">
          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;color:rgba(245,242,237,0.3);">ourfable.ai</p>
          <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;color:rgba(245,242,237,0.2);"><a href="https://ourfable.ai/unsubscribe" style="color:rgba(245,242,237,0.2);text-decoration:underline;">Unsubscribe</a></p>
        </td></tr>`;
}

// POST /api/stripe/webhook
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, sig, getWebhookSecret());
  } catch (err) {
    console.error("[webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const meta = checkoutSession.metadata ?? {};
        if (meta.type === "gift") {
          await handleGiftCheckoutCompleted(checkoutSession);
        } else if (meta.type === "child_addon") {
          await handleChildAddonCompleted(checkoutSession);
        } else if (meta.upgradeTo === "plus") {
          await handleUpgradeCompleted(checkoutSession);
        } else {
          await handleCheckoutCompleted(checkoutSession);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        console.log(`[webhook] Subscription cancelled: ${sub.id} customer=${customerId}`);

        // Check if this is a child add-on subscription
        const subMeta = sub.metadata ?? {};
        if (subMeta.type === "child_addon" && subMeta.childId) {
          console.log(`[webhook] Child add-on cancelled: childId=${subMeta.childId}`);
          // Deactivate child but preserve vault data
          await convexMutation("ourfable:removeChild", {
            childId: subMeta.childId,
          }).catch((err) => {
            console.warn("[webhook] removeChild failed (non-fatal):", err);
          });
          break;
        }

        if (customerId) {
          // Mark as intentionally cancelled — do NOT trigger dead man's switch
          await internalConvexMutation("ourfable:updateOurFableSubscriptionStatus", {
            stripeCustomerId: customerId,
            subscriptionStatus: "cancelled",
          });

          // Send cancellation save email
          const cancelFamily = await internalConvexQuery("ourfable:getOurFableFamilyByStripeCustomer", { stripeCustomerId: customerId }) as { email: string; childName: string; familyId: string } | null;
          if (cancelFamily?.email) {
            const childFirst = cancelFamily.childName.split(" ")[0];
            await sendResendEmail(
              cancelFamily.email,
              "Your vault is safe — for now",
              `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#FDFBF7;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FDFBF7" style="padding:64px 20px 80px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="padding-bottom:28px;">
          <div style="width:56px;height:56px;border-radius:50%;border:1.5px solid #C8D4C9;background:#F0F5F0;display:inline-flex;align-items:center;justify-content:center;">
            <span style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#4A5E4C;">Our Fable</span>
          </div>
        </td></tr>
        <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
          <table width="100%"><tr><td style="background:#4A5E4C;height:3px;font-size:0;">&nbsp;</td></tr></table>
          <table width="100%"><tr><td style="padding:44px;">
            <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">We're sorry to see you go</p>
            <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;color:#1A1A18;line-height:1.3;">Your vault is safe — for now</p>
            <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">${childFirst}'s vault content — every letter, photo, and voice memo — will be preserved for 30 days. After that, it may be permanently removed.</p>
            <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">The letters don't disappear. But new ones stop coming.</p>
            <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">Changed your mind? You can reactivate anytime within 30 days and pick up right where you left off.</p>
            <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:100px;background:#4A5E4C;">
              <a href="https://ourfable.ai/login" style="display:inline-block;padding:13px 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;">Reactivate your vault →</a>
            </td></tr></table>
          </td></tr></table>
        </td></tr>
        ${emailFooter(true)}
      </table>
    </td></tr>
  </table>
</body></html>`
            ).catch((err) => {
              console.warn("[webhook] Cancellation save email failed (non-fatal):", err);
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        console.log(`[webhook] Subscription updated: ${sub.id} status=${sub.status}`);
        if (customerId) {
          let planType: string | undefined;
          const item = sub.items?.data?.[0];
          if (item?.price?.recurring?.interval === "month") planType = "monthly";
          else if (item?.price?.recurring?.interval === "year") planType = "annual";

          await internalConvexMutation("ourfable:updateOurFableSubscriptionStatus", {
            stripeCustomerId: customerId,
            subscriptionStatus: sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : sub.status,
            planType,
            stripeSubscriptionId: sub.id,
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : (invoice.customer as Stripe.Customer)?.id;
        console.log(`[webhook] Payment failed: invoice=${invoice.id} customer=${customerId}`);

        if (customerId) {
          // Update status to past_due
          await internalConvexMutation("ourfable:updateOurFableSubscriptionStatus", {
            stripeCustomerId: customerId,
            subscriptionStatus: "past_due",
          });

          const family = await internalConvexQuery("ourfable:getOurFableFamilyByStripeCustomer", { stripeCustomerId: customerId }) as {
            email: string;
            childName: string;
            familyId: string;
            consecutivePaymentFailures?: number;
            notifyFacilitatorOnLapse?: boolean;
            subscriptionStatus?: string;
            facilitator1Email?: string;
            facilitator1Name?: string;
            facilitator2Email?: string;
            facilitator2Name?: string;
            lastFacilitatorBillingNotification?: number;
          } | null;

          if (family?.email) {
            // ── Dead man's switch: track consecutive failures ──────────────────
            const failures = (family.consecutivePaymentFailures ?? 0) + 1;
            await internalConvexMutation("ourfable:updateOurFablePaymentFailures", {
              familyId: family.familyId,
              consecutivePaymentFailures: failures,
            });

            // Send dunning email to parent
            await sendResendEmail(
              family.email,
              "Action needed: Your Our Fable payment failed",
              `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>Payment failed</title></head>
<body style="margin:0;padding:0;background:#FDFBF7;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FDFBF7" style="padding:64px 20px 80px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="padding-bottom:28px;">
          <div style="width:56px;height:56px;border-radius:50%;border:1.5px solid #C8D4C9;background:#F0F5F0;display:inline-flex;align-items:center;justify-content:center;">
            <span style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#4A5E4C;">Our Fable</span>
          </div>
        </td></tr>
        <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
          <table width="100%"><tr><td style="background:#4A5E4C;height:3px;font-size:0;">&nbsp;</td></tr></table>
          <table width="100%"><tr><td style="padding:44px;">
            <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">Action needed</p>
            <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;color:#1A1A18;line-height:1.3;">Payment failed</p>
            <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">We weren't able to process your latest payment for Our Fable. Please update your payment method to keep ${family.childName}'s vault active.</p>
            <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">If your payment isn't updated within 7 days, your subscription will be paused.</p>
            <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:100px;background:#4A5E4C;">
              <a href="https://ourfable.ai/login" style="display:inline-block;padding:13px 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;">Update payment →</a>
            </td></tr></table>
          </td></tr></table>
        </td></tr>
        ${emailFooter(true)}
      </table>
    </td></tr>
  </table>
</body></html>`
            );

            // Log dispatch
            await convexMutation("ourfable:createOurFableDispatch", {
              familyId: family.familyId,
              type: "dunning",
              content: "Payment failed dunning email sent",
              sentTo: family.email,
            }).catch(() => {});

            // ── Dead man's switch: notify facilitator if conditions met ────────
            // Only triggers on passive payment failure (not intentional cancel)
            if (
              failures >= 2 &&
              family.notifyFacilitatorOnLapse !== false &&
              family.subscriptionStatus !== "cancelled"
            ) {
              const now = Date.now();
              const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
              const lastNotified = family.lastFacilitatorBillingNotification ?? 0;
              const childFirst = family.childName.split(" ")[0];

              // Determine which facilitator to notify
              let facilitatorEmail: string | undefined;
              let facilitatorName: string | undefined;

              if (lastNotified === 0 && family.facilitator1Email) {
                facilitatorEmail = family.facilitator1Email;
                facilitatorName = family.facilitator1Name ?? "Vault Guardian";
              } else if (lastNotified > 0 && (now - lastNotified) >= THIRTY_DAYS_MS && family.facilitator2Email) {
                facilitatorEmail = family.facilitator2Email;
                facilitatorName = family.facilitator2Name ?? "Vault Guardian";
              }

              if (facilitatorEmail) {
                await sendResendEmail(
                  facilitatorEmail,
                  `${childFirst}'s Our Fable vault needs attention`,
                  `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#FDFBF7;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FDFBF7" style="padding:64px 20px 80px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="padding-bottom:28px;">
          <div style="width:56px;height:56px;border-radius:50%;border:1.5px solid #C8D4C9;background:#F0F5F0;display:inline-flex;align-items:center;justify-content:center;">
            <span style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#4A5E4C;">Our Fable</span>
          </div>
        </td></tr>
        <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
          <table width="100%"><tr><td style="background:#4A5E4C;height:3px;font-size:0;">&nbsp;</td></tr></table>
          <table width="100%"><tr><td style="padding:44px;">
            <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">Vault Guardian Notice</p>
            <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;color:#1A1A18;line-height:1.3;">${childFirst}'s vault needs attention</p>
            <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">Hi ${facilitatorName},</p>
            <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">You were designated as a vault guardian for ${childFirst}'s Our Fable vault. The account's payments have lapsed for an extended period.</p>
            <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">If you'd like to keep ${childFirst}'s vault active — preserving every letter, photo, and voice memo sealed inside — you can take over billing.</p>
            <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">There's no pressure. But the vault will be at risk of deactivation if billing isn't resumed.</p>
            <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:100px;background:#4A5E4C;">
              <a href="https://ourfable.ai/facilitator-billing/${family.familyId}" style="display:inline-block;padding:13px 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;">Take over billing →</a>
            </td></tr></table>
          </td></tr></table>
        </td></tr>
        ${emailFooter(true)}
      </table>
    </td></tr>
  </table>
</body></html>`
                ).catch((err) => {
                  console.warn("[webhook] Facilitator billing notification failed (non-fatal):", err);
                });

                // Record notification timestamp
                await internalConvexMutation("ourfable:updateOurFableFacilitatorNotification", {
                  familyId: family.familyId,
                  lastFacilitatorBillingNotification: now,
                }).catch(() => {});

                console.log(`[webhook] Dead man's switch: notified ${facilitatorEmail} for family=${family.familyId}`);
              }
            }
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : (invoice.customer as Stripe.Customer)?.id;
        console.log(`[webhook] Payment succeeded: invoice=${invoice.id} customer=${customerId}`);

        if (customerId) {
          // Reset consecutive payment failures on successful payment
          const family = await internalConvexQuery("ourfable:getOurFableFamilyByStripeCustomer", { stripeCustomerId: customerId }) as {
            familyId: string;
          } | null;

          if (family) {
            await internalConvexMutation("ourfable:updateOurFablePaymentFailures", {
              familyId: family.familyId,
              consecutivePaymentFailures: 0,
            }).catch(() => {});
          }
        }
        break;
      }

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event.type}:`, err);
    return NextResponse.json({ received: true, warning: "Handler error — check logs" });
  }

  return NextResponse.json({ received: true });
}

async function handleUpgradeCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  const { familyId, email, billingPeriod } = meta;

  if (!familyId || !email) {
    console.error("[webhook] upgrade checkout — missing metadata", meta);
    return;
  }

  const stripeCustomerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? undefined;
  const stripeSubscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? undefined;

  await internalConvexMutation("ourfable:updateOurFableSubscriptionStatus", {
    familyId,
    stripeCustomerId,
    subscriptionStatus: "active",
    planType: "plus",
    stripeSubscriptionId,
  });

  console.log(`[webhook] ✅ Upgrade completed: familyId=${familyId} → plus (${billingPeriod})`);

  await sendResendEmail(
    email,
    "Welcome to Our Fable+",
    `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>Welcome to Our Fable+</title></head>
<body style="margin:0;padding:0;background:#FDFBF7;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FDFBF7" style="padding:64px 20px 80px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="padding-bottom:28px;">
          <div style="width:56px;height:56px;border-radius:50%;border:1.5px solid #C8D4C9;background:#F0F5F0;display:inline-flex;align-items:center;justify-content:center;">
            <span style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#4A5E4C;">Our Fable+</span>
          </div>
        </td></tr>
        <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
          <table width="100%"><tr><td style="background:linear-gradient(135deg,#4A5E4C,#6B8F6F);height:3px;font-size:0;">&nbsp;</td></tr></table>
          <table width="100%"><tr><td style="padding:44px;">
            <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">Upgrade complete</p>
            <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;color:#1A1A18;line-height:1.3;">Welcome to Our Fable+</p>
            <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">Your upgrade is live. Here's what you've unlocked:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr><td style="padding:10px 0;border-bottom:1px solid #F0ECE6;">
                <span style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#4A5E4C;font-weight:600;">✦</span>
                <span style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6B6860;margin-left:8px;">25 GB storage (up from 5 GB)</span>
              </td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #F0ECE6;">
                <span style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#4A5E4C;font-weight:600;">✦</span>
                <span style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6B6860;margin-left:8px;">Priority support</span>
              </td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #F0ECE6;">
                <span style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#4A5E4C;font-weight:600;">✦</span>
                <span style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6B6860;margin-left:8px;">Unlimited circle members</span>
              </td></tr>
              <tr><td style="padding:10px 0;border-bottom:1px solid #F0ECE6;">
                <span style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#4A5E4C;font-weight:600;">✦</span>
                <span style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6B6860;margin-left:8px;">Video messages up to 10 minutes</span>
              </td></tr>
              <tr><td style="padding:10px 0;">
                <span style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#4A5E4C;font-weight:600;">✦</span>
                <span style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6B6860;margin-left:8px;">Annual print book included</span>
              </td></tr>
            </table>
            <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:100px;background:#4A5E4C;">
              <a href="https://ourfable.ai/${familyId}/settings" style="display:inline-block;padding:13px 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;">View your account →</a>
            </td></tr></table>
          </td></tr></table>
        </td></tr>
        ${emailFooter(true)}
      </table>
    </td></tr>
  </table>
</body></html>`
  ).catch((err) => {
    console.warn("[webhook] Upgrade confirmation email failed (non-fatal):", err);
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  const { email, childName, childDob, parentNames, plan, planType: metaPlanType, billingPeriod } = meta;
  const planType = metaPlanType ?? "standard";
  const resolvedPlan = billingPeriod ?? plan ?? "annual";

  if (!email || !childName) {
    console.error("[webhook] checkout.session.completed — missing metadata", meta);
    throw new Error("Missing required metadata fields");
  }

  // Idempotency: check if family already exists by email
  const existing = await internalConvexQuery("ourfable:getOurFableFamilyByEmail", { email: email.toLowerCase().trim() });
  if (existing) {
    console.log(`[webhook] Family already exists for email=${email} — skipping creation (idempotent)`);
    return;
  }

  const firstNameSlug = childName
    .split(" ")[0]
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .slice(0, 12);
  const familyId = `${firstNameSlug}-${Date.now().toString(36)}`;

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? undefined;

  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? undefined;

  // 1. Create family in Convex (legacy ourfable_vault_families table)
  await internalConvexMutation("ourfable:createFamily", {
    familyId,
    childName,
    childDob: childDob ?? "",
    parentNames: parentNames ?? "",
    parentEmail: email,
    plan: resolvedPlan,
    stripeCustomerId,
    stripeSubscriptionId,
  });

  // 2. Seed default content
  await convexMutation("ourfable:seedCircle", { familyId }).catch((err) => {
    console.warn("[webhook] seedCircle failed (non-fatal):", err);
  });
  await convexMutation("ourfable:seedMilestones", { familyId }).catch((err) => {
    console.warn("[webhook] seedMilestones failed (non-fatal):", err);
  });
  await convexMutation("ourfable:seedFirstLetter", { familyId }).catch((err) => {
    console.warn("[webhook] seedFirstLetter failed (non-fatal):", err);
  });

  // 3. Register account — retrieve password hash from Convex signup token (C4 security fix)
  let passwordHash = "";
  if (meta.signup_token) {
    const signupData = await internalConvexQuery("ourfable:getSignupToken", { token: meta.signup_token }) as {
      passwordHash: string;
      consumed?: boolean;
      expiresAt: number;
    } | null;
    if (signupData && !signupData.consumed && Date.now() < signupData.expiresAt) {
      passwordHash = signupData.passwordHash;
      // Consume and delete the token
      await internalConvexMutation("ourfable:consumeSignupToken", { token: meta.signup_token }).catch(() => {});
    }
  }
  // Legacy password_hash fallback removed for security (C4 fix).
  // All new checkouts use signup_token flow.
  await addAccount({
    email: email.toLowerCase(),
    passwordHash,
    familyId,
    childName,
    parentNames: parentNames ?? "",
    planType,
    stripeCustomerId,
    stripeSubscriptionId,
    birthDate: childDob,
  });

  console.log(`[webhook] ✅ Family created: familyId=${familyId} email=${email} planType=${planType} billing=${resolvedPlan}`);

  // 3b. Save facilitator info + dead man's switch preference
  const {
    facilitator1Name, facilitator1Email, facilitator1Relationship,
    facilitator2Name, facilitator2Email, facilitator2Relationship,
    childEmail: metaChildEmail,
    notifyFacilitatorOnLapse,
  } = meta;

  if (facilitator1Name || facilitator1Email) {
    await convexMutation("ourfable:updateOurFableFacilitators", {
      familyId,
      facilitator1Name: facilitator1Name || undefined,
      facilitator1Email: facilitator1Email || undefined,
      facilitator1Relationship: facilitator1Relationship || undefined,
      facilitator2Name: facilitator2Name || undefined,
      facilitator2Email: facilitator2Email || undefined,
      facilitator2Relationship: facilitator2Relationship || undefined,
      childEmail: metaChildEmail || undefined,
    }).catch((err) => {
      console.warn("[webhook] updateOurFableFacilitators failed (non-fatal):", err);
    });
  }

  // Save dead man's switch preference
  await convexMutation("ourfable:updateOurFableLapseNotification", {
    familyId,
    notifyFacilitatorOnLapse: notifyFacilitatorOnLapse !== "false",
  }).catch((err) => {
    console.warn("[webhook] updateOurFableLapseNotification failed (non-fatal):", err);
  });

  // 3c. Create delivery milestones
  if (childDob) {
    await convexMutation("ourfable:createOurFableDeliveryMilestones", {
      familyId,
      childDob,
    }).catch((err) => {
      console.warn("[webhook] createOurFableDeliveryMilestones failed (non-fatal):", err);
    });
  }

  // 4. Send welcome email
  const childFirst = childName.split(" ")[0];
  await sendResendEmail(
    email,
    "Welcome to Our Fable",
    `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>Welcome to Our Fable</title></head>
<body style="margin:0;padding:0;background:#FDFBF7;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FDFBF7" style="padding:64px 20px 80px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="padding-bottom:28px;">
          <div style="width:56px;height:56px;border-radius:50%;border:1.5px solid #C8D4C9;background:#F0F5F0;display:inline-flex;align-items:center;justify-content:center;">
            <span style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#4A5E4C;">Our Fable</span>
          </div>
        </td></tr>
        <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
          <table width="100%"><tr><td style="background:#4A5E4C;height:3px;font-size:0;">&nbsp;</td></tr></table>
          <table width="100%"><tr><td style="padding:44px;">
            <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">Welcome</p>
            <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;color:#1A1A18;line-height:1.3;">${childFirst}'s story starts now.</p>
            <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">Welcome to Our Fable. ${childFirst}'s vault is ready — and the people who love them most can start contributing right away.</p>
            <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:#1A1A18;">Your first step: invite your circle.</p>
            <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#6A6660;line-height:1.7;">Add grandparents, aunts, uncles, godparents — anyone whose voice matters. They'll each get monthly prompts to write, record, or photograph something for ${childFirst}.</p>
            <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:100px;background:#4A5E4C;">
              <a href="https://ourfable.ai/${familyId}" style="display:inline-block;padding:13px 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;">Go to your dashboard →</a>
            </td></tr></table>
            <div style="margin-top:28px;padding-top:20px;border-top:1px solid #F0ECE6;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#9A9590;line-height:1.7;">Sign in anytime at <a href="https://ourfable.ai/login" style="color:#4A5E4C;text-decoration:underline;">ourfable.ai/login</a> with your email.</p>
            </div>
          </td></tr></table>
        </td></tr>
        ${emailFooter(true)}
      </table>
    </td></tr>
  </table>
</body></html>`
  ).catch((err) => {
    console.warn("[webhook] Welcome email failed (non-fatal):", err);
  });
}


async function handleGiftCheckoutCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  const { giftCode, recipientEmail, gifterName, gifterEmail, gifterMessage, planType, billingPeriod } = meta;

  if (!giftCode || !recipientEmail || !gifterName) {
    console.error("[webhook] gift checkout — missing metadata", meta);
    return;
  }

  // 1. Mark gift as paid in Convex
  await internalConvexMutation("ourfable:updateGiftStatus", {
    giftCode,
    status: "paid",
    stripeSessionId: session.id,
  });

  console.log(`[webhook] ✅ Gift paid: code=${giftCode} recipient=${recipientEmail} plan=${planType}`);

  const redeemUrl = `https://ourfable.ai/redeem/${giftCode}`;
  const planLabel = planType === "plus" ? "Our Fable+" : "Our Fable";
  const unsubHeaders = {
    "List-Unsubscribe": "<https://ourfable.ai/unsubscribe>",
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };

  // 2. Send gift notification email to recipient
  await sendResendEmail(
    recipientEmail,
    "Someone special gave you Our Fable.",
    `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>Someone special gave you Our Fable.</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background:#F5F2ED;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F5F2ED" style="padding:64px 20px 80px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-family:Georgia,'Playfair Display',serif;font-size:13px;font-weight:700;color:#4A5E4C;letter-spacing:0.22em;text-transform:uppercase;">Our Fable</span>
        </td></tr>
        <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
          <table width="100%"><tr><td style="background:#4A5E4C;height:3px;font-size:0;">&nbsp;</td></tr></table>
          <table width="100%"><tr><td style="padding:48px 44px;">
            <p style="margin:0 0 10px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8A9E8C;">A gift from ${gifterName}</p>
            <p style="margin:0 0 28px;font-family:Georgia,'Playfair Display',serif;font-size:28px;font-weight:700;color:#1A1A18;line-height:1.25;">Someone who loves your family just gave you something extraordinary.</p>
            <p style="margin:0 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#5A5650;line-height:1.8;">
              ${gifterName} has given you <strong>${planLabel}</strong> — a private memory vault where the people who love your child leave letters, voice notes, photos, and video, all sealed until your child is old enough to read them.
            </p>
            ${gifterMessage ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td style="border-left:3px solid #C8D4C9;padding:14px 20px;background:#F8FAF8;border-radius:0 10px 10px 0;">
                  <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">From ${gifterName}</p>
                  <p style="margin:0;font-family:Georgia,'Playfair Display',serif;font-size:15px;color:#4A4A48;line-height:1.75;font-style:italic;">"${gifterMessage}"</p>
                </td>
              </tr>
            </table>` : ""}
            <p style="margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#5A5650;line-height:1.8;">
              Our Fable is a sealed vault where the people who love your child leave letters, voice notes, photos, and video — all sealed until your child is old enough to read them.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;"><tr><td style="border-radius:100px;background:#4A5E4C;">
              <a href="${redeemUrl}" style="display:inline-block;padding:15px 32px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;color:#FFFFFF;text-decoration:none;letter-spacing:0.02em;">Open your gift →</a>
            </td></tr></table>
            <div style="background:#F8F5F0;border:1px solid #E8E4DE;border-radius:14px;padding:20px 24px;text-align:center;">
              <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#9A9590;">Your gift code</p>
              <p style="margin:0;font-family:Georgia,'Playfair Display',serif;font-size:30px;font-weight:700;color:#4A5E4C;letter-spacing:0.08em;">${giftCode}</p>
              <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:12px;color:#A09890;">Keep this code safe — you can also use it at ourfable.ai/redeem/${giftCode}</p>
            </div>
          </td></tr></table>
        </td></tr>
        ${emailFooter(true)}
      </table>
    </td></tr>
  </table>
</body></html>`,
    unsubHeaders
  ).catch((err) => {
    console.warn("[webhook] Gift recipient email failed (non-fatal):", err);
  });

  // 3. Send confirmation email to gifter (if email provided)
  if (gifterEmail) {
    await sendResendEmail(
      gifterEmail,
      `Your Our Fable gift is on its way to ${recipientEmail}`,
      `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>Your gift is on its way</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background:#F5F2ED;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F5F2ED" style="padding:64px 20px 80px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-family:Georgia,serif;font-size:13px;font-weight:700;color:#4A5E4C;letter-spacing:0.22em;text-transform:uppercase;">Our Fable</span>
        </td></tr>
        <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
          <table width="100%"><tr><td style="background:#4A5E4C;height:3px;font-size:0;">&nbsp;</td></tr></table>
          <table width="100%"><tr><td style="padding:48px 44px;">
            <p style="margin:0 0 10px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#8A9E8C;">Gift confirmation</p>
            <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;font-weight:700;color:#1A1A18;line-height:1.3;">Your gift is on its way, ${gifterName}.</p>
            <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#5A5650;line-height:1.8;">
              You've given someone a beautiful thing. We've sent a gift notification to <strong>${recipientEmail}</strong> with everything they need to get started.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;background:#F8F5F0;border:1px solid #E8E4DE;border-radius:14px;">
              <tr><td style="padding:20px 24px;">
                <p style="margin:0 0 4px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#9A9590;">Gift details</p>
                <p style="margin:8px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:14px;color:#5A5650;line-height:1.7;">
                  Plan: <strong style="color:#4A5E4C;">${planLabel}</strong> · Annual<br/>
                  Recipient: ${recipientEmail}<br/>
                  Gift code: <strong style="font-family:Georgia,serif;color:#4A5E4C;letter-spacing:0.06em;">${giftCode}</strong>
                </p>
              </td></tr>
            </table>
            <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#8A8680;line-height:1.7;">
              If they miss the email, you can share this redemption link directly:<br/>
              <a href="${redeemUrl}" style="color:#4A5E4C;">${redeemUrl}</a>
            </p>
          </td></tr></table>
        </td></tr>
        ${emailFooter(true)}
      </table>
    </td></tr>
  </table>
</body></html>`,
      unsubHeaders
    ).catch((err) => {
      console.warn("[webhook] Gift confirmation email failed (non-fatal):", err);
    });
  }
}

async function handleChildAddonCompleted(session: Stripe.Checkout.Session) {
  const meta = session.metadata ?? {};
  const { familyId, childId, childName } = meta;

  if (!familyId || !childId) {
    console.error("[webhook] child_addon checkout — missing metadata", meta);
    return;
  }

  // Link the Stripe subscription item to the child record
  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? undefined;

  if (stripeSubscriptionId) {
    // Retrieve subscription to get the item ID
    try {
      const stripe = getStripe();
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      const subscriptionItemId = subscription.items?.data?.[0]?.id;

      if (subscriptionItemId && childId) {
        await convexMutation("ourfable:linkChildToStripeSubscriptionItem", {
          childId,
          stripeSubscriptionItemId: subscriptionItemId,
        });
        console.log(`[webhook] ✅ Child add-on activated: childId=${childId} itemId=${subscriptionItemId}`);
      }
    } catch (err) {
      console.warn("[webhook] Failed to retrieve subscription for child add-on (non-fatal):", err);
    }
  }

  const childFirst = (childName ?? "your child").split(" ")[0];
  const family = await internalConvexQuery("ourfable:getOurFableFamilyById", { familyId }) as { email: string } | null;

  if (family?.email) {
    await sendResendEmail(
      family.email,
      `${childFirst} has been added to your vault`,
      `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#FDFBF7;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FDFBF7" style="padding:64px 20px 80px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
        <tr><td align="center" style="padding-bottom:28px;">
          <div style="width:56px;height:56px;border-radius:50%;border:1.5px solid #C8D4C9;background:#F0F5F0;display:inline-flex;align-items:center;justify-content:center;">
            <span style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#4A5E4C;">Our Fable</span>
          </div>
        </td></tr>
        <tr><td style="background:#FFFFFF;border-radius:20px;border:1px solid #EAE7E1;overflow:hidden;">
          <table width="100%"><tr><td style="background:#4A5E4C;height:3px;font-size:0;">&nbsp;</td></tr></table>
          <table width="100%"><tr><td style="padding:44px;">
            <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8A9E8C;">Child added</p>
            <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:26px;color:#1A1A18;line-height:1.3;">${childFirst}'s vault is ready.</p>
            <p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;color:#6B6860;line-height:1.8;">${childFirst} has been added to your family's Our Fable vault. You can now add circle members for ${childFirst} and start collecting memories.</p>
            <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:100px;background:#4A5E4C;">
              <a href="https://ourfable.ai/${familyId}/children" style="display:inline-block;padding:13px 28px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;text-decoration:none;">Set up ${childFirst}'s circle →</a>
            </td></tr></table>
          </td></tr></table>
        </td></tr>
        ${emailFooter(true)}
      </table>
    </td></tr>
  </table>
</body></html>`
    ).catch((err) => {
      console.warn("[webhook] Child add-on confirmation email failed (non-fatal):", err);
    });
  }
}
