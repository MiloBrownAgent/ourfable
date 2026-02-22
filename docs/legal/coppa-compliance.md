# COPPA Compliance Guide — OurFable.ai

> **Last Updated:** February 2026
> **Status:** Pre-launch compliance planning
> **Applies to:** OurFable.ai — AI-powered personalized children's storybooks using uploaded photos

---

## Executive Summary

OurFable collects **photographs of children** uploaded by parents to generate personalized storybooks using AI. Under COPPA, photographs containing a child's image are explicitly defined as **personal information**. This makes COPPA compliance mandatory and non-negotiable before public launch.

The FTC finalized significant COPPA Rule amendments (effective June 23, 2025, compliance deadline April 22, 2026) that expand requirements around biometric data, data retention policies, and third-party disclosures — all directly relevant to OurFable.

---

## 1. Does COPPA Apply to OurFable?

**Yes, unambiguously.**

COPPA applies to operators of commercial websites and online services that:
- Are **directed to children under 13**, OR
- Have **actual knowledge** they collect personal information from children under 13

OurFable's situation:
- **The product is designed around children** — parents upload children's photos to create storybooks featuring those children
- Photos of children = personal information under COPPA (16 CFR § 312.2)
- Even though parents are the users, the data collected is **about children**
- The 2025 amendments added **biometric identifiers** (including facial templates) to the definition of personal information — AI face-swap processing likely creates facial templates

**Conclusion:** OurFable is a child-directed service that collects personal information of children. Full COPPA compliance is required.

---

## 2. COPPA Requirements Checklist

### A. Privacy Policy (Public-Facing)

- [ ] Post a clear, comprehensive privacy policy on the website
- [ ] Link to privacy policy on the homepage and at every point where personal info is collected
- [ ] Include ALL required disclosures:
  - Name, address, email, and phone number of all operators collecting info
  - Types of personal information collected from children
  - How the information is collected (directly from child/parent, passively via cookies, etc.)
  - How the information is used
  - Whether information is disclosed to third parties (and to whom)
  - Parent's right to review, delete, and refuse further collection
  - Procedures for data deletion
- [ ] Keep privacy policy up to date

### B. Direct Notice to Parents

- [ ] Provide direct notice (not just website posting) to parents BEFORE collecting any personal information
- [ ] Direct notice must include:
  - What information will be collected
  - How it will be used
  - Third parties who will receive it
  - Link to online privacy policy
  - How parent can provide consent
  - How parent can revoke consent and request deletion
- [ ] **2025 Amendment:** Must disclose specific intended uses of information

### C. Verifiable Parental Consent (VPC)

- [ ] Obtain VPC **before** collecting, using, or disclosing children's personal information
- [ ] Use an approved consent method (see Section 3 below)
- [ ] Maintain records of consent

### D. Data Minimization

- [ ] Collect only information reasonably necessary for the activity
- [ ] Do not condition participation on disclosure of more info than necessary
- [ ] **2025 Amendment:** Cannot retain children's data indefinitely — must have defined retention periods

### E. Data Security

- [ ] Establish and maintain reasonable procedures to protect the confidentiality, security, and integrity of personal information collected from children
- [ ] **2025 Amendment:** Must maintain a written data security program

### F. Data Retention Policy

- [ ] **2025 Amendment (NEW):** Must establish and maintain a **written data retention policy**
- [ ] Policy must specify retention periods for each type of personal information
- [ ] Must delete personal information once the purpose for collection is fulfilled
- [ ] Cannot retain data indefinitely

### G. Parental Rights

- [ ] Allow parents to review personal information collected from their child
- [ ] Allow parents to request deletion of their child's information
- [ ] Allow parents to refuse further collection/use
- [ ] Must respond to parent requests in a reasonable timeframe

### H. Third-Party Disclosure

- [ ] Disclose to parents all third parties receiving children's information
- [ ] Ensure third parties maintain confidentiality and security
- [ ] **2025 Amendment:** Third-party sharing for purposes not integral to the service requires separate consent

---

## 3. Verifiable Parental Consent Methods

The FTC accepts the following methods (choose one or more):

| Method | Friction Level | Cost | Recommended for OurFable? |
|--------|---------------|------|--------------------------|
| **Credit card transaction** — charge a small amount ($0.50+) during signup | Low | Low | ✅ **Best fit** — parents already pay for books |
| **Signed consent form** — email form, parent signs and returns via scan/fax | Medium | Low | Possible backup |
| **Government ID check** — parent submits ID, verified against database | High | Medium | Overkill for our use case |
| **Knowledge-based questions** — questions only a parent could answer | Medium | Medium | Not recommended (unreliable) |
| **Video conference** — live call with trained staff | Very High | High | Not practical |
| **Text message to parent** — new in 2025 amendments | Low | Low | ✅ Good supplemental method |

### Recommended Approach for OurFable

**Primary:** Use the **credit card transaction method**. Since parents must pay for books anyway, the payment itself can serve as VPC. The key requirements:
1. Present the direct notice (what data you collect, how it's used, third parties) **before** payment
2. Include a clear consent checkbox: "I am the parent/legal guardian and I consent to OurFable collecting and processing my child's photos as described in our Privacy Policy"
3. The credit card charge provides verification that an adult is providing consent

**Secondary:** For free tier/preview features, use **email-plus** method:
1. Collect parent's email
2. Send detailed notice to parent
3. Require parent to respond with consent (click confirmation link)
4. Use a delayed confirmation mechanism (parent must take affirmative action)

---

## 4. Third-Party Data Sharing Inventory

OurFable shares children's personal information with these third parties. **All must be disclosed to parents:**

| Service | Data Shared | Purpose | Risk Level |
|---------|-------------|---------|------------|
| **Replicate** (AI processing) | Children's photos | AI face-swap/image generation | **HIGH** — photos leave our servers |
| **Supabase** (Database/Storage) | Photos, account data, book data | Data storage and retrieval | Medium — data processor |
| **Stripe** (Payments) | Parent payment info only | Payment processing | Low — no child data |
| **Resend** (Email) | Parent email only | Transactional emails | Low — no child data |
| **Vercel** (Hosting) | Request logs, IP addresses | Application hosting | Low |

### Critical: Replicate Disclosure

Replicate processes children's photos through AI models. This is a **disclosure of personal information to a third party** under COPPA. Requirements:
1. Must be explicitly disclosed in privacy policy and direct notice
2. Must ensure Replicate maintains confidentiality and security
3. Need a **Data Processing Agreement (DPA)** with Replicate
4. Under 2025 amendments, if AI processing is not "integral to the service," separate parental consent may be required (AI image generation IS integral to OurFable, so standard consent should suffice)
5. Must disclose that photos are sent to Replicate's servers for processing

---

## 5. FTC Enforcement Examples & Penalties

### Penalty Structure
- **Up to $53,088 per violation per day** (2025 adjusted amount)
- Violations can be per-child, per-instance — penalties compound rapidly
- FTC can seek both civil penalties AND equitable relief

### Notable Enforcement Actions

| Case | Year | Penalty | Violation |
|------|------|---------|-----------|
| **Epic Games (Fortnite)** | 2022 | **$275 million** | Collected children's data without parental consent, default privacy settings exposed kids |
| **Google/YouTube** | 2019 | **$170 million** | Collected children's data via cookies on child-directed channels without consent |
| **Musical.ly (TikTok)** | 2019 | **$5.7 million** | Collected personal info from children without parental consent |
| **Disney** | 2025 | **$10 million** | Allowed data collection from children viewing kid-directed YouTube videos without consent |
| **Iconic Hearts (Sendit)** | 2025 | **Pending** | Collected children's data in anonymous messaging app, also violated ROSCA |
| **Tilting Point Media** | 2024 | **$500,000** | Mobile game collected children's data without consent |

### Key Lessons for OurFable
1. **"We only collect from parents" is not a defense** — if the data is about children, COPPA applies
2. **Third-party SDKs/services count** — you're responsible for what Replicate does with the photos
3. **Default settings matter** — privacy-protective defaults required
4. **Data retention without limits is a violation** — under 2025 amendments, must have defined retention periods
5. **The FTC is actively enforcing** — this is not theoretical risk

---

## 6. Step-by-Step Implementation Plan

### Phase 1: Legal Foundation (Before Launch)
1. ✅ Draft and publish COPPA-compliant privacy policy → `privacy-policy.md`
2. ✅ Draft and publish terms of service → `terms-of-service.md`
3. Obtain Data Processing Agreements with Replicate and Supabase
4. Create written data retention policy (internal) → `data-handling-policy.md`
5. Create written data security program (internal)

### Phase 2: Technical Implementation (Before Launch)
1. Build parental consent flow:
   - Direct notice screen before any photo upload
   - Consent checkbox with clear language
   - Credit card verification (via Stripe payment)
   - Store consent records with timestamps
2. Build photo deletion pipeline:
   - Parent-initiated deletion (account settings)
   - Automated deletion after retention period
   - Deletion from Supabase storage AND Replicate (if cached)
3. Build parent access/review portal:
   - View all collected data
   - Download their child's data
   - Delete individual photos or all data
4. Implement data retention automation:
   - Auto-delete photos after defined period post-book-delivery
   - Auto-delete abandoned/incomplete orders
   - Log all deletions

### Phase 3: Operational (Before Launch)
1. Designate a COPPA compliance officer (can be founder initially)
2. Create process for handling parent data requests
3. Set up incident response plan for data breaches
4. Train any team members on COPPA requirements
5. Consider applying to a COPPA Safe Harbor program (e.g., PRIVO, kidSAFE)

### Phase 4: Ongoing Compliance
1. Annual review of privacy practices
2. Monitor FTC guidance and enforcement actions
3. Audit third-party data handling
4. Update policies as needed
5. Full compliance with 2025 COPPA amendments by April 22, 2026

---

## 7. Key Risks Specific to OurFable

| Risk | Severity | Mitigation |
|------|----------|------------|
| Photos sent to Replicate without proper consent | Critical | Consent flow before any upload |
| No data retention limits | High | Implement auto-deletion |
| No deletion pipeline | High | Build deletion across all services |
| No written data security program | High | Create and maintain documentation |
| Replicate retains/uses photos for training | Critical | DPA prohibiting retention; verify Replicate's data handling |
| No parental access portal | Medium | Build data review/download/delete UI |

---

## 8. IMPORTANT: Lawyer Review Required

> ⚠️ **This document is a comprehensive guide based on research of COPPA requirements, FTC guidance, and enforcement actions. It is NOT legal advice. Before launching OurFable publicly, have this compliance plan reviewed by an attorney specializing in children's privacy law (COPPA). The cost of legal review (~$2,000-5,000) is negligible compared to potential FTC penalties ($53,088 per violation per day).**

### Recommended Next Steps
1. Find a COPPA-specialized attorney (look for FTC/privacy practice areas)
2. Have them review the privacy policy, terms of service, and consent flow
3. Consider a COPPA Safe Harbor program for ongoing compliance support
4. Budget for annual legal review of privacy practices
