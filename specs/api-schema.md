# API Schema Specification

Base URL: `/api` (Next.js App Router route handlers).

Every mutation on sensitive state should be routed either through:
- A **server action** in `src/app/dashboard/admin/_actions.ts`, every exported
  function of which is gated by `requireAdmin()` (the public `submitGiveawayForm`
  action is the one deliberate exception).
- A **purpose-specific API route** that enforces the correct authorization.

All API routes described below with an admin lock use `isAdminRequest()` from
`src/lib/session.ts`, which reads the `volume_token` JWT cookie and checks
`role === "admin"`. Middleware protects the `/dashboard/*` pages separately;
API routes enforce auth themselves.

Rate limiting on `/api/auth` and `/api/scan` / `/api/tickets/validate` uses the
shared in-memory sliding-window limiter at `src/lib/rateLimiter.ts`.

---

## Auth

### POST /api/auth
Single endpoint dispatched by an `action` field. **Rate limited.**

Email is always `trim().toLowerCase()` before any DB lookup or insert.

```jsonc
// register — 3 attempts per minute per IP
{ "action": "register", "email": "...", "password": "...", "name": "..." }

// login — 5 per minute per IP AND 5 per minute per email
{ "action": "login", "email": "...", "password": "..." }

// logout
{ "action": "logout" }
```

Cookie: `volume_token` (httpOnly, secure, sameSite=lax, 90-day maxAge). JWT
contains `{ userId, email, role }` signed with `NEXTAUTH_SECRET`.

---

## Passes

### POST /api/passes/assign
Reassign a multi-pass purchase's extra passes to different emails.

**Auth**: ownership check — caller must know the `paymentId` (`stripePaymentId`)
of the purchase. The pass's `stripePaymentId` must match. Returns 403 otherwise.

```jsonc
{ "passId": "...", "paymentId": "pi_...", "email": "...", "name": "..." }
```

Side effect: upserts a user, updates `pass.userId`, sends the assigned pass
email via Resend.

---

## Tickets

### POST /api/tickets/validate
Door-staff swipe endpoint. **Same-origin + rate-limited**, no auth beyond
possession of the ticket URL. Call originates from the customer's own phone.

```jsonc
{ "ticketId": "..." }
```

Side effect: sets `validatedAt = now()` and `status = "used"`. Also the
source of truth for ticket-driven club revenue.

Defenses (`src/lib/scanGuard.ts`):
- `checkSameOrigin` — rejects `Origin` / `Referer` header that is not
  `NEXT_PUBLIC_APP_URL`
- `rateLimit` — 10 POSTs per minute per (IP, ticketId)

---

## Scan (pass check-in)

### POST /api/scan
Pass swipe endpoint. Same defenses as `/api/tickets/validate`.

```jsonc
{ "passId": "...", "clubId": "..." }      // club check-in
{ "passId": "...", "museumId": "..." }    // museum voucher
```

Logic:
- Rejects refunded / expired passes
- Night pass → max 2 clubs
- Museum scan requires pass already `active`
- First club scan activates the pass and computes `expiresAt`

---

## Checkout (Stripe)

### POST /api/checkout
Creates a Stripe Checkout Session for passes at the production €29 / €48 Price
IDs. Supports `adjustable_quantity` 1..10 and optional `resellerId`.

```jsonc
{ "passType": "night"|"weekend", "resellerId": "...", "quantity": 1 }
```

### POST /api/checkout/ticket
Creates a Stripe Checkout Session for a specific event + active pricing phase.

### POST /api/checkout/test-pass
Creates a Stripe Checkout Session against the legacy €0.50 Price IDs.
**Used only by the admin "Buy Test Pass" button** on `/dashboard/admin`.
Metadata sets `testPurchase: "true"`.

---

## Stripe webhook

### POST /api/webhooks/stripe
Stripe → Volume event receiver. Signature verified with
`STRIPE_WEBHOOK_SECRET` using raw body (`constructEvent`).

Handled events:
- `checkout.session.completed` — dispatches on `session.metadata.type`:
  - default → creates passes (N-quantity, each row with the same
    `stripePaymentId`), emails each
  - `ticket` → creates a ticket, emails it

---

## Magic link

### POST /api/magic-link
**Admin only.** Mints a cryptographically random token and stores it in
`ClubAccount.magicLinkToken` or `Reseller.magicLinkToken`.

```jsonc
{ "type": "club"|"reseller", "entityId": "..." }
```

Returns:
```jsonc
{ "url": "https://volumebrussels.com/dashboard/club?token=..." }
```

Tokens **never auto-expire**. Calling the endpoint again overwrites the
existing token, which is the only way to invalidate it.

---

## Reports (admin-only)

### GET /api/reports/clubs?quarter=&year=
Per-club pass visit count and revenue for a quarter.

### GET /api/reports/resellers?half=&year=
Per-reseller sales count, amount, and commission for a half-year.

### POST /api/reports/send-club
Send a quarterly pass + ticket revenue report to `Club.contactEmail`.

```jsonc
{ "clubId": "...", "quarter": 1..4, "year": 2026 }
```

### POST /api/reports/send-reseller
Send a half-yearly reseller report.

---

## AI (admin-only)

### POST /api/ai
Generate article content via OpenAI `gpt-4o-mini` (JSON mode). Accepts
`{ title, eventContext }`, returns `{ summary, content }`. Used by the admin
article editor.

### POST /api/ai/translate
Translate giveaway form copy between English / French / Dutch.

```jsonc
{
  "sourceLang": "en"|"fr"|"nl",
  "targets": ["fr","nl"],
  "fields": { "title": "...", "description": "...", "successMessage": "..." }
}
```

Returns `{ translations: { fr: {...}, nl: {...} } }`.

Both routes are gated by `isAdminRequest()` to prevent unlimited OpenAI
billing by anonymous callers.

---

## Clubs / Museums / Offers / Articles

There are no dedicated CRUD API routes for clubs, museums, offers or articles.
All read paths use direct Prisma calls in server components (e.g. `/offer`
calls `db.club.findMany` directly) and all writes go through admin server
actions in `_actions.ts` (gated by `requireAdmin()`). The legacy
`/api/clubs`, `/api/museums`, `/api/offers`, `/api/passes`, `/api/tickets`,
`/api/passes/scan` routes were scaffolding and have been removed.

---

## Upload

### POST /api/upload
**Admin only.** Multipart `file` upload. MIME must be
`image/{jpeg,png,webp,gif}`. Max 5 MB.

File extension is derived from the validated MIME type — the user-supplied
filename is ignored — so payloads like `malware.jpg.php` are impossible.
Files land on the Railway volume mounted at `/data/uploads/*` and are served
via the `/uploads/[filename]` route.

---

## Cron

### GET /api/cron?secret=<CRON_SECRET>
Expires active passes whose `expiresAt < now`. Requires the `CRON_SECRET`
env var to be set; the handler fails closed if the secret is missing or
the query param does not match. Call from Railway's scheduled job runner.

---

## Giveaway submission (public, not admin)

### (server action) `submitGiveawayForm(slug, { name, email })`
Not an API route — called directly from `/giveaway/[slug]` via a React Server
Action. Creates a free pass bound to the form and emails it.

Errors are returned as codes (`not_found`, `inactive`, `missing_name`,
`invalid_email`, `already_claimed`, `email_failed`, `generic`) so the client
page can render a localized message in the active language.

---

## Export

### GET /api/export/accounting?period=...&from=...&to=...
Admin-only. Returns `text/csv` dump of every pass/ticket sale and refund
in the period, with columns for amount, reseller + commission, club
fee, Stripe fee, payment ID. See `specs/business-logic.md → CSV export`
for the period filter spec.

### GET /api/export/reseller?period=...&resellerId=...&token=...
Admin OR the reseller themselves (via magic-link `token=`). Global
when called without `resellerId`, scoped when set. Returns per-reseller
pass + ticket sales with commission.

---

## Authorization summary

| Route | Guard |
|---|---|
| `/api/auth` | Public + rate limit (3 register/min/IP, 5 login/min/IP + 5/min/email) |
| `/api/passes/assign` | Ownership via `paymentId` |
| `/api/scan`, `/api/tickets/validate` | `checkSameOrigin` + per-IP rate limit (link is the credential) |
| `/api/checkout`, `/api/checkout/ticket` | Public (creates a Stripe Checkout Session) |
| `/api/checkout/test-pass` | Admin |
| `/api/webhooks/stripe` | Stripe signature via `STRIPE_WEBHOOK_SECRET` |
| `/api/magic-link` | Admin |
| `/api/reports/*` | Admin |
| `/api/ai`, `/api/ai/translate` | Admin |
| `/api/upload` | Admin |
| `/api/cron` | `CRON_SECRET` query param |
| `/api/export/accounting` | Admin |
| `/api/export/reseller` | Admin OR reseller magic-link token |
| All admin server actions in `_actions.ts` | `requireAdmin()` |

The middleware (`src/middleware.ts`) also injects `x-user-id` / `x-user-role`
headers on authenticated `/dashboard/*` page requests and applies `X-Robots-Tag:
noindex, nofollow, noarchive, nosnippet` to all private routes.
