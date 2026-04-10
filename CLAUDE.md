# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**VOLUME Brussels** -- A nightlife pass and ticketing platform for Brussels clubs and museums. Users buy 24h or 48h passes granting club entry, plus museum access. Individual event tickets are also planned. Staff validate entry via swipe gestures on the user's phone (no QR codes).

Previously built on Softr + Airtable. Now rebuilt from scratch as a full-stack Next.js application with PostgreSQL.

- **Live**: https://volumebrussels-production-157d.up.railway.app
- **Repo**: https://github.com/mrboups/volumebrussels
- **Branch strategy**: `main` is production (Railway auto-deploys on push)

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

```
src/app/
  (public)/              # Public-facing pages (Navbar + Footer layout)
    page.tsx             # Homepage -- hero section + pricing cards
    offer/page.tsx       # Club listing -- fetches from DB, renders OfferCards
    agenda/page.tsx      # Live event feed from agenda.be API
    layout.tsx           # Wraps children with Navbar + Footer
  (auth)/                # Auth pages (no shared layout yet)
    login/page.tsx       # Login page (SCAFFOLD ONLY)
    register/page.tsx    # Register page (SCAFFOLD ONLY)
  dashboard/             # Protected dashboards (shared layout)
    layout.tsx           # Dashboard layout wrapper
    admin/page.tsx       # Admin dashboard (SCAFFOLD ONLY)
    club/page.tsx        # Club dashboard (SCAFFOLD ONLY)
    accounting/page.tsx  # Accounting dashboard (SCAFFOLD ONLY)
    reseller/page.tsx    # Reseller dashboard (SCAFFOLD ONLY)
  pass/[id]/page.tsx     # Pass web app -- user shows to staff (SCAFFOLD ONLY)
  ticket/[id]/page.tsx   # Ticket web app -- user shows to staff (SCAFFOLD ONLY)
  api/
    auth/route.ts        # Auth endpoints (SCAFFOLD ONLY)
    clubs/route.ts       # Club CRUD
    museums/route.ts     # Museum CRUD
    offers/route.ts      # Aggregated listings
    passes/route.ts      # Pass GET (by userId) + POST (create)
    tickets/route.ts     # Ticket CRUD
    webhooks/stripe/     # Stripe webhook -- signature verified, handlers stubbed
  layout.tsx             # Root layout (Montserrat font, Tailwind globals)
```

### Lib Modules

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/db.ts` | Prisma client singleton with PrismaPg adapter, dev query logging | WORKING |
| `src/lib/stripe.ts` | Lazy Stripe client init with API version `2026-03-25.dahlia` | WORKING (client only, no checkout flow) |
| `src/lib/email.ts` | Lazy Resend client init, exports `FROM_EMAIL` constant | WORKING (client only, no templates) |
| `src/lib/auth.ts` | bcrypt hash/verify, JWT magic link token generation/verification | WORKING (utils only, no session management) |

### Components

| Component | Purpose |
|-----------|---------|
| `Navbar.tsx` | Top navigation with logo, Offer/Agenda links, Buy Ticket CTA, mobile hamburger menu |
| `Footer.tsx` | Simple footer with branding and copyright |
| `OfferCard.tsx` | Club card with image, name, description, Instagram/Facebook links |
| `PricingCard.tsx` | Pass pricing card (title, price, features, buy button) |

## Database Models (10 total)

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

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | All user accounts (customers, admins, club staff, resellers) | email (unique), password, role |
| **Club** | Nightclub venues | name, slug (unique), payPerVisit (default 10), openDays[], passInclusion |
| **Museum** | Museum venues | name, slug (unique), payPerVisit (default 8) |
| **Pass** | Purchased passes (night/weekend) | type, price, status, activatedAt, expiresAt, userId, resellerId |
| **PassScan** | Records each club/museum check-in on a pass | passId, clubId OR museumId, scannedAt, scannedBy |
| **Event** | Club events (for individual ticket sales) | name, date, clubId, isLinkedToPass |
| **Ticket** | Individual event tickets | eventId, userId, pricePaid, pricingPhase, validatedAt |
| **PricingPhase** | Tiered pricing per event | eventId, name (early_bird/regular/last_minute), price, startDate, endDate |
| **Reseller** | Reseller accounts with commission tracking | userId (unique), commissionRate (default 8%), magicLinkToken |
| **ClubAccount** | Links club staff users to their club | clubId, userId, magicLinkToken |

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

### Check-in (Swipe Validation)

- No QR codes. User shows `/pass/[id]` or `/ticket/[id]` on their phone.
- Staff swipes to validate.
- Swipe creates a `PassScan` record (for passes) or sets `Ticket.validatedAt` (for tickets).

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
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (Railway provides public URL for build, internal for runtime) |
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (client-side) |
| `RESEND_API_KEY` | Resend email API key |
| `NEXTAUTH_SECRET` | JWT signing secret (used by auth.ts for magic links and tokens) |
| `NEXTAUTH_URL` | Base URL of the application |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL (client-side) |

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

## Build Status: What's Working vs TODO

### BUILT (functional, deployed)

- Full project scaffold with all routes and API endpoints
- PostgreSQL database schema (10 models, all migrations applied)
- Seed script with 9 real clubs + 6 real museums
- **Homepage** -- hero section with value props, pricing cards for Night/Weekend pass
- **Offer page** -- dynamic, fetches clubs from DB, renders cards with images and social links
- **Agenda page** -- fetches live events from agenda.be API, renders event grid with posters
- **Navbar** -- responsive with mobile hamburger, links to Offer/Agenda, Buy Ticket CTA
- **Footer** -- branding and copyright
- **API routes** -- clubs, museums, offers, passes (GET/POST), tickets, auth (scaffolded)
- **Stripe webhook** -- signature verification working, event handlers stubbed
- **Lib modules** -- db.ts (Prisma singleton), stripe.ts, email.ts, auth.ts (hash/verify/JWT)
- **Club and museum images** -- all 15 venue images in `public/`

### TODO (scaffolded but not implemented)

- **Stripe checkout flow** -- no Checkout Session creation, no redirect, PricingCard links to `#`
- **Stripe webhook handlers** -- signature works but `checkout.session.completed` just logs, no Pass/Ticket creation
- **Email sending** -- Resend client exists but no email templates or send calls
- **Pass web app** (`/pass/[id]`) -- shell page only, no swipe UI, no activation logic, no scan recording
- **Ticket web app** (`/ticket/[id]`) -- shell page only, no validation UI
- **Auth system** -- login/register pages are scaffolds, no forms, no session management, no middleware
- **Admin dashboard** -- placeholder text only
- **Club dashboard** -- placeholder text only
- **Accounting dashboard** -- placeholder text only
- **Reseller dashboard** -- placeholder text only
- **Reseller URL tracking** -- no parameter capture or attribution
- **Pass activation logic** -- no server-side activation/expiry calculation
- **Museum page** -- no dedicated museum listing page (only clubs shown on /offer)

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
