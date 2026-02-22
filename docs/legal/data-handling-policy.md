# Data Handling Policy — OurFable.ai

> **Classification:** INTERNAL — Not Public-Facing
> **Last Updated:** February 2026
> **Owner:** [COMPLIANCE_OFFICER_NAME]

---

## 1. Purpose

This document defines how OurFable collects, processes, stores, transmits, and deletes personal data — with particular focus on children's photographs. This is an internal operational document required for COPPA compliance.

---

## 2. Data Classification

| Classification | Examples | Handling |
|---------------|----------|---------|
| **Critical** | Children's photos, AI-generated images with child likeness | Encrypted at rest & transit, strict access controls, defined retention, deletion pipeline |
| **Sensitive** | Parent email, name, payment info, shipping address | Encrypted at rest & transit, access controls |
| **Internal** | Order history, book metadata, analytics aggregates | Standard security |
| **Public** | Published website content, pricing | No special handling |

---

## 3. Data Lifecycle: Children's Photos

### 3.1 Upload
1. Parent uploads photos via HTTPS (TLS 1.2+)
2. Photos validated client-side (format, size) and server-side
3. Photos stored in **Supabase Storage** (encrypted at rest, AES-256)
4. Database record created linking photos to parent account and order
5. **No photo processing occurs until parental consent is verified**

### 3.2 Processing
1. Photos retrieved from Supabase Storage via secure API
2. Transmitted to **Replicate** API via HTTPS for AI processing
3. Replicate generates illustrations and returns results
4. Generated images stored in Supabase Storage
5. Original photos flagged as "processed"

### 3.3 Book Generation
1. Generated illustrations combined with story template
2. Book rendered (PDF/digital format)
3. Final book stored in Supabase Storage
4. Book delivered to parent (digital download and/or print fulfillment)

### 3.4 Retention
| Data | Retention Period | Trigger |
|------|-----------------|---------|
| Uploaded photos | **90 days** after book delivery | Auto-delete cron job |
| AI-generated illustrations | **90 days** after book delivery | Auto-delete cron job |
| Completed book files | **1 year** after purchase | Auto-delete cron job |
| Abandoned uploads (no order) | **30 days** after upload | Auto-delete cron job |
| Parent account data | Until account deletion or **2 years** of inactivity | Manual or auto-delete |
| Order/payment records | **7 years** (legal/tax requirement) | Auto-archive, then delete |
| Server logs | **90 days** | Auto-rotate |
| Consent records | **7 years** after consent | Required for compliance proof |

### 3.5 Deletion
Deletion must occur across ALL systems:

1. **Supabase Storage** — Delete photo files and generated images
2. **Supabase Database** — Delete/nullify records referencing photos
3. **Replicate** — Confirm no cached copies (Replicate does not retain inputs/outputs beyond processing per our DPA)
4. **CDN/Cache** — Purge any cached versions
5. **Backups** — Photo data excluded from long-term backups OR backups rotated within retention period

**Deletion verification:** After deletion, attempt to retrieve the file — confirm 404/not found. Log deletion event with timestamp.

---

## 4. Third-Party Data Sharing Inventory

### Every service that touches user data:

| Service | Provider | Data Shared | Location | DPA? | Purpose |
|---------|----------|-------------|----------|------|---------|
| **Replicate** | Replicate, Inc. | Children's photos (Critical) | US | **NEEDED** | AI image generation |
| **Supabase** | Supabase, Inc. | All user data, photos, books (Critical/Sensitive) | US (AWS) | Yes (standard) | Database, auth, storage |
| **Stripe** | Stripe, Inc. | Parent payment info (Sensitive) | US | Yes (standard) | Payment processing |
| **Resend** | Resend, Inc. | Parent email address (Sensitive) | US | **NEEDED** | Transactional email |
| **Vercel** | Vercel, Inc. | Server logs, IP addresses (Internal) | US (AWS/Edge) | Yes (standard) | Web hosting |
| **Domain Registrar** | (varies) | None | — | N/A | Domain management |

### DPA Status & Action Items

- [ ] **Replicate** — CRITICAL: Obtain DPA or verify their standard terms prohibit retention of input data. Confirm photos are not used for model training. Get this in writing.
- [ ] **Resend** — Obtain DPA or verify standard data processing terms.
- [ ] **Supabase** — Review standard DPA (typically included in terms).
- [ ] **Stripe** — Review standard DPA (typically included in terms).
- [ ] **Vercel** — Review standard DPA.

---

## 5. Encryption Requirements

### In Transit
- All data transmitted via **HTTPS/TLS 1.2+** minimum
- API calls to third parties (Replicate, Supabase, Stripe) all use HTTPS
- No unencrypted data transmission permitted

### At Rest
- **Supabase Storage:** AES-256 encryption (provided by Supabase/AWS)
- **Supabase Database:** AES-256 encryption (provided by Supabase/AWS)
- **Backups:** Encrypted (provided by Supabase)
- **Local development:** No production data on local machines. Use test data only.

### Key Management
- Encryption keys managed by infrastructure providers (Supabase/AWS KMS)
- API keys and secrets stored in environment variables, never in code
- Rotate API keys annually or upon any suspected compromise

---

## 6. Access Controls

### Production Data Access
| Role | Access Level | Who |
|------|-------------|-----|
| Admin | Full database & storage access | Founders only (currently Dave) |
| Application | Read/write via API with row-level security | OurFable application (service role) |
| User | Own data only via authenticated API | Parents (via Supabase RLS) |

### Rules
- **Principle of least privilege** — no one gets more access than needed
- **No direct database access** in production except for emergency debugging
- **Row Level Security (RLS)** enabled on all Supabase tables containing user data
- **Service role key** used only server-side, never exposed to client
- **Anon key** used client-side with RLS enforcement
- Log all admin access to production data

---

## 7. Incident Response Plan

### 7.1 Data Breach Definition
A data breach is any unauthorized access to, acquisition of, or disclosure of personal information — especially children's photos.

### 7.2 Response Steps

**Phase 1: Identify & Contain (0-4 hours)**
1. Confirm the breach (is it real? what's the scope?)
2. Contain the breach:
   - Revoke compromised credentials/API keys
   - Disable compromised accounts
   - Block attack vector if identified
3. Preserve evidence (logs, timestamps)
4. Notify founding team immediately

**Phase 2: Assess (4-24 hours)**
1. Determine what data was accessed/exposed
2. Identify affected users
3. Determine if children's photos were involved (escalates severity)
4. Document timeline of events

**Phase 3: Notify (24-72 hours)**
1. **If children's data involved:**
   - Notify affected parents by email within 72 hours
   - Include: what happened, what data was affected, what we're doing about it, what they can do
2. **Regulatory notification:**
   - FTC notification if COPPA-covered data breached
   - State attorney general notification per applicable state breach notification laws (most states require notification within 30-60 days)
3. **Law enforcement:** If criminal activity suspected

**Phase 4: Remediate (Ongoing)**
1. Fix the vulnerability that caused the breach
2. Conduct post-mortem
3. Update security practices
4. Document lessons learned
5. Review and update this incident response plan

### 7.3 Contact List
| Role | Contact | Method |
|------|---------|--------|
| Lead (Dave) | davesweeney2.8@gmail.com | Email + phone |
| Supabase Support | support@supabase.com | Email |
| Replicate Support | support@replicate.com | Email |
| Legal Counsel | [TO BE DETERMINED] | — |

---

## 8. Parental Request Handling

### Request Types & SLA

| Request | Response Time | Process |
|---------|--------------|---------|
| View collected data | 30 days | Export all data for parent's account and deliver via secure link |
| Delete child's data | 30 days | Run deletion pipeline across all systems, confirm |
| Withdraw consent | Immediately stop processing; full deletion within 30 days | Stop all photo processing, run deletion pipeline |
| Data portability | 30 days | Export in standard format (JSON + image files) |

### Process
1. Receive request at privacy@ourfable.ai
2. Verify requester identity (must match account email)
3. Log request with timestamp
4. Execute within SLA
5. Confirm completion to parent
6. Retain record of request and completion for compliance

---

## 9. Development & Testing Rules

- **NEVER** use real children's photos in development or testing
- Use synthetic/stock images for all non-production environments
- Production database access requires explicit justification
- No production data copied to local machines
- Environment variables for all secrets (never committed to git)
- `.env.local` in `.gitignore` — verified

---

## 10. Annual Review

This policy must be reviewed and updated:
- **Annually** (at minimum)
- After any data breach or security incident
- After any significant change to data processing practices
- After any change to third-party service providers
- After any COPPA rule updates or FTC guidance changes

**Next review due:** February 2027

---

## Appendix: Deletion Pipeline Technical Spec

```
DELETE_PIPELINE:
  Input: user_id OR order_id OR "all abandoned older than 30 days"

  1. Query all photo records for target
  2. For each photo:
     a. Delete from Supabase Storage (bucket: photos)
     b. Delete from Supabase Storage (bucket: generated-images)
     c. Delete database records (photos table)
     d. Delete database records (generated_images table)
     e. Log deletion: {photo_id, timestamp, reason, initiated_by}
  3. For each book:
     a. Delete from Supabase Storage (bucket: books)
     b. Delete database records (books table)
     c. Log deletion
  4. If full account deletion:
     a. Delete auth user (Supabase Auth)
     b. Delete profile record
     c. Anonymize order records (keep for tax, remove PII)
  5. Verify: attempt to fetch deleted resources, confirm 404
  6. Send confirmation email (if parent-initiated)
```
