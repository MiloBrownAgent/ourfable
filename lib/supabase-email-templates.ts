// ============================================================
// Supabase Auth Email Templates — OurFable.ai
// ============================================================
// HOW TO USE:
// 1. Go to your Supabase Dashboard → Authentication → Email Templates
// 2. For each template type (Confirm signup, Magic Link, Reset Password),
//    paste the corresponding HTML string below into the "Body" field.
// 3. Update the "Subject" field with the subject line provided.
// 4. The {{ .ConfirmationURL }} and {{ .Token }} placeholders are
//    automatically replaced by Supabase at send time.
// ============================================================

const SHARED_STYLES = `
  body { background-color: #f8f8f8; font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .card { background: #ffffff; border-radius: 8px; overflow: hidden; }
  .header { padding: 32px 40px 0; text-align: center; }
  .logo { font-size: 24px; font-weight: 700; color: #0EA5A5; margin: 0 0 16px; }
  .accent { border: none; border-top: 2px solid #0EA5A5; margin: 0; }
  .content { padding: 32px 40px; }
  .heading { font-size: 22px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px; }
  .text { font-size: 16px; line-height: 1.6; color: #444444; margin: 0 0 16px; }
  .btn-wrap { text-align: center; margin: 24px 0; }
  .btn { display: inline-block; background-color: #0EA5A5; color: #ffffff !important; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none; }
  .footer { padding: 0 40px 32px; border-top: 1px solid #eeeeee; }
  .footer-text { font-size: 13px; color: #999999; text-align: center; margin: 16px 0 0; }
`;

// ── Confirm Signup ─────────────────────────────────────────
// Subject: Confirm your OurFable.ai account ✉️
export const confirmSignupTemplate = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${SHARED_STYLES}</style></head>
<body>
  <div class="container"><div class="card">
    <div class="header">
      <p class="logo">OurFable.ai</p>
      <hr class="accent">
    </div>
    <div class="content">
      <p class="heading">Confirm your email</p>
      <p class="text">
        Thanks for signing up for OurFable! Tap the button below to verify your email address and start creating personalized storybooks.
      </p>
      <div class="btn-wrap">
        <a class="btn" href="{{ .ConfirmationURL }}">Verify My Email</a>
      </div>
      <p class="text" style="font-size:14px; color:#777;">
        If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      <p class="footer-text">&copy; 2026 OurFable.ai</p>
    </div>
  </div></div>
</body></html>
`;

// ── Magic Link ─────────────────────────────────────────────
// Subject: Your OurFable.ai login link 🔑
export const magicLinkTemplate = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${SHARED_STYLES}</style></head>
<body>
  <div class="container"><div class="card">
    <div class="header">
      <p class="logo">OurFable.ai</p>
      <hr class="accent">
    </div>
    <div class="content">
      <p class="heading">Your login link</p>
      <p class="text">
        Click the button below to log in to your OurFable account. This link expires in 10 minutes.
      </p>
      <div class="btn-wrap">
        <a class="btn" href="{{ .ConfirmationURL }}">Log In to OurFable</a>
      </div>
      <p class="text" style="font-size:14px; color:#777;">
        If you didn't request this link, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      <p class="footer-text">&copy; 2026 OurFable.ai</p>
    </div>
  </div></div>
</body></html>
`;

// ── Password Reset ─────────────────────────────────────────
// Subject: Reset your OurFable.ai password
export const passwordResetTemplate = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${SHARED_STYLES}</style></head>
<body>
  <div class="container"><div class="card">
    <div class="header">
      <p class="logo">OurFable.ai</p>
      <hr class="accent">
    </div>
    <div class="content">
      <p class="heading">Reset your password</p>
      <p class="text">
        We received a request to reset your OurFable password. Tap the button below to choose a new one.
      </p>
      <div class="btn-wrap">
        <a class="btn" href="{{ .ConfirmationURL }}">Reset Password</a>
      </div>
      <p class="text" style="font-size:14px; color:#777;">
        If you didn't request a password reset, you can safely ignore this email. Your password will stay the same.
      </p>
    </div>
    <div class="footer">
      <p class="footer-text">&copy; 2026 OurFable.ai</p>
    </div>
  </div></div>
</body></html>
`;
