# Business Logic Specification

## Passes

### Two pass types

| Type | Price (Stripe live IDs) | Duration | Club access |
|---|---|---|---|
| Night Pass | €29 — `price_1TKjllHKSMaEcP9CWKKbGyj3` | 24h from first club scan | Up to 2 clubs |
| Weekend Pass | €48 — `price_1TKjllHKSMaEcP9CqWNnAW5Y` | Friday night through Sunday | Unlimited clubs |

Legacy €0.50 test prices (`price_1TJNTOHKSMaEcP9CbjAE7NIi` night, `price_1TJNTOHKSMaEcP9CEbGlmYtK` weekend) remain active on Stripe and are used exclusively by the admin **Buy Test Pass** button at `/api/checkout/test-pass`.

### Pass lifecycle

1. **`purchased`** — Stripe webhook (`checkout.session.completed`) creates the row after a successful payment. Pass is valid forever in this state.
2. **`active`** — First club scan sets `activatedAt = now()` and computes `expiresAt` via `computeExpiresAt(type, now)` in `/api/scan/route.ts`. Rules:
   - Night pass used Friday → expires Saturday at 18:00 Brussels
   - Night pass used Saturday → expires Sunday at 00:00
   - Weekend pass → expires Sunday at 23:59 regardless of first-scan day
3. **`expired`** — Set by `/api/cron` (runs periodically) or inline on a scan attempt when `expiresAt < now`. Museum vouchers survive for 1 week after `activatedAt`.
4. **`refunded`** — Manual admin action; scans reject.

### Club / museum scan rules

- Each club can be scanned at most once per pass
- Night pass can scan **at most 2 clubs**; 3rd attempt returns an error
- Museum scans never activate the pass — the pass must already be `active` to redeem a museum
- Museum scans are valid for 7 days from `activatedAt`, independent of the 24h/48h club window
- A refunded or expired pass rejects all scans

### Check-in model (swipe on customer's phone)

**There is no staff scanner device.** Door staff swipe on the customer's own phone.

1. Customer opens `/pass/[id]` or `/ticket/[id]` on their own phone (from the purchase email)
2. Customer physically hands the phone to door staff
3. Staff swipes the slider → customer's browser POSTs to `/api/scan` or `/api/tickets/validate` (same-origin fetch)
4. Server records `PassScan` or sets `Ticket.validatedAt = now()` + `status = used`

The only defense on the scan endpoints is `src/lib/scanGuard.ts` (same-origin + per-IP rate limit). Any future proposal for a separate staff credential must be rejected — the customer phone IS the device.

### Pass sources (identifiable via `stripePaymentId` prefix)

| Prefix | Source | Price | Example |
|---|---|---|---|
| `pi_...` | Stripe paid checkout | €29 / €48 / €0.50 (test) | `pi_3TKgbmHKSMaEcP9C15PgVm1K` |
| `guest_<ts>` | Admin "Add Guest Pass" button | 0.0 | `guest_1775840663275` |
| `giveaway_<slug>_<ts>` | Public giveaway form claim | 0.0 | `giveaway_win-free-weekend_1775840663275` |
| `legacy_migration_<ts>_<n>` | One-off migration imports | 0.0 or set manually | `legacy_migration_1775840663275_0` |

The admin **Recent Passes** table parses these prefixes and shows `guest` (amber) or `giveaway: <slug>` (pink) badges next to the pass type.

## Tickets (event tickets, not passes)

### Pricing phases

Each event has up to 3 phases: `early_bird`, `regular`, `last_minute`. Active phase is the one whose `[startDate, endDate]` contains `now`. Event form auto-chains phase endings: if phase N+1 starts before phase N ends, phase N is truncated. Default last-phase endDate is the event date at 23:59 Brussels.

`Event.salesEnded = true` halts new sales while keeping the event visible on `/tickets`.

### Ticket lifecycle

1. **`purchased`** — Stripe webhook creates the ticket after payment
2. **`used`** — Door staff swipes on the customer's phone → `validatedAt = now()` + status = `used`
3. **`expired`** / **`refunded`** — Manual or background state

### Club payout from tickets

When a ticket is validated, its full `pricePaid` counts toward the host club's revenue. Unvalidated tickets do NOT pay the club — the money stays with Volume. This is enforced in:

- `/dashboard/club` — ticket stats, "Recent Ticket Check-ins" section, quarterly reports with ticket columns
- `/dashboard/admin/_actions.ts → sendClubReport` — email includes a Validated Tickets + Ticket Revenue block
- `/dashboard/accounting` — splits `Pass Revenue` + `Ticket Revenue`, club payouts include validated ticket totals

### Pass revenue for clubs

`visits × payPerVisit` where `visits = count(PassScan where clubId = this club)`. Completely price-agnostic, so a free guest / giveaway pass pays the club exactly the same as a €29 paid pass when it is used at the door.

## Giveaway forms

Admin creates a `GiveawayForm` at `/dashboard/admin/giveaways/new` with:

- Slug + pass type (`night` or `weekend`)
- Title / description / success message in English (required), French and Dutch (optional)
- A **"Translate with AI"** button calls `/api/ai/translate` (OpenAI `gpt-4o-mini`, JSON mode) and fills the other two languages from the currently-edited one
- Active toggle

Public link: `/giveaway/[slug]`. The form is `noindex`, language switcher only shows languages that have content, falls back to English if empty.

Submission flow (`submitGiveawayForm` server action):

1. Validate email + name
2. **One-per-user-per-form rule** — if a `Pass` exists with the same `userId` + `formId`, return localized `already_claimed` error. Different forms are still allowed for the same user.
3. Upsert user by email (trim + lowercase)
4. Create `Pass` with `price = 0`, `formId = form.id`, `stripePaymentId = giveaway_<slug>_<ts>`
5. Send the pass email (Resend) with `isGuest: true` subject/intro
6. Return localized `success` with the form's `successMessage` or a default EN/FR/NL fallback

The description and success message render through `RichText` in `GiveawayClient.tsx`:
- A line containing only a URL → image (`<img>`)
- Any inline URL → clickable link (http/https/www supported)
- URL normalization prepends `https://` to `www.` links automatically

## Guest passes (admin one-off)

Admin clicks **"Add Guest Pass"** on the dashboard, picks a pass type + email, and the system creates a free pass with `stripePaymentId = "guest_<ts>"` and sends the pass email. Used for comps and friends-of-venue. Counts as a real pass everywhere including club payout.

## Archive rule for past events

Events on `/tickets` and `/tickets/[slug]` stay visible for **2 hours after the day after the event date** (Brussels). Past that, they move into a muted "Past Events" archive section below the upcoming grid, with `opacity-70 + grayscale` styling. Helper: `getVisibilityCutoff()` in `src/lib/tz.ts`.

## Club dashboard filtering

Pages under `/dashboard/club` detect a magic link (`?token=...`) in the URL; if present, all queries are scoped to that club only (clubId from the matched `ClubAccount`). No token → full multi-club view. The middleware blocks magic-link tokens on any path outside `/dashboard/club` and `/dashboard/reseller`.

## Reseller referrals

Reseller link format: `/buy-ticket?ref=[resellerId]`. The `resellerId` is attached to the Stripe session metadata and the created `Pass`/`Ticket`. Commission: `commissionRate * price` (default 8%). Half-year reports (`sendResellerReport`) email a breakdown to the reseller contact.

## Financial model summary

```
Total Revenue
  = Pass revenue (sum of Pass.price where paid)
  + Ticket revenue (sum of Ticket.pricePaid)

Club payouts
  = Σ (passScans per club × club.payPerVisit)
  + Σ (pricePaid of validated tickets where event.clubId = this club)

Museum payouts
  = Σ (passScans per museum × museum.payPerVisit)

Reseller commissions
  = Σ (pass/ticket price × reseller.commissionRate)

Platform revenue
  = Total Revenue − Club payouts − Museum payouts − Reseller commissions
```

Unvalidated tickets contribute to Total Revenue but NOT to Club payouts, so they increase Platform Revenue.

## Emails (Resend)

| Template | Trigger | Recipient |
|---|---|---|
| `sendPassEmail` | Stripe webhook after pass purchase, admin guest pass, giveaway claim | Pass owner — different subject/intro when `isGuest: true` |
| `sendTicketEmail` | Stripe webhook after ticket purchase | Ticket owner |
| `sendClubReport` | Admin dashboard Send button | `Club.contactEmail` — quarterly with pass + ticket revenue breakdown |
| `sendResellerReport` | Admin dashboard Send button | Reseller user email — half-yearly |

All times in emails formatted via `date-fns-tz` in `Europe/Brussels`.

## Magic-link lifecycle (important rule)

Magic-link tokens and the `/pass/[id]` / `/ticket/[id]` URLs **never auto-expire**. They are valid until manually regenerated by an admin (for club and reseller dashboards) or replaced by a new purchase (for passes/tickets). The system deliberately does not attach any TTL to these tokens so legitimate users can share links across sessions without interruption.
