# OurFable Email Review Pack

This folder is the review pack for customer-facing email templates.

Current customer-facing templates in `src/lib/email-templates/`:

1. `dispatch.ts`
   - Purpose: Dispatches from parent to circle members
   - Notes: Dispatches are intentionally private but not end-to-end encrypted

2. `gift-waitlist.ts`
   - Purpose: Gift reservation / gift waitlist messaging

3. `parent-invite.ts`
   - Purpose: Invite a co-parent / second parent into a family account

4. `founding-invite.ts`
   - Purpose: Founding-family invite/welcome messaging

5. `guardian-assigned.ts`
   - Purpose: Vault guardian assignment notification

6. `waitlist-welcome.ts`
   - Purpose: Welcome email after reserving / joining waitlist
   - Recent update: stale World Snapshot references were removed and reframed around real live features

How to review:
- Read the template source files directly in `src/lib/email-templates/`
- Use this README as the checklist of templates to inspect
- If needed, Hermes can next generate rendered preview HTML files for each template with sample data

Recommended next step:
- Generate one preview HTML per template so Dave can open them in a browser side-by-side
