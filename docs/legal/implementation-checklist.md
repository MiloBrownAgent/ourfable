# COPPA Implementation Checklist — OurFable.ai

> **Last Updated:** February 22, 2026 (overnight build by Milo)
> **Priority:** P0 = Must have before launch, P1 = Should have before launch, P2 = Soon after launch

---

## P0 — CRITICAL: Must Complete Before Public Launch

### Parental Consent Flow
- [x] **Consent screen before photo upload** — Display clear notice explaining:
  - What photos are collected
  - How they'll be used (AI processing via Replicate)
  - Who receives them (Replicate, Supabase)
  - Parent's rights (review, delete, withdraw consent)
  - Link to full privacy policy
- [x] **Consent checkbox** — "I am the parent/legal guardian of this child and I consent to OurFable collecting and processing my child's photos as described in the Privacy Policy"
  - Must be unchecked by default
  - Must be affirmatively checked (no pre-checked boxes)
  - Store consent record: `{user_id, timestamp, ip_address, consent_version}`
- [x] **Credit card as VPC** — Payment flow serves as verifiable parental consent
  - Ensure consent notice appears BEFORE payment
  - Document this as VPC method in privacy policy
- [x] **Block photo upload without consent** — No photos processed until consent recorded

### Privacy Policy & Terms
- [x] **Publish privacy policy** at `/privacy` ✓ (page live, no unfilled placeholders)
- [x] **Publish terms of service** at `/terms` ✓ (page live)
- [x] **Link privacy policy** from:
  - [x] Footer of landing page ✓
  - [x] Sign-up page ✓
  - [x] Photo upload page (via ConsentGate) ✓
  - [x] Consent screen ✓
  - [ ] Order confirmation email — TODO (needs Stripe webhook wired to email)
- [x] **Fill in placeholders** — confirmed none remain in live pages

### Photo Deletion Pipeline
- [x] **Manual deletion endpoint** — `DELETE /api/user/photos` ✓
  - Deletes from Supabase Storage (character-photos bucket)
  - Clears character_photo_url from books
  - Logs to deletion_log ✓ (via cron jobs, manual via account deletion)
- [x] **Account deletion endpoint** — `DELETE /api/user/account` ✓
  - Deletes all photos, generated images (book-assets), books
  - Deletes auth user via admin.deleteUser
  - Anonymizes order records
  - Sends confirmation email ✓
- [x] **"Delete My Data" button** — `/dashboard/settings` ✓ (with confirmation dialog)
- [x] **Deletion confirmation** — Email sent before auth deletion ✓

### Data Retention Automation
- [x] **Cron job: delete abandoned uploads** — `/api/cron/cleanup?job=abandoned-uploads` · daily 3 AM UTC ✓
- [x] **Cron job: delete post-delivery photos** — `/api/cron/cleanup?job=post-delivery` · daily 3:30 AM UTC ✓
- [x] **Cron job: delete old book files** — `/api/cron/cleanup?job=annual-cleanup` · weekly Sunday 4 AM UTC ✓
- [ ] **Cron job: flag inactive accounts** — TODO: build inactive account warning + deletion flow
- [x] **Deletion logging table** — `deletion_log` table with RLS ✓ (migration 20260222000002)

### Third-Party Agreements
- [ ] **Replicate DPA** — Obtain or verify data processing terms. CRITICAL: Confirm in writing that:
  - Photos are not retained after processing
  - Photos are not used for model training
  - Photos are deleted from their systems after response is returned
- [ ] **Review Supabase DPA** — Verify standard terms cover COPPA requirements
- [ ] **Review Stripe DPA** — Standard, but verify
- [ ] **Resend DPA** — Obtain or verify

---

## P1 — HIGH: Should Complete Before Launch

### Parent Data Access Portal
- [ ] **"My Data" page** in account settings showing:
  - All uploaded photos (with delete buttons)
  - All generated images
  - All completed books
  - Account information
- [ ] **Data export/download** — Button to download all data as ZIP (photos + JSON metadata)
- [ ] **Privacy request form** — For requests that can't be handled self-service

### Security Hardening
- [ ] **Verify Supabase RLS** — Ensure Row Level Security policies prevent users from accessing other users' photos
  - Test: User A cannot access User B's photos via API
- [ ] **Audit API routes** — Ensure all photo/book endpoints check auth and ownership
- [ ] **Environment variable audit** — No secrets in code, all in `.env.local`
- [ ] **HTTPS enforced** — Redirect all HTTP to HTTPS
- [ ] **Content Security Policy headers** — Prevent XSS and data exfiltration

### Email Compliance
- [ ] **Consent confirmation email** — Send after parent provides consent, including:
  - What they consented to
  - How to withdraw consent
  - Link to privacy policy
- [ ] **Transactional emails only** — No marketing emails without separate opt-in
- [ ] **Unsubscribe mechanism** — For any non-transactional emails

### Age Gate
- [ ] **Age confirmation at signup** — "I confirm I am 18 or older and the parent/legal guardian of the child"
  - Checkbox or date-of-birth entry
  - If under 18, block account creation with message explaining why

---

## P2 — MEDIUM: Complete Soon After Launch

### Cookie Consent
- [ ] **Cookie consent banner** — Even though we only use essential cookies, display a brief notice:
  - "We use essential cookies to keep you logged in. No tracking cookies. See our Privacy Policy."
  - Dismiss button (not full opt-in needed for essential-only cookies)
- [ ] **Cookie policy section** — Already in privacy policy, but consider standalone page if needed

### Monitoring & Compliance
- [ ] **Privacy request tracking** — Simple system to log and track parent data requests
  - Spreadsheet or database table: `{request_id, email, type, received_date, completed_date, notes}`
- [ ] **Quarterly data audit** — Review what data exists, verify retention periods being honored
- [ ] **Annual privacy policy review** — Calendar reminder to review and update

### Advanced Consent Options
- [ ] **Granular consent** — Consider letting parents consent to photo collection separately from third-party disclosure (2025 COPPA amendment)
- [ ] **Re-consent flow** — If privacy policy changes materially, require fresh consent from existing users

### COPPA Safe Harbor (Optional but Recommended)
- [ ] **Research Safe Harbor programs** — PRIVO, kidSAFE, ESRB
- [ ] **Apply to Safe Harbor** — Provides compliance oversight and potential liability reduction
- [ ] **Budget: ~$5,000-15,000/year** depending on program

### Legal Review
- [ ] **Attorney review** of privacy policy, terms, and consent flow
- [ ] **Attorney review** of Replicate DPA terms
- [ ] **Budget: ~$2,000-5,000** for initial review

---

## Database Schema Changes Needed

```sql
-- Consent records table
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  consent_type TEXT NOT NULL, -- 'photo_collection', 'third_party_disclosure'
  consent_version TEXT NOT NULL, -- version of privacy policy consented to
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB
);

-- Deletion log table
CREATE TABLE deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  resource_type TEXT NOT NULL, -- 'photo', 'generated_image', 'book', 'account'
  resource_id UUID,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT NOT NULL, -- 'user_request', 'retention_policy', 'abandoned_upload'
  initiated_by TEXT NOT NULL -- 'user', 'system', 'admin'
);

-- Privacy requests tracking
CREATE TABLE privacy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  request_type TEXT NOT NULL, -- 'access', 'deletion', 'export', 'withdraw_consent'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- Add RLS policies
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_requests ENABLE ROW LEVEL SECURITY;

-- Users can only see their own consent records
CREATE POLICY "Users view own consent" ON consent_records
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own privacy requests
CREATE POLICY "Users view own requests" ON privacy_requests
  FOR SELECT USING (auth.uid() = user_id);
```

---

## API Routes Needed

| Route | Method | Purpose | Priority |
|-------|--------|---------|----------|
| `/api/user/consent` | POST | Record parental consent | P0 |
| `/api/user/consent` | GET | Check consent status | P0 |
| `/api/user/consent` | DELETE | Revoke consent | P0 |
| `/api/user/photos` | DELETE | Delete all user's photos | P0 |
| `/api/user/photos/[id]` | DELETE | Delete specific photo | P0 |
| `/api/user/account` | DELETE | Full account deletion | P0 |
| `/api/user/data-export` | GET | Export all user data as ZIP | P1 |
| `/api/user/privacy-request` | POST | Submit privacy request | P1 |
| `/api/cron/cleanup-abandoned` | POST | Delete abandoned uploads (cron) | P0 |
| `/api/cron/cleanup-retention` | POST | Delete expired data (cron) | P0 |

---

## Quick Wins (Can Do Today)

1. **Add privacy policy and terms pages** — Static pages, no backend needed
2. **Add consent checkbox to upload flow** — Frontend change + store in DB
3. **Add "Delete My Data" button** — Account settings page
4. **Add footer links** — Privacy Policy, Terms of Service on all pages
5. **Verify RLS policies** — Quick audit of existing Supabase security rules
6. **Add `.env.local` audit** — Verify no secrets in committed code
