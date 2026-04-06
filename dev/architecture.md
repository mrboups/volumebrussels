# Architecture Overview

## System Design

VOLUME Brussels is a Next.js 14+ application using the App Router pattern, deployed on Railway with PostgreSQL.

## Layers

### 1. Public Web (Server Components)
- Landing page, pricing, club/museum listings, event agenda
- Server-rendered for SEO and performance
- No authentication required

### 2. Auth Layer
- Email/password registration and login
- Magic link access for clubs and resellers (no password needed)
- Role-based access: admin, club, reseller, customer

### 3. Pass/Ticket Web Apps
- `/pass/[id]` — Shown on the user's phone, staff swipes to validate
- `/ticket/[id]` — Individual event ticket shown to staff
- These are user-facing "cards" — not dashboards

### 4. Dashboards
- **Admin**: Full CRUD on all entities, system overview
- **Club**: Read-only view of their own sales, visits, revenue (magic link access)
- **Accounting**: Financial overview — total sales, club redistribution, platform margin
- **Reseller**: Their own referral sales + 8% commission tracking (magic link access)

### 5. API Routes
- RESTful endpoints under `/api/`
- Stripe webhook handler at `/api/webhooks/stripe`
- All mutations go through API routes, not server actions (for clarity and webhook compatibility)

### 6. Database (PostgreSQL via Prisma)
- All models defined in `prisma/schema.prisma`
- Prisma Client singleton in `src/lib/db.ts`
- Migrations managed via `npx prisma migrate dev`

### 7. External Services
- **Stripe**: Payment processing (Checkout Sessions + Webhooks)
- **Resend**: Transactional emails (pass confirmation, magic links, receipts)

## Module Boundaries

| Module | Responsibility | Entry Points |
|--------|---------------|--------------|
| Public | Marketing site, SEO pages | `(public)/` routes |
| Auth | Login, register, magic links | `(auth)/` routes, `/api/auth` |
| Pass | Pass purchase, activation, validation | `/pass/[id]`, `/api/passes` |
| Ticket | Ticket purchase, validation | `/ticket/[id]`, `/api/tickets` |
| Club | Club data management | `/api/clubs`, dashboard/club |
| Museum | Museum data management | `/api/museums` |
| Offers | Aggregated club+event listings | `/api/offers` |
| Payments | Stripe integration | `/api/webhooks/stripe`, `lib/stripe.ts` |
| Email | Transactional emails | `lib/email.ts` |

## Key Business Rules

### Pass Activation
- A pass is "purchased" until first scan
- First scan sets `activatedAt` and calculates `expiresAt` (24h for night, 48h for weekend)
- Museum vouchers remain accessible for 1 week after activation

### Check-in Flow (Swipe)
- User shows `/pass/[id]` or `/ticket/[id]` on their phone
- Staff swipes on the device to confirm entry
- No QR codes — the swipe gesture triggers validation

### Ticket Pricing Phases
- Each event has up to 3 pricing phases (early_bird, regular, last_minute)
- Active phase determined by date range
- Resellers add their referral link; 8% commission tracked automatically

### Club Redistribution
- Each club has a `payPerVisit` rate (default 10 EUR)
- Each scan generates a payout record
- Accounting dashboard shows total redistribution
