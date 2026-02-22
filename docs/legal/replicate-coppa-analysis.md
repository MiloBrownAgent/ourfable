# Replicate + COPPA Compliance Analysis for OurFable

**Date:** February 20, 2026  
**Prepared for:** OurFable.ai — AI-powered personalized storybook platform (ages 2–10)  
**Risk Level:** HIGH — COPPA penalties are $53,088 per violation per day

---

## 1. Executive Summary

**CONDITIONAL — Use Replicate only with significant contractual and technical safeguards. Self-hosting is the safer path.**

Using Replicate's API to process children's photos is legally **possible** under COPPA, but **risky** with their current policies. Replicate has:

- ✅ Short data retention (1 hour for API inputs/outputs, auto-deleted)
- ✅ No use of customer inputs for model training (per ToS — outputs/inputs are "Customer Data")
- ✅ A published subprocessors list (all US-based)
- ⚠️ **No publicly available DPA (Data Processing Agreement)**
- ⚠️ **No SOC 2 certification found**
- ❌ **No COPPA-specific provisions in any policy**
- ❌ **Privacy policy says they don't intentionally collect data from minors under 16** — this creates a direct conflict with our use case
- ❌ **No documented ability to delete uploaded images via API** (they auto-delete after 1 hour, but no on-demand purge endpoint)

**Bottom line:** Replicate's privacy policy explicitly discourages children's data. Without a custom DPA with COPPA-specific provisions, using Replicate creates meaningful legal exposure. **Self-hosting (Flux/SDXL on your own GPU infrastructure) is the recommended path** — it eliminates the third-party data sharing issue entirely.

---

## 2. Replicate Data Handling — What Their Policies Actually Say

### 2.1 Data Retention

From [Replicate docs](https://replicate.com/docs/reference/how-does-replicate-work):
> "Input and output (including any files) are automatically deleted after **an hour** for any predictions created through the API."

From [Data Retention page](https://replicate.com/docs/topics/predictions/data-retention):
> "When you run models on Replicate, some data you provide is deleted automatically after a period of time."

- **API predictions:** Inputs and outputs auto-deleted after 1 hour
- **Web predictions:** Retained longer (visible on dashboard)
- **Training data:** Retained until customer deletes it

### 2.2 Data Ownership & Training

From [Terms of Service](https://replicate.com/terms) (Nov 24, 2025):
> "Customer Data" is defined as "Customer Inputs and Outputs" — Replicate acknowledges this belongs to the customer.

> "Resultant Data" (aggregated/anonymized usage data) is carved out and retained by Replicate.

**Key finding:** Replicate's ToS does NOT grant them rights to use Customer Data (inputs/outputs) for training. However, "Resultant Data" (anonymized metadata) may be retained.

### 2.3 Privacy Policy — Children's Data

From [Privacy Policy](https://replicate.com/privacy) (Nov 14, 2024):
> "Our Website and Services are designed for business professionals. **We do not intentionally collect any personal information from minors under the age of 16.** If you believe we have obtained personal information associated with children, please contact us at privacy@replicate.com and we will delete it."

**This is a critical problem.** Replicate explicitly states their service is not designed for children's data. Sending children's photos to their API arguably conflicts with their own stated policy.

### 2.4 Data Sharing / Subprocessors

From [Subprocessors page](https://replicate.com/docs/topics/site-policy/subprocessors):

| Subprocessor | Purpose | Location |
|---|---|---|
| AWS | Cloud infrastructure | US |
| CoreWeave | Cloud infrastructure | US |
| Cloudflare | CDN | US |
| GCP (Google) | Cloud infrastructure | US |
| Fly.io | Public cloud | US |
| Crunchy Bridge | Postgres | US |
| CloudAMQP | Message queue | US |
| Attio | CRM | US |

All subprocessors are US-based, which is positive for data sovereignty.

### 2.5 DPA / Security Certifications

- **No public DPA found** — not on their website, not discoverable via search
- **No SOC 2 Type II certification found** — no mention anywhere
- **No HIPAA BAA available**
- **No COPPA compliance features**

### 2.6 Acceptable Use Policy

The [AUP](https://replicate.com/acceptable-use-policy) contains standard prohibitions (illegal activity, abuse, security violations) but **does not address children's data at all**.

---

## 3. COPPA Requirements for Third-Party Data Sharing

Under COPPA (16 CFR §312), when an operator (OurFable) shares children's personal information with a third party (Replicate), the following applies:

### 3.1 What Counts as Personal Information
Children's **photographs** are explicitly covered under COPPA's definition of personal information. A photo of a child that can identify them = personal information under the rule.

### 3.2 Service Provider Exception
The FTC's [Six-Step Compliance Plan](https://www.ftc.gov/business-guidance/resources/childrens-online-privacy-protection-rule-six-step-compliance-plan-your-business) states:
> "Take reasonable steps to release personal information **only to service providers and third parties capable of maintaining its confidentiality, security, and integrity.**"

Under the service provider exception, you CAN share children's data with a third-party processor **if**:
1. The third party is performing a service **on your behalf** (not for their own purposes)
2. You have a written agreement ensuring they maintain confidentiality and security
3. They use the data **only** for the purpose you specified
4. You have verified they can protect the data

### 3.3 Parental Consent
Even with the service provider exception, you still need **verifiable parental consent** (VPC) before collecting the child's photo. The parent must be informed that:
- Photos will be sent to a third-party service for processing
- How long data is retained
- What protections are in place

### 3.4 The 2025 COPPA Rule Updates
The FTC's updated COPPA rule (effective 2025) strengthened requirements:
- Operators **cannot condition participation** on consenting to third-party data disclosure
- Enhanced data security requirements
- Stricter data retention limits (only as long as necessary)

---

## 4. Gap Analysis — Where Replicate Falls Short

| COPPA Requirement | Replicate Status | Gap Severity |
|---|---|---|
| Written agreement (DPA) with data protection terms | No public DPA available | 🔴 **CRITICAL** |
| Service provider commits to confidentiality | ToS has general confidentiality but no COPPA-specific terms | 🟡 **HIGH** |
| Data used only for specified purpose | ToS carves out "Resultant Data" (anonymized) which Replicate retains | 🟡 **MEDIUM** |
| Data deletion capabilities | Auto-delete after 1 hour; no on-demand API delete for inputs | 🟡 **MEDIUM** |
| Data security certifications | No SOC 2 or equivalent found | 🔴 **HIGH** |
| Children's data provisions | Privacy policy says they DON'T collect children's data | 🔴 **CRITICAL** |
| Subprocessor controls | Subprocessors listed but no DPA chain documented | 🟡 **HIGH** |
| Breach notification | No specific breach notification terms found | 🔴 **HIGH** |

---

## 5. Required Safeguards — If You Proceed with Replicate

If you decide to use Replicate despite the risks, you would need ALL of the following:

### 5.1 Contractual (Non-Negotiable)
1. **Execute a custom DPA** with Replicate that explicitly:
   - Acknowledges processing of children's personal information
   - Limits data use to performing services for OurFable only
   - Prohibits use of inputs/outputs for training, analytics, or any secondary purpose
   - Requires immediate deletion upon processing completion (not 1-hour window)
   - Includes breach notification within 24-72 hours
   - Provides audit rights
   - Flows down to all subprocessors
2. **Get Replicate to amend their privacy policy stance** (or get written confirmation that their "no children's data" language doesn't prevent your use case as a business customer processing data on behalf of parents)

### 5.2 Technical
1. **Verifiable Parental Consent (VPC)** — implement a robust VPC mechanism before collecting any photo
2. **Minimize data** — strip EXIF metadata, resize to minimum necessary resolution before sending
3. **Encrypt in transit** — Replicate API uses HTTPS (✅ already covered)
4. **Don't store Replicate URLs** — since outputs auto-delete in 1 hour, save output locally immediately
5. **Audit logging** — log every API call with timestamps, deletion confirmation
6. **Use API only** (not web interface) to get the 1-hour auto-delete behavior

### 5.3 Disclosure to Parents
Your privacy policy must disclose:
- That children's photos are sent to Replicate, Inc. for AI image generation
- Replicate's data retention period (1 hour)
- That data is processed on US-based servers
- List of Replicate's subprocessors

---

## 6. Risk Assessment

### If Using Replicate (with DPA)
- **Legal risk:** MEDIUM-HIGH
- **Rationale:** Even with a DPA, Replicate's own privacy policy creates an awkward posture. In an FTC investigation, Replicate's policy stating they "do not intentionally collect personal information from minors under 16" would be scrutinized. You'd be sending children's data to a service that publicly states it's not designed for it.
- **Financial exposure:** $53,088/violation/day × number of children affected
- **Mitigating factors:** 1-hour auto-deletion, data stays in US, parent-initiated action

### If Using Replicate (without DPA)
- **Legal risk:** VERY HIGH
- **Rationale:** Without a written agreement demonstrating Replicate can maintain confidentiality/security of children's data, you fail the COPPA service provider exception entirely.
- **This is essentially indefensible in an FTC action.**

### If Self-Hosting
- **Legal risk:** LOW
- **Rationale:** No third-party data sharing = no COPPA service provider issues. You still need VPC and proper data handling, but you control the entire pipeline.

---

## 7. Alternative Providers — Comparison

| Provider | DPA Available | COPPA Provisions | SOC 2 | Data Retention Control | Image Gen Models | Complexity | Cost |
|---|---|---|---|---|---|---|---|
| **Replicate** | ❌ No public DPA | ❌ None | ❌ Not found | ⚠️ 1hr auto-delete | Flux, SDXL, etc. | Low | ~$0.01-0.05/image |
| **AWS Bedrock** | ✅ GDPR DPA included | ✅ COPPA settings in Lex; general AWS compliance | ✅ SOC 2 Type II | ✅ Full control | Titan Image, SD | Medium | ~$0.01-0.08/image |
| **Google Cloud Vertex AI** | ✅ DPA included | ✅ COPPA acknowledged | ✅ SOC 2 Type II | ✅ Full control | Imagen | Medium | ~$0.02-0.06/image |
| **Azure AI** | ✅ DPA included | ✅ COPPA provisions | ✅ SOC 2 Type II | ✅ Full control | DALL-E, SD | Medium | ~$0.02-0.08/image |
| **Self-hosted (RunPod/Lambda)** | N/A (you control it) | N/A | You own it | ✅ Total control | Flux, SDXL, any | High | ~$0.50-2.00/hr GPU |
| **Self-hosted (own hardware)** | N/A | N/A | You own it | ✅ Total control | Flux, SDXL, any | Very High | Capital cost |

### Key Observations:
- **AWS, Google, and Azure** all offer DPAs, SOC 2 certifications, and have some COPPA awareness. They are materially safer choices if you must use a third-party API.
- **AWS Bedrock** specifically has COPPA settings for Amazon Lex and a general compliance posture — strongest option among cloud providers.
- **Self-hosting** eliminates the third-party sharing question entirely but requires more engineering effort.

---

## 8. Recommendation — Clear Path Forward

### Recommended: Self-Host Image Generation (Phase 1)

**Why:** Eliminates COPPA third-party data sharing concerns entirely. You process children's photos on infrastructure you control. No DPA needed. No dependency on Replicate's policies.

**How:**
1. **Use RunPod or Lambda Labs** for GPU compute (~$0.50-0.80/hr for A100)
2. **Deploy Flux or SDXL** via ComfyUI or a custom inference pipeline
3. **Photos never leave your controlled infrastructure**
4. Process: Parent uploads photo → your server → your GPU → output → parent
5. Delete source photos immediately after processing

**Cost estimate:** At ~100 books/day, GPU costs would be ~$50-150/month on serverless GPU (RunPod serverless). Comparable to Replicate pricing.

### Alternative: Use AWS Bedrock (Phase 1 if self-hosting is too complex)

If self-hosting isn't feasible initially:
1. Use **AWS Bedrock** with Titan Image Generator or Stable Diffusion
2. AWS's DPA is automatically included in service terms
3. AWS has SOC 2 Type II, HIPAA eligibility, and COPPA awareness
4. You still need VPC and proper parental disclosure

### If You Must Use Replicate (Not Recommended)

Action items in priority order:
1. **Email privacy@replicate.com** requesting a DPA with COPPA-specific provisions
2. **Get written confirmation** that their "no children's data" policy language applies to their website/direct services, not to B2B API usage for processing on behalf of consenting parents
3. **Do not go live** until you have a signed DPA
4. Implement all technical safeguards from Section 5.2
5. **Consult a children's privacy attorney** to review the DPA before signing
6. Budget for annual COPPA compliance audits

### Regardless of Provider — Must-Do Items
- [ ] Implement Verifiable Parental Consent (VPC) mechanism
- [ ] Draft COPPA-compliant privacy policy
- [ ] Create direct notice to parents (what data, how used, who sees it)
- [ ] Implement data minimization (strip metadata, minimum resolution)
- [ ] Set up audit logging for all photo processing
- [ ] Implement data retention/deletion schedule
- [ ] Consult children's privacy attorney before launch

---

## Sources

- Replicate Terms of Service: https://replicate.com/terms (Nov 24, 2025)
- Replicate Privacy Policy: https://replicate.com/privacy (Nov 14, 2024)
- Replicate Acceptable Use Policy: https://replicate.com/acceptable-use-policy
- Replicate Data Retention: https://replicate.com/docs/topics/predictions/data-retention
- Replicate Subprocessors: https://replicate.com/docs/topics/site-policy/subprocessors
- FTC COPPA FAQ: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions
- FTC Six-Step COPPA Compliance: https://www.ftc.gov/business-guidance/resources/childrens-online-privacy-protection-rule-six-step-compliance-plan-your-business
- COPPA Rule (16 CFR §312): https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa

---

*This analysis is informational and does not constitute legal advice. Consult a children's privacy attorney before making final decisions.*
