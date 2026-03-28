# Friends & Family Invite Script

Creates comped Our Fable accounts and sends personalized welcome emails.

## Setup

1. Edit `scripts/friends-list.json` with the friends you want to invite:

```json
[
  {
    "email": "friend@example.com",
    "childName": "Olivia Smith",
    "childDob": "2025-03-15",
    "parentNames": "John & Jane",
    "password": "ourfable2026!"
  }
]
```

Each entry needs:
- **email** — their login email
- **childName** — full name of the child (first name used in emails)
- **childDob** — date of birth (YYYY-MM-DD)
- **parentNames** — how to address the parents (e.g. "John & Jane")
- **password** — the password you'll share with them separately

## Usage

### Dry run (preview, no side effects)

```bash
npx tsx scripts/invite-friends.ts --dry-run
```

### Send invites for real

```bash
npx tsx scripts/invite-friends.ts
```

## What it does

For each friend in the list:

1. **Creates a comped account** via `POST /api/admin/comp-account` (plus plan, no Stripe)
2. **Sends a branded welcome email** via Resend — "Dave & Amanda set up a vault for [child]. Everything is ready."
3. Includes their login link and email address in the email

## Notes

- If account creation fails (e.g. duplicate email), the email is skipped for that entry
- 500ms delay between entries to avoid rate limits
- Emails come from `Dave & Amanda via Our Fable <hello@ourfable.ai>`
- Give friends their passwords separately (text, in person, etc.) — the email says "the password we gave you"
