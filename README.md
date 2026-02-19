# 📖 OurFable.ai

Personalized AI-generated storybooks where your child is the hero.

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (email + OAuth) |
| Storage | Supabase Storage (photos, PDFs) |
| Payments | Stripe Checkout |
| Story AI | Anthropic Claude |
| Image AI | Replicate (Flux) — *TODO* |
| Print | Lulu API — *TODO* |

## Project Structure

```
ourfable/
├── app/
│   ├── api/
│   │   ├── auth/              ✅ Supabase auth callback
│   │   ├── books/route.ts     ✅ GET (list) + POST (create book)
│   │   ├── generate/route.ts  ✅ POST (AI story generation via Claude)
│   │   ├── orders/route.ts    ✅ GET (list) + POST (create order + Stripe checkout)
│   │   ├── upload/route.ts    ✅ POST (signed upload URL for photos)
│   │   └── webhooks/
│   │       └── stripe/route.ts ✅ Stripe payment webhook handler
│   ├── auth/                  ✅ Login + signup pages
│   ├── create/                ✅ Book creation form page
│   └── dashboard/             ✅ User dashboard
├── lib/
│   ├── stripe.ts              ✅ Stripe client + pricing
│   └── supabase/              ✅ Browser + server Supabase clients
├── supabase/
│   └── schema.sql             ✅ Full DB schema with RLS policies
└── types/
    └── database.ts            ✅ TypeScript types for DB tables
```

## Database Schema

```
profiles ──1:N──> books ──1:N──> orders
                    │
                    └── pages (JSONB array inside book)
```

**Tables:**
- `profiles` — user data, auto-created on Supabase signup
- `books` — character info, story prompt, art style, generated pages (JSONB), status
- `orders` — digital/hardcover, Stripe payment, shipping tracking

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Get signed URL for photo upload to Supabase Storage |
| GET | `/api/books` | List authenticated user's books |
| POST | `/api/books` | Create a new book (draft) |
| POST | `/api/generate` | Generate story + image prompts via Claude |
| GET | `/api/orders` | List authenticated user's orders |
| POST | `/api/orders` | Create order + Stripe checkout session |
| POST | `/api/webhooks/stripe` | Handle Stripe payment events |

## Data Flow

```
1. UPLOAD:   Client → /api/upload → signed URL → Client uploads to Supabase Storage
2. CREATE:   Client → /api/books { name, age, photo, prompt, style } → book (draft)
3. GENERATE: Client → /api/generate { bookId } → Claude → story + image prompts → book (ready)
4. PURCHASE: Client → /api/orders { bookId, format } → Stripe checkout → webhook → fulfilled
```

## Setup

### 1. Supabase
- Create project at [supabase.com](https://supabase.com)
- Run `supabase/schema.sql` in the SQL Editor
- Copy project URL + keys

### 2. Stripe
- Create account at [stripe.com](https://stripe.com)
- Get API keys
- Set webhook to `https://yourdomain.com/api/webhooks/stripe`
- Events: `checkout.session.completed`, `charge.refunded`

### 3. Anthropic
- Get API key from [console.anthropic.com](https://console.anthropic.com)

### 4. Environment
```bash
cp .env.local.example .env.local
# Fill in all values
```

### 5. Run
```bash
npm install
npm run dev
```

## Remaining TODO

### Must-have
- [ ] Image generation — integrate Replicate API for page illustrations
- [ ] PDF assembly — compile generated pages into downloadable PDF
- [ ] Print-on-demand — integrate Lulu/Blurb for hardcover fulfillment
- [ ] Book preview page — reading experience for generated books
- [ ] Download flow — signed URLs for purchased digital books

### Nice-to-have
- [ ] Background job queue (Inngest / Trigger.dev) for generation
- [ ] Rate limiting on generation endpoints
- [ ] Retry logic for failed page generations
- [ ] Email notifications (order confirmation, shipping updates)
- [ ] Gift purchases (send to someone else)
- [ ] Book gallery / sample books for marketing
