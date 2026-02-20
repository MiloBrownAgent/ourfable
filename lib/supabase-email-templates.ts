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
  body { background: linear-gradient(135deg, #F3E8FF 0%, #FFF0E6 50%, #E0F2FE 100%); font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .card { background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 30px rgba(74,29,150,0.12); }
  .header { background: linear-gradient(135deg, #4A1D96 0%, #6D28D9 50%, #EC4899 100%); padding: 40px 40px 32px; text-align: center; }
  .header-emoji { font-size: 32px; margin: 0 0 8px; line-height: 1; }
  .logo { font-size: 28px; font-weight: 800; color: #ffffff; margin: 0; }
  .logo-suffix { font-weight: 400; font-size: 16px; opacity: 0.8; }
  .content { padding: 40px; }
  .heading { font-size: 24px; font-weight: 800; color: #4A1D96; margin: 0 0 16px; text-align: center; }
  .text { font-size: 16px; line-height: 1.7; color: #4A4A5E; margin: 0 0 16px; text-align: center; }
  .btn-wrap { text-align: center; margin: 24px 0; }
  .btn { display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #EC4899 100%); color: #ffffff !important; font-size: 18px; font-weight: 700; padding: 16px 40px; border-radius: 50px; text-decoration: none; box-shadow: 0 4px 15px rgba(255,107,53,0.35); }
  .muted { font-size: 14px; color: #8888A0; text-align: center; }
  .divider { border: none; border-top: 2px dashed #E9D5FF; margin: 0 24px; }
  .footer { padding: 20px 40px 32px; text-align: center; }
  .footer-text { font-size: 12px; color: #8888A0; margin: 16px 0 0; }
`;

// ── Confirm Signup ─────────────────────────────────────────
// Subject: Confirm your OurFable.ai account ✨
export const confirmSignupTemplate = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${SHARED_STYLES}</style></head>
<body>
  <div class="container"><div class="card">
    <div class="header">
      <p class="header-emoji">✉️✨</p>
      <p class="logo">OurFable<span class="logo-suffix">.ai</span></p>
    </div>
    <div class="content">
      <p class="heading">Confirm your email ✨</p>
      <p class="text">
        Thanks for signing up for OurFable! Tap the button below to verify your email address and start creating personalized storybooks for your little ones.
      </p>
      <div class="btn-wrap">
        <a class="btn" href="{{ .ConfirmationURL }}">✅ Verify My Email</a>
      </div>
      <p class="muted">
        If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
    <hr class="divider">
    <div class="footer">
      <p class="footer-text">&copy; 2026 OurFable.ai &middot; Made with ❤️ for parents and kids everywhere</p>
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
      <p class="header-emoji">🔑✨</p>
      <p class="logo">OurFable<span class="logo-suffix">.ai</span></p>
    </div>
    <div class="content">
      <p class="heading">Your magic login link 🪄</p>
      <p class="text">
        Click the button below to log in to your OurFable account. This link expires in 10 minutes.
      </p>
      <div class="btn-wrap">
        <a class="btn" href="{{ .ConfirmationURL }}">🚀 Log In to OurFable</a>
      </div>
      <p class="muted">
        If you didn't request this link, you can safely ignore this email.
      </p>
    </div>
    <hr class="divider">
    <div class="footer">
      <p class="footer-text">&copy; 2026 OurFable.ai &middot; Made with ❤️ for parents and kids everywhere</p>
    </div>
  </div></div>
</body></html>
`;

// ── Password Reset ─────────────────────────────────────────
// Subject: Reset your OurFable.ai password 🔒
export const passwordResetTemplate = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>${SHARED_STYLES}</style></head>
<body>
  <div class="container"><div class="card">
    <div class="header">
      <p class="header-emoji">🔒</p>
      <p class="logo">OurFable<span class="logo-suffix">.ai</span></p>
    </div>
    <div class="content">
      <p class="heading">Reset your password</p>
      <p class="text">
        We received a request to reset your OurFable password. Tap the button below to choose a new one.
      </p>
      <div class="btn-wrap">
        <a class="btn" href="{{ .ConfirmationURL }}">🔑 Reset Password</a>
      </div>
      <p class="muted">
        If you didn't request a password reset, you can safely ignore this email. Your password will stay the same.
      </p>
    </div>
    <hr class="divider">
    <div class="footer">
      <p class="footer-text">&copy; 2026 OurFable.ai &middot; Made with ❤️ for parents and kids everywhere</p>
    </div>
  </div></div>
</body></html>
`;
