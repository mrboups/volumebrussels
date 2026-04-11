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
2. **`active`** — First club scan sets `activatedAt = now()` and computes `expiresAt` via `computeExpiresAt(type, now)` in `/api/scan/route.ts`. All times are computed in Brussels timezone via `date-fns-tz`, not server-local time.

   **Night pass** — detects which "night" the scan falls in:
   - **Friday night** = first scan between **Fri 12:00 Brussels and Sat 06:00 Brussels** → expires **Saturday 11:00 Brussels**
   - **Saturday night** = first scan between **Sat 12:00 Brussels and Sun 06:00 Brussels** → expires **Monday 02:00 Brussels** (allows Sunday night / Monday early-morning after-parties)
   - Any other time → 24h from scan (fallback; shouldn't happen because clubs are only open Fri / Sat / Sun night)

   **Weekend pass** — always expires **next Monday 02:00 Brussels**, regardless of first-scan day. Covers Fri night + Sat night + Sun night + Monday early-morning after-parties.

   Note: the Saturday-night window deliberately extends to Sun 06:00 so that a customer who scans at Sunday 00:00 (culturally still "Saturday night") is treated correctly. Before this fix, scanning at Sunday 00:00 set `expiresAt` to Sunday 00:00 and the pass was instantly expired.
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
2. **`used`** — Door staff swipes on the customer's phone inside the swipe window → `validatedAt = now()` + status = `used`
3. **`expired`** — Swipe window closed without the ticket being used. Set either lazily (a post-window swipe attempt auto-flips the row) or by the `/api/cron` sweep.
4. **`refunded`** — Admin action via `refundTicket`.

### Ticket swipe window

A ticket can only be validated inside a time window anchored on the event's Brussels calendar day. The rules mirror the night-pass logic so that an event "on Saturday" gets the same Saturday-night validity as a night pass would.

| Event's Brussels day | Window opens | Window closes |
|---|---|---|
| **Friday** | Fri 18:00 | Sat 11:00 |
| **Saturday** | Sat 18:00 | Mon 02:00 |
| Any other day (fallback) | Event day 18:00 | Next day 06:00 |

Implementation: `src/lib/eventWindow.ts → computeTicketSwipeWindow(eventDate)` returns `{ opens, closes }` as UTC Dates, consumed by:

- **`/api/tickets/validate`** — rejects `POST` requests before `opens` (error: "Ticket check-in opens at …") and after `closes` (error: "Ticket window closed at …. Ticket marked as expired."). In the latter case the endpoint also flips the ticket to `status = "expired"` so the ticket page reflects the state immediately.
- **`/api/cron`** — hourly sweep over `Ticket` rows with `status = "purchased"` and an event date older than 24 hours. Any row whose window has closed is bulk-updated to `expired`.

Notes:

- The window check happens after the existing `checkSameOrigin` + rate-limit defenses, so out-of-window swipes are still rate-limited and cross-origin-blocked.
- The rule uses the event's **Brussels calendar day**, not its wall-clock `event.date` time. A BLUR event stored as "11 April 2026 00:00 Brussels" is a Saturday event, so its window is Sat 18:00 → Mon 02:00. An event stored as "11 April 2026 23:00" is still Saturday in Brussels and gets the same window.
- Unvalidated expired tickets don't pay the club (only `validatedAt IS NOT NULL` rows count toward club ticket revenue), so the auto-expire flow is safe for the accounting side — it just reflects reality on the row itself.

### Club payout from tickets

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

Reseller link format: `/buy-ticket?ref=[resellerId]`. The `resellerId` is attached to the Stripe session metadata and the created `Pass` / `Ticket`.

### Commission model

Each reseller has **independent** commission tiers for passes and tickets,
stored as JSON arrays on `Reseller.passCommissionTiers` and
`Reseller.ticketCommissionTiers`. Shape:

```
[
  { upTo: number | null, rate: number },
  { upTo: number | null, rate: number },
  ...
]
```

- `upTo` is the inclusive upper bound of the tier in euros. `null` marks
  the last, open-ended tier.
- `rate` is the commission fraction, e.g. `0.08` = 8%.
- The whole sale price is multiplied by the **first** tier where
  `price <= upTo` (non-marginal).
- Default for new resellers: single flat 8% tier.

**Example** — ticket tiers `[{upTo: 20, rate: 0.08}, {upTo: null, rate: 0.04}]`:

| Ticket price | Matching tier | Commission |
|---|---|---|
| €15 | `upTo: 20` | €15 × 8% = €1.20 |
| €20 | `upTo: 20` | €20 × 8% = €1.60 |
| €25 | `upTo: null` | €25 × 4% = €1.00 |

Implementation in `src/lib/pricing.ts → resellerCommission`.

### Half-year reports

`sendResellerReport` and `/api/reports/send-reseller` email a breakdown
to the reseller contact showing **pass commission, ticket commission,
and total** separately. Refunded rows are excluded from commission
calculations.

## Club ticket retribution formula

When a ticket is validated at the door, the club earns a share of the
ticket price. The formula in `src/lib/pricing.ts → computeClubTicketFee`:

1. If `Event.clubTicketFee` is set → use that fixed value.
2. Otherwise if `pricePaid >= 14` → club earns **€10**.
3. Otherwise → club earns `max(0, pricePaid − 4)`.

**Examples** with the default formula:

| Ticket price | Club retribution |
|---|---|
| €30 | €10 |
| €20 | €10 |
| €14 | €10 |
| €10 | €6 (10 − 4) |
| €5 | €1 (5 − 4) |
| €3 | €0 (clamped) |

Admin can override the formula per event via the optional
`Club retribution per ticket` field in the event form. That fixed value
is used for every validated ticket of that event regardless of the
ticket's price.

**Accounting impact**: aggregations that used to do
`ticket.aggregate({ _sum: { pricePaid } })` no longer work for the club
payout side because the per-row amount is a formula, not a column. Every
affected surface (`/dashboard/accounting`, `/dashboard/club` current and
per-quarter views, `sendClubReport` email) now does
`findMany` + in-memory reduce through `computeClubTicketFee`.

## Accounting dashboard — period semantics

`/dashboard/accounting` supports a period filter via URL query params:

- `?period=all` (default) — all time
- `?period=ytd` — year to date
- `?period=this-quarter`, `?period=last-quarter`
- `?period=q1-2026` through `?period=q4-<year>` — specific quarter
- `?from=YYYY-MM-DD&to=YYYY-MM-DD` — custom range (inclusive of both days)

Parsing is handled by `src/lib/period.ts → parsePeriod()`.

### What "in period" means for each line item

| Line | Filter |
|---|---|
| Pass Revenue, Ticket Revenue, Total Revenue (gross) | `Pass.createdAt` / `Ticket.createdAt` in period |
| Refunds Issued | `Pass.refundedAt` / `Ticket.refundedAt` in period (NOT the sale date) |
| Club / Museum payouts from pass scans | `PassScan.scannedAt` in period |
| Club payouts from validated tickets | `Ticket.validatedAt` in period |
| Reseller commission | `Pass.createdAt` / `Ticket.createdAt` in period, skipping refunded rows |
| Stripe Fees | `Pass.createdAt` / `Ticket.createdAt` in period (the `stripeFee` column is set at the time of the sale) |

A pass sold in Q1 and refunded in Q2 therefore appears as **gross Q1 revenue** AND a **Q2 refund**. Q1's closed books show the sale; Q2's closed books show the reversal. This matches standard accounting treatment and makes period totals stable — once Q1 is past, nothing moves in Q1 because of events that happened in Q2.

### Platform Net formula

```
Platform Net =  Gross Revenue
             −  Refunds Issued
             −  Club Payouts
             −  Museum Payouts
             −  Reseller Commission
             −  Stripe Fees
```

All six components are scoped to the same period. When the period is "all time", this equals the lifetime profit.

## Stripe fees

`stripeFee` is persisted per row at the time of purchase. The webhook at
`/api/webhooks/stripe` retrieves the `PaymentIntent` and expands
`latest_charge.balance_transaction` to read `fee` (cents), then divides
by 100 to store €. For multi-pass purchases the total fee is split
equally across the created `Pass` rows.

Rows created before this field existed have `stripeFee = null`. The
accounting dashboard sums only non-null values and flags the period with
a "partial — older rows have no stored fee" caption when any null is
found in the period's sales.

Non-Stripe rows (guest passes, giveaway passes, legacy imports) also have
`stripeFee = null` — they didn't generate a Stripe charge.

## CSV export

Two admin-gated endpoints:

- `GET /api/export/accounting?period=...` — full transaction dump for the
  period: every pass sale, ticket sale, pass refund, ticket refund, with
  columns for reseller + reseller commission + club fee + Stripe fee +
  payment ID. Sale rows use `createdAt`, refund rows use `refundedAt`.
- `GET /api/export/reseller?period=...&resellerId=...` — per-reseller or
  all-resellers breakdown. Magic-link resellers can also call this with
  their `token=` instead of admin auth to download their own CSV.

Both return `text/csv` with a `Content-Disposition: attachment` header
so the browser downloads the file directly. File name includes the
period range.

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

## Refund flow

Admin-only. Two server actions in `_actions.ts`: `refundPass(passId)` and
`refundTicket(ticketId)`. Both are gated by `requireAdmin()`.

### Accounting impact — the "clubs keep the money" rule

Refunding reverses the transaction for **Volume's books** but does **not**
claw money back from clubs or museums. The venue physically provided the
service (door entry, museum admission, event access), so the retribution
stays on their ledger even if Volume later refunds the customer.

| Query / metric | Refunded row treatment |
|---|---|
| `/dashboard/accounting` Total Sales, Pass Revenue, Ticket Revenue | **Excluded** (net revenue) |
| `/dashboard/admin` Total Passes Sold, Total Revenue | **Excluded** (net revenue) |
| `/dashboard/reseller` Total Sales, Total Fees, half-year reports | **Excluded** (commission is reversed) |
| `sendResellerReport` email | **Excluded** |
| `/api/reports/resellers` | **Excluded** |
| `/dashboard/accounting` Club / Museum payouts from pass scans | **Kept** — `passScan` is the source of truth for visits; refund does not undo the visit |
| `/dashboard/accounting` Club ticket payout (validated tickets) | **Kept** — once validated, the club has earned it |
| `/dashboard/club` pass visits, ticket check-ins, ticket revenue, quarterly reports | **Kept** — clubs see their full retribution |
| `sendClubReport` email | **Kept** — clubs get paid the full amount |
| Recent Passes / Recent Tickets / search lists | **Shown** with a `refunded` status badge, not hidden |

### Worked example: pass refund with 2 club scans

```
Customer buys Weekend Pass €48, scans at C12 and Fuse (payPerVisit €20 each),
then admin refunds the pass.

Before refund:
  Pass Revenue          €48
  Club Payouts          €40   (2 × €20)
  Platform Revenue      €8

After refund:
  Pass Revenue          €0     (refunded, excluded)
  Club Payouts          €40    (scans stay, clubs keep money)
  Platform Revenue      -€40   (Volume absorbed the refund)
  Customer got back     €48    (via Stripe)
```

### Worked example: ticket refund on validated ticket

```
Customer buys a €20 ticket, validates at the club, then gets refunded.

Before refund:
  Ticket Revenue        €20
  Club ticket payout    €20   (validated)
  Platform Revenue      €0

After refund:
  Ticket Revenue        €0    (refunded, excluded)
  Club ticket payout    €20   (still validated, club keeps money)
  Platform Revenue      -€20  (Volume absorbed the refund)
```

**Branching on source:**

| `stripePaymentId` prefix | Source | Refund path |
|---|---|---|
| `pi_...` | Real Stripe payment | `stripe.refunds.create({ payment_intent, amount: price * 100 })`, then flip local status |
| `guest_...` | Admin-issued guest pass | No Stripe call — local status flip only |
| `giveaway_<slug>_...` | Public form claim | No Stripe call — local status flip only |
| `legacy_migration_...` | Imported legacy row | No Stripe call — local status flip only |
| missing / other | Unknown | No Stripe call — local status flip only |

**Rules:**

- **Stripe first, DB second.** If `stripe.refunds.create` fails, the DB is
  not touched and the action returns an error.
- **Already-refunded → refuse.** Cannot double-refund.
- **Scan / validation history is preserved.** Only `status` flips to
  `"refunded"`; the `PassScan` rows or `Ticket.validatedAt` stays intact
  as history.
- **Multi-pass purchases**: each pass's `price` is refunded independently
  against the shared `PaymentIntent`. Stripe tracks the remaining
  refundable amount, so refunding pass 1 of 3 does not affect passes 2
  and 3.
- **Customer notification**: `sendRefundEmail` is sent only for
  Stripe-backed items. Free items (guest / giveaway / legacy) flip
  status silently — the customer never paid anything and doesn't need
  a notification.
- **Active passes with scans can still be refunded.** The scans remain in
  place as audit trail but no further scans can happen (scan endpoint
  rejects refunded passes).
- Every refund emits a `[audit] refundPass ...` or `[audit] refundTicket ...`
  log line with amount and `stripePaymentId`.

## Pass detail page

Admin detail view at `/dashboard/admin/passes/[id]` shows:

- Full pass metadata: type, status badge, price, created/activated/expires
  timestamps, customer email + name, source marker (Stripe / guest /
  giveaway / legacy), sibling-pass count for multi-purchase orders, link
  to the customer-facing pass view
- **Refund button** (primary variant) in the header when not yet refunded
- **Scan history table**: every `PassScan` in reverse chronological order
  with venue name, club/museum type badge, full Brussels-formatted
  datetime and a per-row **Undo** button (reuses `UndoScanButton`)

Accessed from `PassGroup` rows (Recent Passes, `/dashboard/passes`) via
the "Details" link next to "View". Every variant of `PassGroup` (single
row, grouped header, expanded child) has the link.

## Magic-link lifecycle (important rule)

Magic-link tokens and the `/pass/[id]` / `/ticket/[id]` URLs **never auto-expire**. They are valid until manually regenerated by an admin (for club and reseller dashboards) or replaced by a new purchase (for passes/tickets). The system deliberately does not attach any TTL to these tokens so legitimate users can share links across sessions without interruption.
