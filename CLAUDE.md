# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**VOLUME Brussels** -- A nightlife pass and ticketing platform for Brussels clubs and museums. Users buy 24h or 48h passes granting club entry, plus museum access. Individual event tickets are also planned. Staff validate entry via swipe gestures on the user's phone (no QR codes).

Previously built on Softr + Airtable. Now rebuilt from scratch as a full-stack Next.js application with PostgreSQL. **In production — the DB holds real customer data and real money has moved through Stripe.**

- **Live**: https://volumebrussels.com
- **Repo**: https://github.com/mrboups/volumebrussels
- **Branch strategy**: `main` is production (Railway auto-deploys on push)

### Canonical docs — read these before making changes

- `dev/architecture.md` — route map, module boundaries, request topology, data flows
- `dev/security-audit.md` — full audit findings + current fix status per finding
- `specs/data-models.md` — every Prisma model with its current fields (10 models)
- `specs/api-schema.md` — every API route with its auth model
- `specs/business-logic.md` — pass lifecycle, giveaway rules, financial model, magic-link rule

Keep all five files updated on every non-trivial change. Stale docs in this project are treated the same as broken code.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, TypeScript) | 16.2.2 |
| React | React | 19.2.4 |
| Styling | Tailwind CSS | v4 |
| Database | PostgreSQL via Prisma ORM | Prisma 7.6.0 |
| DB Adapter | @prisma/adapter-pg (driver adapter) | 7.6.0 |
| Payments | Stripe | 22.x |
| Email | Resend | 6.x |
| Auth | Custom (bcryptjs + jsonwebtoken) | -- |
| Deployment | Railway (Next.js service + PostgreSQL) | -- |

### Prisma 7 Specifics

- **No `url` in datasource block** -- Prisma 7 uses a driver adapter (`PrismaPg`) instead of a direct URL in `schema.prisma`.
- **Generated client location**: `src/generated/prisma/` (gitignored). Always import from `@/generated/prisma/client`, never from `@prisma/client`.
- **`prisma generate`** runs automatically on `npm run build` and `postinstall`.
- **Seed script** uses `dotenv/config` and creates its own PrismaClient with the adapter (not the singleton from `db.ts`).

## Architecture

### Route Groups

See `dev/architecture.md` for the full route map and request topology. Summary:

- `(public)/` — home, offer, agenda, news, museums, buy-ticket, privacy, terms
- `(auth)/` — login, register
- `dashboard/` — admin, club, accounting, reseller, passes, tickets, users (server `layout.tsx` adds noindex metadata, `DashboardShell.tsx` is the client nav)
- `pass/[id]/` and `ticket/[id]/` — customer-facing pass / ticket pages (link = credential)
- `passes/manage/[paymentId]/` — multi-pass assignment after checkout
- `giveaway/[slug]/` — public multilingual giveaway forms
- `events-links/` — internal event sale URL list
- `scan-setup/` does NOT exist and must not be reintroduced (see the Check-in Critical block below)
- `api/` — 20+ routes; every admin / mutating route is gated (see `specs/api-schema.md`)

### Lib Modules

| File | Purpose |
|---|---|
| `src/lib/db.ts` | Prisma client singleton with `PrismaPg` driver adapter |
| `src/lib/auth.ts` | bcrypt hash/verify, JWT `generateToken` / `verifyToken`, `generateMagicLinkToken` |
| `src/lib/session.ts` | `getCurrentUser`, **`requireAdmin()`** (throws on non-admin — used at the top of every admin server action), **`isAdminRequest()`** (boolean for API routes) |
| `src/lib/stripe.ts` | Lazy Stripe client init |
| `src/lib/email.ts` | Resend client, `sendPassEmail` (with `isGuest` flag), `sendTicketEmail` |
| `src/lib/tz.ts` | Europe/Brussels parsing, formatting, and the `getVisibilityCutoff()` helper used on `/tickets` + `/tickets/[slug]` |
| `src/lib/scanGuard.ts` | `checkSameOrigin` + `rateLimit` for `/api/scan` and `/api/tickets/validate` |
| `src/lib/rateLimiter.ts` | Shared sliding-window rate limiter; used by both `scanGuard` and `/api/auth` |

### Components

| Component | Purpose |
|-----------|---------|
| `Navbar.tsx` | Top navigation with logo, Offer/Agenda links, Buy Ticket CTA, mobile hamburger menu |
| `Footer.tsx` | Simple footer with branding and copyright |
| `OfferCard.tsx` | Club card with image, name, description, Instagram/Facebook links |
| `PricingCard.tsx` | Pass pricing card (title, price, features, buy button) |

## Feature inventory (as of 2026-04-11)

Everything in this list is **live and functional**, not scaffolded. When in doubt about specifics, check the spec files listed above — this is just the navigator.

**Customer-facing**
- Home with hero, pricing, news carousel, clubs preview
- `/offer` — clubs + museums cards (OfferCard component) with music tags, dresscode, hours, social links
- `/agenda` — external agenda.be feed
- `/news` + `/news/[slug]` — article listing + detail with smart RichText rendering (auto-links + inline images)
- `/museums` — standalone museum listing
- `/buy-ticket` — pass + ticket purchase entry, Stripe Checkout Session flow, adjustable quantity 1..10
- `/tickets` + `/tickets/[slug]` — event listings with an "Upcoming" grid and a muted "Past Events" archive section below (2h-after-day+1 cutoff)
- `/pass/[id]`, `/ticket/[id]` — customer swipe surfaces
- `/passes/manage/[paymentId]` — multi-pass assignment (extra passes in a multi-purchase can be assigned to other emails)
- `/giveaway/[slug]` — public multilingual giveaway form (EN / FR / NL), one free pass per user per form, localized success + error messages
- Public routes all have per-page SEO metadata, canonical URLs, OG tags, and explicit `robots: index, follow`

**Admin**
- `/dashboard/admin` — overview with Recent Passes (grouped by `stripePaymentId`, guest/giveaway badges), Recent Tickets, Recent Scans, "Add Guest Pass" and "Buy Test Pass" buttons
- `/dashboard/admin/clubs`, `.../museums` — CRUD with image upload (react-image-crop), sort order, contact email, tags, hours
- `/dashboard/admin/events` — CRUD with auto-chained pricing phases, soft-delete when tickets exist, toggle-sales button
- `/dashboard/admin/articles` — CRUD with AI content generation
- `/dashboard/admin/giveaways` — CRUD with language tabs and a **"Translate with AI"** button that calls `/api/ai/translate`
- `/dashboard/admin/resellers` — CRUD, magic-link generation
- `/dashboard/admin/reports` — quarterly club report + half-yearly reseller report, Send button

**Top-level dashboard sections** (next to Admin / Club / Accounting / Reseller)
- `/dashboard/passes` — searchable pass list (up to 500 rows), same actions as Recent Passes (View / Resend / Edit email)
- `/dashboard/tickets` — searchable ticket list (same pattern)
- `/dashboard/users` — searchable user list with expandable rows showing each user's full pass + ticket purchase history, total spent, and inline View links

**Club dashboard**
- Magic-link filtered to one club when `?token=...` is present
- Pass stats + ticket stats + combined total (visited tickets = 100% of `pricePaid` → club, unvisited = stays with Volume)
- "Recent Ticket Check-ins" table
- Quarterly reports with ticket columns
- No internal caveats shown to the club (internal-only text is kept out of club-visible templates)

**Accounting dashboard**
- Split `Pass Revenue` + `Ticket Revenue`
- Club payouts = pass (visits × payPerVisit) + validated ticket revenue
- Platform revenue = Total − Club − Museum payouts
- Transaction detail table

## Database Models (11 total)

### Enums

| Enum | Values |
|------|--------|
| `UserRole` | admin, club, reseller, customer |
| `PassType` | night, weekend |
| `PassStatus` | purchased, active, expired, refunded |
| `TicketStatus` | purchased, used, expired, refunded |
| `PricingPhaseName` | early_bird, regular, last_minute |
| `DayOfWeek` | friday, saturday, sunday |
| `PassInclusion` | friday, saturday, both, weekend |

### Models

Full schema lives in `prisma/schema.prisma`. Authoritative spec in `specs/data-models.md`.

| Model | Purpose | Key fields added post-scaffold |
|---|---|---|
| **User** | All accounts — emails always normalized (trim + lowercase) | role, password (bcrypt 12) |
| **Club** | Nightclub venues | `sortOrder`, `contactEmail`, `musicTags[]`, `dresscodeTags[]`, `openTime`, `closeTime`, `passInclusion` |
| **Museum** | Museum venues | `openDays[]`, `openTime`, `closeTime`, `sortOrder` |
| **Pass** | Purchased / guest / giveaway passes | `formId` FK to `GiveawayForm`, `stripePaymentId` source prefix marker |
| **PassScan** | Club/museum check-in | unchanged |
| **Event** | Events with ticket sales | `salesEnded`, `slug`, `isActive` (soft delete when tickets exist) |
| **Ticket** | Event tickets | `validatedAt` drives club ticket revenue |
| **PricingPhase** | Tiered event pricing | auto-chained in the event form |
| **Reseller** | Reseller accounts | `magicLinkToken` (never auto-expires) |
| **ClubAccount** | Club staff access | `magicLinkToken` (never auto-expires) |
| **GiveawayForm** | Public multilingual giveaway forms | `titleEn/Fr/Nl`, `descriptionEn/Fr/Nl`, `successMessageEn/Fr/Nl`, `passType`, `isActive` |
| **Article** | News articles | `coverImage`, `isPublished`, `sortOrder` |

## Key Business Rules

### Pass Types and Pricing

| Pass | Price | Duration | Club Access |
|------|-------|----------|-------------|
| Night | 29 EUR | 24h from first scan | 2 clubs |
| Weekend | 48 EUR | 48h from first scan | Unlimited |

### Pass Activation and Expiry

- Pass starts as `purchased`. Remains valid indefinitely until first club scan.
- First scan sets `activatedAt` and calculates `expiresAt`.
- **Night pass used Friday** -- valid until Saturday 11:00 AM.
- **Night pass used Saturday** -- valid until Sunday 11:00 AM.
- **Weekend pass used Friday** -- valid until Sunday.

### After-Clubs Access (Post-Expiry Museums)

- If pass used Friday night -- museum access until Saturday 8:00 PM.
- If pass used Saturday night -- museum access until Sunday midnight or 3:00 AM.

### Museums

- Atomium and Design Museum Brussels: do not activate pass, accessible 1 week after activation, 8 EUR/visit pay-per-visit to venue.
- Brussels City Museums (GardeRobe MannekenPis, Sewer Museum, Fashion & Lace Museum, La Maison du Roi): 5 EUR/visit pay-per-visit.
- Design Museum Brussels: 0 EUR pay-per-visit (free for Volume).

### Club Pay-Per-Visit

Default 10 EUR per visit. Most seeded clubs are configured at 20 EUR. Configurable per club via `payPerVisit` field.

### Reseller System

- Resellers earn 8% commission (configurable via `commissionRate`).
- Tracking via URL parameter linking to reseller ID.
- Magic link access to reseller dashboard.

### Ticket Pricing

Events support three pricing phases: `early_bird`, `regular`, `last_minute`. Each phase has its own price and date range.

### Check-in (Swipe Validation) — CRITICAL model

**The system never uses a scanner device. There is no staff app, no scanner
hardware, no separate scanning device of any kind.**

The actual flow, once and for all:

1. The customer arrives at the club / venue with their own phone.
2. The customer opens `/pass/[id]` or `/ticket/[id]` on their phone (from the
   email we sent them after purchase). This is a public URL — the link is
   the credential, same model as any e-ticket QR code.
3. The customer **physically hands their phone to the door staff**.
4. Door staff swipes the slider on the customer's phone screen to check the
   user in.
5. The swipe triggers a client-side fetch from the customer's phone to
   `/api/scan` (for passes) or `/api/tickets/validate` (for tickets).
6. The server records a `PassScan` row (for passes) or sets
   `Ticket.validatedAt = now()` and `Ticket.status = "used"` (for tickets).

**Do NOT ever propose, build, or assume any of the following**, because they
do not match reality:

- A separate staff scanner device or staff phone
- A scanner credential stored on a staff device
- An `X-Scan-Secret` / `SCAN_SECRET` / staff-bearer-token flow
- A `/scan-setup` page or any "configure this device first" onboarding
- NFC, QR, or camera-based cross-device scanning
- Any requirement that the swipe request comes from anywhere other than
  the customer's own `/pass/[id]` or `/ticket/[id]` page

The only defense on the swipe endpoints is `src/lib/scanGuard.ts`
(same-origin + per-IP rate limit). Extending that is fine. Reintroducing a
staff-credential model is not fine.

## Current Data (Seeded)

### 9 Clubs

| Club | Open Days | Pass Inclusion | Pay/Visit |
|------|-----------|----------------|-----------|
| Bloody Louis | Saturday | Saturday only | 20 EUR |
| Spirito | Fri + Sat | Both | 20 EUR |
| Mirano | Fri + Sat | Both | 20 EUR |
| Fuse | Fri + Sat | Both | 20 EUR |
| C12 | Saturday | Saturday only | 20 EUR |
| Madame Moustache | Fri + Sat | Both | 10 EUR |
| Chez Ginette | Friday | Friday only | 20 EUR |
| UMI | Fri + Sat | Both | 20 EUR |
| Jalousy | Fri + Sat | Both | 20 EUR |

### 6 Museums

| Museum | Pay/Visit |
|--------|-----------|
| Atomium | 8 EUR |
| Design Museum Brussels | 0 EUR |
| GardeRobe MannekenPis | 5 EUR |
| Sewer Museum | 5 EUR |
| Fashion & Lace Museum | 5 EUR |
| La Maison du Roi | 5 EUR |

### Images

- Club images: `public/clubs/{slug}.jpg` (UMI is `.png`)
- Museum images: `public/museums/{slug}.jpg`

## External APIs

| Service | Purpose | Details |
|---------|---------|---------|
| **agenda.be** | Live event feed for /agenda page | `https://api.agenda.be/event/search?volume_brussels=1&size=400`, revalidated hourly |
| **Stripe** | Payment processing | API version `2026-03-25.dahlia`, webhook signature verification implemented |
| **Resend** | Transactional emails | From address: `noreply@volumebrussels.com` |
| **Airtable** (legacy) | Previous data source | Base `app5bbYcXgQ3wYsUw`, no longer used in new codebase |

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Railway provides public URL for build, internal for runtime) |
| `STRIPE_SECRET_KEY` | Stripe API secret key (live) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret — required for `/api/webhooks/stripe` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (client-side) |
| `RESEND_API_KEY` | Resend email API key |
| `OPENAI_API_KEY` | OpenAI API key — used by `/api/ai` and `/api/ai/translate` (admin-only) |
| `NEXTAUTH_SECRET` | JWT signing secret (used by `src/lib/auth.ts`) |
| `NEXTAUTH_URL` | Base URL of the application |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL — also used by `scanGuard.checkSameOrigin()` |
| `CRON_SECRET` | Required by `/api/cron` (pass expiry) — endpoint fails closed when missing |
| `RAILWAY_VOLUME_MOUNT_PATH` | Railway volume mount for image uploads (`/data`), serves `/uploads/*` |

## Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # prisma generate + next build
npm run start            # Start production server
npm run lint             # ESLint

# Database
npm run db:seed          # Seed clubs + museums (npx tsx prisma/seed.ts)
npm run db:migrate       # prisma migrate dev (create/apply migration)
npm run db:push          # prisma db push (prototyping, no migration file)
npm run db:studio        # prisma studio (visual DB browser)
npx prisma generate      # Regenerate Prisma client to src/generated/prisma/
```

## Deployment (Railway)

- **Platform**: Railway (auto-deploys on push to `main`)
- **Project name**: empowering-essence
- **Service**: volumebrussels
- **PostgreSQL service**: Postgres (Railway addon, `DATABASE_URL` auto-injected)
- **No Docker** -- Railway builds directly from the repo.
- `DATABASE_URL` uses the public URL during build and the internal Railway URL at runtime.

```bash
railway up               # Manual deploy
railway logs             # Check logs
railway variables        # Manage env vars
```

## Build Status

**The full feature set is built, deployed, and taking real money.** See the
"Feature inventory" block above for the authoritative list. The only known
open items are the Medium-severity security follow-ups listed in
`dev/security-audit.md` (M2 session revocation, M6 email disclosure on
`/passes/manage`, future strict CSP with nonces).

## Project Structure

```
volumebrussels/
  prisma/
    schema.prisma            # All 10 models + 7 enums
    seed.ts                  # Seeds 9 clubs + 6 museums
    migrations/              # Applied migrations
  src/
    app/
      (public)/              # Landing, offer, agenda (Navbar+Footer layout)
      (auth)/                # Login, register
      dashboard/             # Admin, club, accounting, reseller (shared layout)
      pass/[id]/             # Pass web app
      ticket/[id]/           # Ticket web app
      api/                   # REST endpoints
        auth/                # Auth
        clubs/               # Club CRUD
        museums/             # Museum CRUD
        offers/              # Aggregated listings
        passes/              # Pass CRUD
        tickets/             # Ticket CRUD
        webhooks/stripe/     # Stripe webhook
      layout.tsx             # Root layout (Montserrat, Tailwind)
    components/
      Navbar.tsx             # Responsive top nav
      Footer.tsx             # Site footer
      OfferCard.tsx          # Club card component
      PricingCard.tsx        # Pass pricing card
    generated/
      prisma/                # Generated Prisma client (gitignored)
    lib/
      db.ts                  # Prisma singleton
      stripe.ts              # Stripe client
      email.ts               # Resend client
      auth.ts                # Password + JWT utilities
  public/
    clubs/                   # 9 club images
    museums/                 # 6 museum images
  dev/
    architecture.md          # Developer architecture docs
  specs/
    api-schema.md            # API specification
    business-logic.md        # Business rules specification
    data-models.md           # Data model specification
  .env.example               # Required environment variables
```

## Conventions

- **Self-contained pages** -- each page fetches its own data, no global state management.
- **Tailwind CSS v4** -- all styling via utility classes, no CSS modules.
- **CSS scoped** -- component-level styling, no global class conflicts.
- **Montserrat font** -- loaded via Google Fonts in root layout.
- **`force-dynamic`** -- used on pages that need DB at runtime (e.g., /offer).
- **Images from `public/`** -- all venue images served statically.
- **Prisma seed for initial data** -- `npm run db:seed` to populate clubs and museums.
- **Import paths** -- use `@/` alias (mapped to `src/`).
- **No Docker** -- native runtime for local dev, Railway builds directly.

## Security Posture

Full report: **`dev/security-audit.md`**. Summary of the most recent audit (2026-04-11):

- **All 3 Critical findings fixed.** Admin server actions are gated by `requireAdmin()`, `/api/scan` and `/api/tickets/validate` are defended by `scanGuard` (same-origin + rate limit), `/api/magic-link` requires admin.
- **All 5 High findings fixed or intentionally accepted.** Reports / assign / cron / upload are closed; H2 (tokens never auto-expire) is accepted as a product rule.
- **Medium — M1, M3, M4, M5 closed.** M2 (90-day JWT revocation) and M6 (email disclosure on `/passes/manage`) are open.

### Non-negotiable security rules

1. **Every exported function in `src/app/dashboard/admin/_actions.ts` must start with `await requireAdmin();`.** The public `submitGiveawayForm` is the only exception. The middleware alone does not protect server actions — the helper must be called explicitly.
2. **Every mutating API route** (write, delete, email-send) must either:
   - Call `isAdminRequest()` and return 403 on failure, OR
   - Verify an alternative ownership proof (e.g. `/api/passes/assign` checks `paymentId`), OR
   - Validate the Stripe webhook signature (for `/api/webhooks/stripe`).
3. **Magic links and pass/ticket URLs never auto-expire.** They are valid forever until manually regenerated (for club/reseller tokens) or replaced by a new purchase. Do not add TTLs to any of them without explicit product approval.
4. **Rate limiting uses `src/lib/rateLimiter.ts`.** Do not write parallel in-memory limiters — refactor and reuse.
5. **Scan endpoints only get `scanGuard` — never a staff credential.** See the Check-in Critical block below.
6. **Email is always `trim().toLowerCase()`** before a DB lookup or write. User lookup by raw casing is forbidden — it creates duplicate accounts.
7. **Upload extension comes from the validated MIME type**, not the user-supplied filename. Never trust `file.name`.
8. **Cron and any future secret-guarded endpoint must fail closed when the env var is missing.** Inverted "skip if unset" checks are a bug.
9. **Baseline response headers live in `next.config.ts → headers()`.** Do not disable them per route. Strict CSP is deliberately not set until the third-party script layer is refactored with nonces.
10. **Do not seed / reset / `deleteMany` in production.** See the DB Data Protection block below.

## Production-Only Rule

Every line of code must be real, operational, production-grade. No dummy data, mocks, placeholders, TODO stubs, or fake API responses. If something is not ready, hide it or skip it entirely.

## DB Data Protection — CRITICAL

**The project is now in PRODUCTION. NEVER overwrite, reset, or destroy data in the database.**

- **NEVER run `npx tsx prisma/seed.ts`** — it performs `deleteMany` on all tables
- **NEVER run destructive SQL/Prisma operations** like `updateMany` without `where`, `deleteMany`, `db push --force-reset`, `migrate reset`
- **NEVER modify existing rows in bulk** without explicit user confirmation
- For schema migrations: use `prisma migrate dev --create-only` or `prisma db push --accept-data-loss` ONLY when the user explicitly asks and understands the implication
- When adding new fields with defaults, that's safe. Dropping columns or changing types is NOT safe
- If a script needs to update data, ALWAYS use targeted `where` clauses with IDs or specific filters — never affect all rows
- If you need to seed new data (e.g., add a new article), use `create` or `upsert` with specific unique keys, never delete first
- When in doubt, ASK the user before touching the DB

## Documentation Rules -- MANDATORY

Every commit that changes code must update the corresponding docs in `dev/` and `specs/`. Missing or outdated documentation is treated the same as broken code -- it blocks the commit.

Two documentation layers:
1. **`dev/`** -- Developer docs: what every part does, how modules connect, how to extend.
2. **`specs/`** -- Specifications: data models, API schemas, business logic. Source of truth for rebuilding the system.

## Cache Busting (Web)

- Content hash in all JS/CSS filenames (Next.js handles this by default).
- Root HTML never cached long-term.
- CDN invalidation after every deploy.
- No aggressive service worker caching unless explicitly requested.

## Self-Correcting Development

After writing code, always run `npm run build` and `npm run lint` and fix errors before reporting to the user.

- Default mode: `--interactive` (show errors and proposed fix, wait for confirmation).
- `--auto` mode: fix immediately, only stop after 3 failed attempts on the same error.
- After deployment, tell the user exactly what to verify and ask for screenshots/console output.

## Using Other AI Models

Agents can call Gemini, ChatGPT, and Codex as sub-agents via Bash.

### Gemini
```bash
gemini -p "your question here"
```

### ChatGPT (GPT-4o)
```bash
curl -s https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"your question"}]}' \
  | jq -r '.choices[0].message.content'
```

### Codex
```bash
codex --approval-mode full-auto -q "your question here"
```

### How it works
Claude launches a sub-agent -> sub-agent calls external AI via Bash -> parses response -> returns summary to Claude. Your main conversation context stays protected.

## Relevant Agents

- **dev-setup** -- Project initialization and scaffolding
- **frontend-design** -- UI component creation with high design quality
- **claude-api** -- Anthropic SDK integration if needed
- **simplify** -- Code review for reuse, quality, efficiency
