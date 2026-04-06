# Business Logic Specification

## Pass System

### Pass Types
| Type | Duration | Price | Includes |
|------|----------|-------|----------|
| Night Pass | 24 hours from activation | 29 EUR | Club entry on included nights |
| Weekend Pass | 48 hours from activation | 48 EUR | Club entry on included nights + museum vouchers |

### Pass Lifecycle
1. **Purchased** — User pays via Stripe. Pass created with status `purchased`.
2. **Active** — First scan at any club sets `activatedAt = now()` and `expiresAt = activatedAt + duration`. Status becomes `active`.
3. **Expired** — After `expiresAt`. Status becomes `expired`. Checked on every scan attempt.
4. **Refunded** — Manual refund by admin. Status becomes `refunded`.

### Pass Validation Rules
- A pass can only be scanned at clubs where `passInclusion` matches the current day
- Each club can only be scanned ONCE per pass (no re-entry with same pass)
- Museum vouchers are separate from club scans and valid for 7 days after activation
- Pass cannot be transferred between users

### Check-in Flow (Swipe)
1. User opens `/pass/[id]` on their phone
2. Staff sees the pass details (type, status, remaining time, scanned venues)
3. Staff swipes right on the screen to validate entry
4. System creates a `PassScan` record
5. If this is the first scan, pass activates

## Ticket System

### Ticket Pricing
- Each event has up to 3 pricing phases
- Only one phase is active at a time (determined by date range)
- Current price shown to user is from the active phase

### Reseller Links
- Resellers get a unique link: `/buy/[eventId]?ref=[resellerId]`
- When a ticket is purchased through a reseller link, `resellerId` is set
- Commission: 8% of ticket price (configurable per reseller)

### Ticket Validation
1. User opens `/ticket/[id]` on their phone
2. Staff swipes to validate
3. `validatedAt` is set, status becomes `used`
4. Ticket cannot be used again

## Financial Model

### Revenue per Pass Scan
- Each club has a `payPerVisit` rate (default 10 EUR)
- Each museum has a `payPerVisit` rate (default 8 EUR)
- Platform revenue = pass price - sum of payPerVisit for all scans

### Reseller Commission
- Default 8% of the sale price
- Tracked per pass and per ticket
- Visible in reseller dashboard

### Accounting
- Total pass sales
- Total ticket sales
- Total redistribution to clubs (sum of payPerVisit * scans)
- Total reseller commissions
- Net platform revenue

## Magic Link Access

### Club Dashboard
- Admin generates a magic link for each club account
- Link format: `/dashboard/club?token=[magicLinkToken]`
- Token stored in `ClubAccount.magicLinkToken`
- No password required — token-based access only

### Reseller Dashboard
- Same pattern: `/dashboard/reseller?token=[magicLinkToken]`
- Token stored in `Reseller.magicLinkToken`

## Museum Vouchers
- Only available with Weekend Pass
- Accessible for 7 days after pass activation (independent of 48h pass expiry)
- Each museum can be visited once per pass
- Tracked via `PassScan` with `museumId` set
