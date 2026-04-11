# Architecture Overview

Volume Brussels is a production Next.js 16 app running on Railway, backed by
PostgreSQL and Prisma 7. Everything customer-facing (homepage, offer, agenda,
news, buy-ticket, pass/ticket views) is server-rendered; everything internal
(admin / club / reseller / accounting dashboards, API routes) is guarded by
JWT middleware or per-route checks.

Live: https://volumebrussels.com

## Request topology

```
                         ┌──────────────────────────┐
                         │    Customer browser      │
                         └─────────────┬────────────┘
                                       │
                                       ▼
                         ┌──────────────────────────┐
                         │   Next.js (App Router)   │
                         │   src/app/**             │
                         └──┬───────────────────────┘
    ┌──────────┬────────────┼──────────────┬──────────────┐
    ▼          ▼            ▼              ▼              ▼
 Public    Dashboards    Pass/Ticket    API routes     Middleware
 /(public) /dashboard    /pass/[id]     /api/**        src/middleware.ts
 /giveaway /admin/…      /ticket/[id]
 /news     /club
 /offer    /reseller
 /agenda   /accounting
 /tickets  /passes /tickets /users
    │          │            │              │              │
    ▼          ▼            ▼              ▼              ▼
 ┌──────────────────────────────────────────────────────┐
 │                   Prisma client                      │
 │                   src/lib/db.ts                      │
 └──────────────────────────┬───────────────────────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │  PostgreSQL      │
                   │  (Railway)       │
                   └──────────────────┘

 External services (all server-side only):
   Stripe  — /api/checkout, /api/checkout/ticket, /api/checkout/test-pass,
             /api/webhooks/stripe
   Resend  — src/lib/email.ts (pass/ticket/report templates)
   OpenAI  — /api/ai, /api/ai/translate (admin only)

 Third-party inline scripts injected in src/app/layout.tsx:
   Crisp chat, Google Tag Manager, Google Analytics, Facebook Pixel, Hotjar
```

## Route map

```
src/app/
  layout.tsx                       Root layout, SEO metadata, third-party scripts
  sitemap.ts                       Dynamic sitemap
  middleware.ts (at src/)          JWT auth + X-Robots-Tag + matcher

  (public)/                        Navbar + Footer layout
    page.tsx                       Home — hero, pricing, news carousel, clubs preview
    offer/page.tsx                 Clubs + museums included in the pass
    agenda/page.tsx                External agenda.be feed
    news/page.tsx                  Article listing
    news/[slug]/page.tsx           Article detail (generateMetadata)
    museums/page.tsx               Museum listing
    buy-ticket/page.tsx            Pass + ticket purchase entry
    privacy/page.tsx, terms/page.tsx

  (auth)/
    login/page.tsx
    register/page.tsx

  dashboard/
    layout.tsx                     Server layout with admin metadata (noindex)
    DashboardShell.tsx             Client shell: top nav, sidebar, mobile menu
    admin/…                        Clubs, museums, events, articles, giveaways,
                                   resellers, reports, overview (Recent Passes)
    admin/_actions.ts              All admin server actions (every function
                                   gated by requireAdmin()). Includes refund
                                   (refundPass, refundTicket), undo
                                   (undoPassScan, undoTicketValidation), plus
                                   CRUD and report-send actions.
    admin/passes/[id]/page.tsx     Per-pass detail + scan history + refund
    admin/_components/             PassGroup, TicketActions, ToggleSalesButton,
                                   GuestPassButton, TestPassButton,
                                   UndoScanButton, RefundButton,
                                   GiveawayFormEditor, etc.
    club/page.tsx                  Club dashboard, filtered by magic-link clubId
    accounting/page.tsx            Finance breakdown (pass + ticket + payouts)
    reseller/page.tsx              Reseller sales + commission
    passes/page.tsx                Top-level searchable pass list
    tickets/page.tsx               Top-level searchable ticket list
    users/page.tsx                 Top-level searchable user list
    users/UserRow.tsx              Expandable row with purchase history

  pass/[id]/page.tsx               Customer pass view (public link)
  ticket/[id]/page.tsx             Customer ticket view (public link)
  passes/manage/[paymentId]/       Multi-pass assignment flow

  giveaway/[slug]/                 Public multilingual giveaway form
  events-links/page.tsx            Internal list of active event sale URLs

  api/
    auth/route.ts                  Login / register / logout (rate limited)
    webhooks/stripe/route.ts       Signed webhook → pass/ticket creation
    checkout/route.ts              Pass checkout
    checkout/ticket/route.ts       Ticket checkout
    checkout/test-pass/route.ts    €0.50 test checkout (admin)
    scan/route.ts                  Pass swipe (same-origin + rate limit)
    tickets/validate/route.ts      Ticket swipe (same-origin + rate limit)
    magic-link/route.ts            Mint club/reseller magic links (admin)
    reports/clubs/route.ts         Quarterly club report (admin)
    reports/resellers/route.ts     Half-yearly reseller report (admin)
    reports/send-club/route.ts     Email club report (admin)
    reports/send-reseller/route.ts Email reseller report (admin)
    ai/route.ts                    OpenAI article generation (admin)
    ai/translate/route.ts          OpenAI giveaway translation (admin)
    cron/route.ts                  Pass expiry cron (CRON_SECRET)
    upload/route.ts                Image upload to Railway volume (admin)
    passes/route.ts                Pass listing
    passes/assign/route.ts         Pass reassignment (paymentId ownership)
    tickets/route.ts               Ticket listing
    clubs/route.ts, museums/route.ts, offers/route.ts
```

## Library modules

| File | Purpose |
|---|---|
| `src/lib/db.ts` | Prisma client singleton using `PrismaPg` driver adapter |
| `src/lib/auth.ts` | `hashPassword`, `verifyPassword`, `generateToken`, `verifyToken`, `generateMagicLinkToken` |
| `src/lib/session.ts` | `getCurrentUser`, **`requireAdmin`** (throws on non-admin), **`isAdminRequest`** (boolean for API routes) |
| `src/lib/stripe.ts` | Lazy Stripe client init |
| `src/lib/email.ts` | Resend client, `sendPassEmail`, `sendTicketEmail` with `isGuest` option |
| `src/lib/tz.ts` | Europe/Brussels helpers (`parseBrusselsDatetimeLocal`, `formatBrusselsDate`, `getVisibilityCutoff`) |
| `src/lib/scanGuard.ts` | `checkSameOrigin` + `rateLimit` wrapper for scan endpoints |
| `src/lib/rateLimiter.ts` | Shared sliding-window rate limiter with `getClientIp` helper |

## Middleware

`src/middleware.ts` does three things:

1. **Auth on `/dashboard/*`** — reads the `volume_token` JWT cookie, redirects to `/login` if missing/invalid. Magic link mode (`?token=...`) bypasses the JWT requirement but is restricted to `/dashboard/club` and `/dashboard/reseller`.
2. **`x-user-id` / `x-user-role` header injection** for authenticated requests.
3. **`X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`** for every private route: `/dashboard/*`, `/pass/*`, `/ticket/*`, `/giveaway/*`, `/events-links`, `/checkout/*`, `/login`, `/register`. Applied to normal responses, redirects, and JSON 401s.

Matcher list is explicit — public routes (home, offer, news, agenda, tickets listing) are NOT in the matcher, so they never get the noindex header and remain fully crawlable.

Baseline security headers on every route come from `next.config.ts` (`headers()` hook): `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.

## Data flow: purchase → pass/ticket in customer's inbox

```
Customer clicks Buy Ticket
  → POST /api/checkout or /api/checkout/ticket
  → Stripe Checkout Session created with server-side hardcoded Price IDs
  → Customer redirected to Stripe
  → Customer pays
  → Stripe POST /api/webhooks/stripe (checkout.session.completed)
      - signature verified via STRIPE_WEBHOOK_SECRET
      - handler dispatches on session.metadata.type
      - creates Pass rows (one per quantity) or a Ticket row
      - calls sendPassEmail / sendTicketEmail (Resend)
  → Customer gets email with a link to /pass/[id] or /ticket/[id]
  → Customer shows the link at the door
  → Staff swipes on the customer's phone
  → Same-origin fetch to /api/scan or /api/tickets/validate
  → scanGuard enforces origin + rate limit
  → Pass row gets a PassScan, Ticket row gets validatedAt = now()
```

## Data flow: giveaway claim

```
Admin creates a GiveawayForm at /dashboard/admin/giveaways/new
  → requireAdmin() check
  → db.giveawayForm.create({ slug, passType, en/fr/nl copy })

Visitor opens /giveaway/[slug]
  → Server fetches the form, 404 if inactive
  → Client picks a language (EN/FR/NL), fills name + email
  → React server action submitGiveawayForm(slug, { name, email })
      - Finds/creates user by email (normalized)
      - Rejects if a Pass already exists with same (userId, formId)  ← one-per-user-per-form rule
      - Creates Pass { price: 0, formId, stripePaymentId: "giveaway_<slug>_<ts>" }
      - Sends the pass email via sendPassEmail({ isGuest: true })
  → Client shows localized success message with optional link/image formatting
```

## Data flow: club quarterly report

```
Admin opens /dashboard/admin/reports
  → requireAdmin() via middleware + admin server page
  → For each club, user clicks "Send" for a given quarter
  → server action sendClubReport(clubId, quarter, year)
      - counts passScans for clubId in [startDate, endDate]
      - counts validated tickets for event.clubId in that period
      - sums pricePaid of those tickets
      - revenue = visits * payPerVisit + sum(pricePaid)
      - Resend email to Club.contactEmail with a breakdown
```

## Deployment

Railway auto-deploys `main` on every push. Build runs `prisma generate && next build`, DB connection string comes from `DATABASE_URL` (public URL at build time, internal URL at runtime). Uploads live on a Railway volume mounted at `/data/uploads/`, served via the `/uploads/[filename]` route handler. There are currently two Railway projects tied to this repo — only one serves `volumebrussels.com` custom domain; the other is an orphan awaiting cleanup.

## Key invariants

- **Link = credential.** `/pass/[id]`, `/ticket/[id]`, `/dashboard/club?token=`, `/dashboard/reseller?token=` are all valid forever until overwritten. No TTL on any of them. Matches the e-ticket model and the real-world "customer hands phone to staff" flow.
- **Admin mutations = server action + `requireAdmin()`**. Never trust the middleware alone for write paths.
- **`stripePaymentId` is the pass-source marker.** Parse the prefix to distinguish `guest_`, `giveaway_<slug>_`, `legacy_migration_`, or a real Stripe `pi_`.
- **Brussels time everywhere.** Always go through `src/lib/tz.ts` for parsing and formatting user-visible dates.
- **Never seed or bulk-update production.** See the DB Data Protection block in `CLAUDE.md`.
- **Public pages never inherit `noindex`.** Middleware matcher is the source of truth for the public/private split.
