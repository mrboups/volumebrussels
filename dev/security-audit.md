# Security Audit Report

This document is the canonical record of the security audit performed on the
volumebrussels codebase and the remediation status of every finding. Update
it whenever a new audit runs or a finding's status changes.

Most recent audit: **2026-04-11** — automated code review covering auth,
authorization, IDOR, Stripe integration, XSS, input validation, secrets,
rate limiting and transport headers.

---

## Status summary

| Severity | Open | Fixed | Intentional / accepted |
|---|---|---|---|
| CRITICAL | 0 | 3 | 0 |
| HIGH | 0 | 4 | 1 (H2 — tokens never auto-expire, by product rule) |
| MEDIUM | 3 | 4 | 0 |
| LOW | 0 | 0 | 1 (L1 — informational) |

---

## CRITICAL

### C1 — Unauthenticated pass/ticket swipe endpoints — **FIXED**

`src/app/api/scan/route.ts`, `src/app/api/tickets/validate/route.ts`.

Any anonymous POST with a valid CUID could burn a pass or mark a ticket as
used. The original audit suggested a shared scanner secret, but the real
user flow is "staff swipes on the customer's own phone," so there is no
separate staff device. A scanner-secret approach was briefly implemented and
then reverted (see commits `5426d81` → `65fa03a`).

**Current defense** (`src/lib/scanGuard.ts`):
- `checkSameOrigin` — request `Origin` header must match
  `NEXT_PUBLIC_APP_URL`. Falls back to `Referer` host when `Origin` is
  absent. Blocks cross-site fetches and naive curl.
- `rateLimit` — 10 POSTs per minute per `(ip, passId|ticketId)`.
- The pass/ticket URL itself remains the primary credential, identical in
  model to an e-ticket QR code.

Related invariant baked into `CLAUDE.md`: **never propose a staff scanner
device / X-Scan-Secret / scan-setup flow**. If the threat model tightens
in the future, the correct lever is to restrict link sharing or add a
customer-bound confirmation, not to reintroduce staff credentials.

### C2 — Admin server actions with zero authorization — **FIXED**

`src/app/dashboard/admin/_actions.ts`.

The middleware only intercepts page requests; React Server Action invocations
go through a different Next.js internal endpoint that bypasses the middleware.
Any authenticated customer could invoke every admin mutation directly from
their browser.

**Fix**: `src/lib/session.ts` now exports `requireAdmin()`. Every exported
function in `_actions.ts` (28 total) calls `await requireAdmin()` on the first
line. The single deliberate exception is `submitGiveawayForm`, the public
giveaway claim action.

### C3 — `/api/magic-link` POST unauthenticated — **FIXED**

Anyone who guessed a `clubId` or `resellerId` could mint a new magic-link
token, which overwrites the existing token in place and grants them
dashboard access. Route now gated by `isAdminRequest()`.

---

## HIGH

### H1 — Unauthenticated reporting and email-send endpoints — **FIXED**

- `/api/reports/clubs` (GET), `/api/reports/resellers` (GET)
- `/api/reports/send-club` (POST), `/api/reports/send-reseller` (POST)

GETs leaked visit counts, revenue, and contact emails; POSTs could trigger
arbitrary emails from the Volume sending domain. All four now gated by
`isAdminRequest()`.

### H2 — Magic-link tokens never expire — **INTENTIONAL, ACCEPTED**

Magic-link tokens (`ClubAccount.magicLinkToken`, `Reseller.magicLinkToken`)
and per-pass / per-ticket CUIDs never auto-expire. This is a product rule,
not a bug:

- Pass and ticket links must stay valid forever so customers can reopen their
  email at any time.
- Club and reseller dashboard links must stay valid until an admin explicitly
  rotates them. Rotation is via the existing `/api/magic-link` POST which
  overwrites the token in place.

The acceptance is documented in `specs/business-logic.md` under
"Magic-link lifecycle". If a token leaks, the admin regenerates it and the
old one stops working. No automatic TTL will be added.

### H3 — `/api/passes/assign` allowed pass theft — **FIXED**

Required `passId` only. An attacker who guessed a CUID could reassign the
pass to their own email. Fix: now also requires `paymentId` and checks
`pass.stripePaymentId === paymentId`. The buyer has the paymentId in the
post-checkout URL and in their receipt email; an attacker does not.

Email is also `trim().toLowerCase()` normalized before the user lookup.

### H4 — `/api/cron` inverted auth check — **FIXED**

Old code: `if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET)`.
When the env var was unset the entire check was silently skipped. Rewritten
as fail-closed: request is rejected if `CRON_SECRET` is missing or the query
parameter does not match.

### H5 — `/api/upload` unauthenticated + unchecked extension — **FIXED**

Now gated by `isAdminRequest()`. File extension is derived from the validated
MIME type using a fixed mapping (`image/jpeg` → `jpg`, etc.) — the
user-supplied filename is ignored entirely, so payloads like
`malware.jpg.php` are impossible.

---

## MEDIUM

### M1 — No rate limit on auth — **FIXED**

`src/app/api/auth/route.ts` now uses `src/lib/rateLimiter.ts`:

| Action | Limit | Key |
|---|---|---|
| Register | 3/min | `register\|<ip>` |
| Login | 5/min | `login-ip\|<ip>` |
| Login | 5/min | `login-email\|<email>` |

Both login checks run before the bcrypt compare so rejected attempts do not
burn CPU. The per-email limit defends against distributed credential-stuffing
against a single account.

### M2 — 90-day JWT expiry with no revocation — **OPEN**

Tokens signed with `NEXTAUTH_SECRET` live for 90 days. There is no session
table and no logout-all-sessions path. If a token leaks, the only way to
kill it is to rotate `NEXTAUTH_SECRET`, which invalidates every active
session.

Proposed next steps (not yet implemented):
1. Add a `sessionId` claim to the JWT
2. Persist sessions in a small `Session` table with `expiresAt`, `lastUsedAt`
3. Middleware validates the `sessionId` exists and is not revoked
4. Expose a logout-all-sessions button in the account page

### M3 — Email normalization missing — **FIXED**

All DB lookups and inserts now `trim().toLowerCase()` the email first:
`/api/auth`, `/api/passes/assign`, `submitGiveawayForm`, `createGuestPass`.

### M4 — `/api/ai` and `/api/ai/translate` unauthenticated — **FIXED**

Both gated by `isAdminRequest()`. Stops anonymous callers from burning the
Volume OpenAI credit.

### M5 — `.env` potentially committed — **NOT A PROBLEM**

`git log --all -- .env` returned nothing; `.gitignore` correctly excludes
it. Confirmed clean.

### M6 — Email disclosure on `/passes/manage/[paymentId]` — **OPEN**

The page shows all buyer and assignee emails for a given Stripe payment
intent ID. `pi_...` IDs are not secret by Stripe's design (they ship in the
success URL and the customer receipt), so this is security-by-obscurity.

Practical exposure is low but not zero. The proper fix is a customer login
wall in front of the page, which is a bigger UX change deferred until there
is broader demand for customer self-service.

---

## LOW

### L1 — `x-user-id` / `x-user-role` headers injected by middleware — **INFORMATIONAL**

Middleware sets these headers on authenticated page requests. Server actions
do not actually read them (they use `requireAdmin()` → `getCurrentUser()`
directly), so nothing can be bypassed today. Kept as a note in case a future
change starts trusting those headers.

---

## Transport headers — **IMPLEMENTED**

`next.config.ts` applies these to every route:

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(self), fullscreen=(self)` |
| `Permissions-Policy-Report-Only` | `interest-cohort=()` |

Deliberately NOT setting a strict `Content-Security-Policy`. The root layout
loads Crisp, GTM, Google Analytics, Facebook Pixel, Hotjar, and Stripe.js as
inline `<script>` blocks. A strict CSP would require per-script nonces and a
refactor of `src/app/layout.tsx` to thread the nonce through `next/script`.
Setting a loose `unsafe-inline` CSP provides almost no XSS protection and
adds complexity, so neither option was taken. The other headers are the
easy wins.

Tracked as a future improvement — requires coordinated change to the layout
and the third-party script list at the same time.

---

## Environment variables referenced by security code

| Var | Used by | Behaviour if missing |
|---|---|---|
| `NEXTAUTH_SECRET` | JWT signing / verification (`src/lib/auth.ts`) | Build works but tokens cannot be verified |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature check | Webhook rejects all events |
| `STRIPE_SECRET_KEY` | Stripe API client | All checkout / price calls fail |
| `CRON_SECRET` | `/api/cron` guard | Cron endpoint refuses every request |
| `NEXT_PUBLIC_APP_URL` | `checkSameOrigin` in `scanGuard.ts` | Origin check skipped (local dev only) |
| `RESEND_API_KEY` | `sendPassEmail` / `sendTicketEmail` | Emails throw at send time |
| `OPENAI_API_KEY` | `/api/ai`, `/api/ai/translate` | Those two routes return 500 |

---

## Confirmed safe (checked and cleared)

- **Stripe webhook signature verification** — `constructEvent` is called with the raw body and `STRIPE_WEBHOOK_SECRET`; bad signatures return 400.
- **Stripe price injection** — `/api/checkout` and `/api/checkout/ticket` use a server-side hardcoded Price ID whitelist. Callers cannot supply a custom price.
- **Path traversal in `/uploads/[filename]`** — handler rejects filenames containing `..`, `/`, or `\` before joining the path.
- **`$queryRaw` / `$executeRaw`** — no occurrences in application code, only inside the generated Prisma client.
- **`NEXT_PUBLIC_*` secret exposure** — only `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_APP_URL` use the prefix; both are intentionally public.
- **Cookie flags** — `volume_token` set with `httpOnly: true`, `secure: true` in production, `sameSite: "lax"`.
- **No CORS wildcards** — no route sets `Access-Control-Allow-Origin: *`.
- **Magic-link token entropy** — 256-bit `randomBytes(32).toString("hex")`.
- **bcrypt rounds** — 12.
- **OpenAI SSRF** — both routes hit only the hardcoded `https://api.openai.com` URL; no user-supplied URLs are fetched.
- **`dangerouslySetInnerHTML`** — every usage in the codebase injects either static strings (Crisp / GTM / GA / FB Pixel / Hotjar initializer blocks) or server-sanitized JSON-LD. No user content is ever injected as raw HTML.
- **Article / giveaway rich-text rendering** — both use React text nodes through the `RichText` helper, never innerHTML.

---

## What is NOT covered here

- Penetration testing by a human professional
- Automated dependency vulnerability scanning (`npm audit` in CI)
- Log review / anomaly detection
- 2FA for admin accounts
- Data export / GDPR compliance workflow

Each of these is a follow-up item, not a current finding.
