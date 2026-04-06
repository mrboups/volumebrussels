# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**VOLUME Brussels** — A nightlife pass and ticketing platform for Brussels clubs and museums. Users buy 24h/48h passes for club entry, individual event tickets, and museum vouchers. Staff validate entry via swipe gestures (no QR codes).

## Workspace Environment

- **Repository**: `volumebrussels` (GitHub — MrBoups)
- **Deployment**: Railway (with PostgreSQL addon)
- **Domain**: volumebrussels.com (TBD)
- **Branch strategy**: `main` is production

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL via Prisma ORM |
| Payments | Stripe (Checkout + Webhooks) |
| Email | Resend |
| Auth | Custom (bcrypt + JWT) with magic links for clubs/resellers |
| Deployment | Railway |

## Architecture

### Route Groups
- `(public)/` — Landing page, pricing, club listing, agenda. Server-rendered, no auth.
- `(auth)/` — Login, register pages.
- `pass/[id]` — Pass web app shown on user's phone. Staff swipes to validate.
- `ticket/[id]` — Ticket web app shown on user's phone. Staff swipes to validate.
- `dashboard/admin` — Full CRUD on all entities.
- `dashboard/club` — Club-specific view (magic link access, read-only).
- `dashboard/accounting` — Financial overview (admin access).
- `dashboard/reseller` — Reseller sales + commission (magic link access).

### API Routes
All under `src/app/api/`:
- `auth/` — Registration and login
- `passes/` — Pass CRUD + activation logic
- `tickets/` — Ticket CRUD + validation
- `clubs/` — Club management
- `museums/` — Museum management
- `offers/` — Aggregated listings (clubs + upcoming events)
- `webhooks/stripe/` — Stripe webhook handler

### Lib Modules
- `src/lib/db.ts` — Prisma client singleton
- `src/lib/stripe.ts` — Stripe client
- `src/lib/email.ts` — Resend client
- `src/lib/auth.ts` — Password hashing, JWT, magic link token generation

## Key Business Rules

### Pass Activation
- Pass starts as `purchased`. First scan sets `activatedAt` and calculates `expiresAt`.
- Night Pass: 24h from activation (29 EUR). Weekend Pass: 48h from activation (48 EUR).
- Each club scanned only once per pass. Museum vouchers valid 7 days post-activation.

### Check-in (Swipe)
- No QR codes. User shows `/pass/[id]` or `/ticket/[id]`, staff swipes to validate.
- Swipe creates a `PassScan` or sets `Ticket.validatedAt`.

### Financial
- Clubs receive `payPerVisit` (default 10 EUR) per pass scan.
- Museums receive `payPerVisit` (default 8 EUR) per pass scan.
- Resellers earn `commissionRate` (default 8%) on referred sales.

## Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint

# Database
npx prisma migrate dev   # Create/apply migration
npx prisma generate      # Regenerate Prisma client
npx prisma studio        # Visual database browser
npx prisma db push       # Push schema without migration (prototyping only)

# Deployment
railway up               # Deploy to Railway
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | Stripe API secret |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key (client-side) |
| `RESEND_API_KEY` | Resend email API key |
| `NEXTAUTH_SECRET` | JWT signing secret |
| `NEXTAUTH_URL` | Base URL of the application |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL |

## Project Structure

```
volumebrussels/
  prisma/
    schema.prisma          # Database schema (all models)
  src/
    app/
      (public)/            # Landing, offers, agenda, pricing
      (auth)/              # Login, register
        login/
        register/
      ticket/[id]/         # Ticket web app (staff validation)
      pass/[id]/           # Pass web app (swipe check-in)
      dashboard/
        admin/             # Admin dashboard
        club/              # Club dashboard (magic link)
        accounting/        # Accounting dashboard
        reseller/          # Reseller dashboard
      api/
        webhooks/stripe/   # Stripe webhook handler
        auth/              # Auth endpoints
        passes/            # Pass CRUD + activation
        tickets/           # Ticket CRUD + validation
        clubs/             # Club CRUD
        museums/            # Museum CRUD
        offers/            # Offers/listings
    lib/
      db.ts                # Prisma client
      stripe.ts            # Stripe client
      email.ts             # Resend client
      auth.ts              # Auth utilities
    components/            # Shared React components
  dev/                     # Developer documentation
  specs/                   # Rebuild specifications
  .env.example             # Required environment variables
```

## Production-Only Rule

Every line of code must be real, operational, production-grade. No dummy data, mocks, placeholders, TODO stubs, or fake API responses. If something is not ready, hide it or skip it entirely.

## Documentation Rules -- MANDATORY

Every commit that changes code must update the corresponding docs in `dev/` and `specs/`. Missing or outdated documentation is treated the same as broken code -- it blocks the commit.

Two documentation layers:
1. **`dev/`** — Developer docs: what every part does, how modules connect, how to extend.
2. **`specs/`** — Specifications: data models, API schemas, business logic, auth flows. Source of truth for rebuilding the system.

## Cache Busting (Web)

- Content hash in all JS/CSS filenames (Next.js handles this by default).
- `index.html` / root HTML never cached long-term.
- CDN invalidation after every deploy.
- No aggressive service worker caching unless explicitly requested.

## Self-Correcting Development

After writing code, always run `npm run build` and `npm run lint` and fix errors before reporting to the user.

- Default mode: `--interactive` (show errors and proposed fix, wait for confirmation).
- `--auto` mode: fix immediately, only stop after 3 failed attempts on the same error.
- After deployment, tell the user exactly what to verify and ask for screenshots/console output.

## Deployment (Railway)

Railway is the deployment platform. No Docker required for local development.

```bash
railway up                # Deploy
railway logs              # Check logs
railway variables         # Manage env vars
```

PostgreSQL is provisioned as a Railway addon. The `DATABASE_URL` is automatically injected.

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

- **dev-setup** (this agent) — Project initialization and scaffolding
- **frontend-design** — UI component creation with high design quality
- **claude-api** — Anthropic SDK integration if needed
- **simplify** — Code review for reuse, quality, efficiency
