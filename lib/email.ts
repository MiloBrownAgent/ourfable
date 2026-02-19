import { Resend } from "resend";
import WaitlistWelcome from "@/emails/WaitlistWelcome";
import WelcomeEmail from "@/emails/WelcomeEmail";
import BookReadyEmail from "@/emails/BookReadyEmail";
import BookFailedEmail from "@/emails/BookFailedEmail";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "placeholder_need_from_resend") {
    console.warn("[Email] RESEND_API_KEY not configured — skipping email send");
    return null;
  }
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = "OurFable <onboarding@resend.dev>";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ourfable.ai";

export async function sendWaitlistWelcome(email: string) {
  try {
    const r = getResend(); if (!r) return; await r.emails.send({
      from: FROM,
      to: email,
      subject: "You're on the list! ✨ OurFable.ai",
      react: WaitlistWelcome(),
    });
  } catch (error) {
    console.error("[Email] Failed to send waitlist welcome:", error);
  }
}

export async function sendWelcomeEmail(email: string, name?: string) {
  try {
    const r = getResend(); if (!r) return; await r.emails.send({
      from: FROM,
      to: email,
      subject: "Welcome to OurFable! Let's make some magic 📚",
      react: WelcomeEmail({ name, appUrl: APP_URL }),
    });
  } catch (error) {
    console.error("[Email] Failed to send welcome email:", error);
  }
}

export async function sendBookReady(
  email: string,
  bookTitle: string,
  characterName: string,
  bookId: string,
  coverImageUrl?: string
) {
  try {
    const r = getResend(); if (!r) return; await r.emails.send({
      from: FROM,
      to: email,
      subject: "Your storybook is ready! 🎉",
      react: BookReadyEmail({
        bookTitle,
        characterName,
        bookId,
        coverImageUrl,
        appUrl: APP_URL,
      }),
    });
  } catch (error) {
    console.error("[Email] Failed to send book ready email:", error);
  }
}

export async function sendBookFailed(email: string, bookId: string) {
  try {
    const r = getResend(); if (!r) return; await r.emails.send({
      from: FROM,
      to: email,
      subject: "We hit a snag with your storybook",
      react: BookFailedEmail({ bookId, appUrl: APP_URL }),
    });
  } catch (error) {
    console.error("[Email] Failed to send book failed email:", error);
  }
}
