# Data Models Specification

All models are defined in `prisma/schema.prisma` (Prisma 7 with PostgreSQL).
Generated client lives at `src/generated/prisma/` and is always imported via
`@/generated/prisma/client`. The runtime client is the singleton exported from
`src/lib/db.ts`, which uses the `PrismaPg` driver adapter.

Ten models, seven enums. Everything that mutates the DB should be routed
through a server action in `src/app/dashboard/admin/_actions.ts` (admin-gated
via `requireAdmin()`) or a purpose-specific API route — never a raw client
call from the browser.

## Enums

| Enum | Values |
|---|---|
| `UserRole` | `admin`, `club`, `reseller`, `customer` |
| `PassType` | `night`, `weekend` |
| `PassStatus` | `purchased`, `active`, `expired`, `refunded` |
| `TicketStatus` | `purchased`, `used`, `expired`, `refunded` |
| `PricingPhaseName` | `early_bird`, `regular`, `last_minute` |
| `DayOfWeek` | `friday`, `saturday`, `sunday` |
| `PassInclusion` | `friday`, `saturday`, `both`, `weekend` |

## User

| Field | Type | Notes |
|---|---|---|
| id | cuid | Primary key |
| email | string | Unique, always stored trimmed + lowercased |
| name | string? | Optional display name |
| password | string? | bcrypt hash (12 rounds); nullable for users created without a login (magic link, guest pass, giveaway) |
| role | UserRole | `customer` by default; `admin` grants all server-action access; `club` / `reseller` are access labels for their dashboards |
| createdAt / updatedAt | datetime | Auto |

Relations: `passes`, `tickets`, `reseller`, `clubAccounts`, `passScansDone`.

## Club

| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| name | string | Display name |
| slug | string | Unique, URL-safe |
| address | string | |
| description | text? | |
| pictures | string[] | Array of image URLs served from the Railway volume |
| instagramUrl / facebookUrl / websiteUrl | string? | Social / official links |
| payPerVisit | float | Default 10 EUR — payout per validated visit; most clubs are configured at 20 EUR |
| openDays | DayOfWeek[] | Which days the club is open |
| passInclusion | PassInclusion | Whether night/weekend passes include this club on which day |
| musicTags | string[] | e.g. `HIP-HOP`, `TECHNO`, `HOUSE` |
| dresscodeTags | string[] | e.g. `SMART`, `CLUB` |
| openTime / closeTime | string? | 24h strings like `"22"` and `"4"`, rendered as `10pm - 4am` |
| contactEmail | string? | Where quarterly reports are sent |
| sortOrder | int | Manual ordering on /offer and club list pages |
| isActive | boolean | Soft visibility toggle |
| createdAt / updatedAt | datetime | |

Relations: `events`, `passScans`, `clubAccounts`.

## Museum

| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| name / slug | string | slug unique |
| address / description | text | |
| pictures | string[] | |
| websiteUrl | string? | |
| payPerVisit | float | Default 8 EUR |
| openDays | string[] | Free-form |
| openTime / closeTime | string? | |
| sortOrder | int | |
| isActive | boolean | |
| createdAt / updatedAt | datetime | |

Relations: `passScans`.

## Pass

| Field | Type | Notes |
|---|---|---|
| id | cuid | The public-facing pass URL is `/pass/[id]` — the link is the credential |
| type | PassType | |
| price | float | Actual price paid; **0.0** for guest passes and giveaway claims |
| stripeFee | float? | Fee Stripe charged for this specific pass (in €, not cents). Pulled from `charge.balance_transaction.fee` in the Stripe webhook at purchase time. For multi-pass purchases the total fee is divided equally across the passes. Null for rows created before this field existed, guest passes, giveaway passes, and legacy imports. |
| userId | ref | Owner |
| stripePaymentId | string? | Stripe payment intent for paid purchases. Also used as a source marker: `guest_<ts>` for admin-created guest passes, `giveaway_<slug>_<ts>` for passes claimed via a GiveawayForm |
| status | PassStatus | |
| activatedAt | datetime? | Set on first club scan |
| expiresAt | datetime? | Set on first club scan using `computeExpiresAt(type, now)` |
| refundedAt | datetime? | Set when `status` flips to `refunded` — both via `refundPass` admin action and Stripe's `charge.refunded` webhook. Used for period-accurate accounting: refunds belong to the period in which they happened, not the period the sale happened in. |
| resellerId | ref? | |
| formId | ref? | Set when the pass was claimed via a `GiveawayForm`. FK preserves history even if the form is later deleted — delete detaches rather than cascades |
| createdAt / updatedAt | datetime | |

Indexes: `userId`, `resellerId`, `formId`, `status`.

## PassScan

| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| passId | ref | |
| clubId | ref? | Set for club check-ins |
| museumId | ref? | Set for museum check-ins |
| scannedAt | datetime | Default now() |
| scannedBy | ref? | Optional staff user |

Indexes: `passId`, `clubId`, `museumId`.

## Event

| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| name | string | |
| slug | string | Unique; events can have a club-specific fallback view at `/tickets/[club-slug]` |
| description | text? | |
| coverImage | string? | |
| clubId | ref? | Host venue — optional so tickets can be sold for non-club events |
| venueName / venueAddress | string? | Overrides the club's fields for one-off venues |
| date | datetime | Stored as UTC but always parsed/displayed in Europe/Brussels via `src/lib/tz.ts` |
| isLinkedToPass | boolean | If true, Weekend Pass holders enter free |
| isActive | boolean | Soft delete; events with tickets sold are always soft-deleted to preserve history |
| salesEnded | boolean | Manually halts new purchases while keeping the event visible |
| clubTicketFee | float? | Optional override for the club's per-ticket retribution. When set, overrides the default `computeClubTicketFee` formula for every validated ticket of this event. Useful for special events with a negotiated flat fee. |
| createdAt / updatedAt | datetime | |

Relations: `club`, `tickets`, `pricingPhases`.
Indexes: `clubId`, `date`.

## Ticket

| Field | Type | Notes |
|---|---|---|
| id | cuid | The public-facing ticket URL is `/ticket/[id]` — link is the credential |
| eventId | ref | |
| userId | ref | |
| stripePaymentId | string? | |
| stripeFee | float? | Stripe fee in €, same semantics as on `Pass` |
| status | TicketStatus | |
| pricePaid | float | Actual price at purchase time |
| pricingPhase | PricingPhaseName | Which phase was active at purchase |
| resellerId | ref? | |
| validatedAt | datetime? | Set when door staff swipes; triggers club ticket revenue |
| refundedAt | datetime? | Set when `status` flips to `refunded`. Same period-accounting rule as `Pass.refundedAt` |
| createdAt / updatedAt | datetime | |

Indexes: `eventId`, `userId`, `resellerId`, `status`.

## PricingPhase

| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| eventId | ref | |
| name | PricingPhaseName | |
| price | float | |
| startDate | datetime | |
| endDate | datetime | |

Event form auto-chains phases: when phase N+1 starts before phase N ends, phase N is truncated to the next start. Default last-phase endDate is the event date at 23:59 Brussels.

## Reseller

| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| userId | ref | Unique |
| passCommissionTiers | Json | Array of `{ upTo: number \| null, rate: number }` — first-match tier-based commission on passes. Default `[{ upTo: null, rate: 0.08 }]` (flat 8%). |
| ticketCommissionTiers | Json | Same shape as above — commission on tickets, independent from passes. |
| magicLinkToken | string? | Unique, cryptographically random; **never auto-expires**, only overwritten on manual regeneration |
| isActive | boolean | |

Commission is non-marginal: the whole sale price multiplies by the matched tier's rate. See `src/lib/pricing.ts → resellerCommission` for the implementation. Example: tiers `[{upTo:20,rate:0.08},{upTo:null,rate:0.04}]` → €15 ticket earns €1.20 (8%), €25 ticket earns €1.00 (4%).

Relations: `user`, `passes`, `tickets`.

## ClubAccount

| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| clubId | ref | |
| userId | ref | |
| magicLinkToken | string? | Unique, cryptographically random; **never auto-expires**, only overwritten on manual regeneration |

Indexes: `clubId`, `userId`.

## Article

| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| title | string | |
| slug | string | Unique |
| summary | text | Used for `/news` card + OG description |
| content | text | Plain text, renders with smart link/image detection |
| coverImage | string? | |
| isPublished | boolean | Drafts are hidden from `/news` |
| sortOrder | int | |
| publishedAt | datetime | Default now() |
| createdAt / updatedAt | datetime | |

## GiveawayForm

| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| slug | string | Unique, public URL is `/giveaway/[slug]` |
| passType | PassType | Which pass the form hands out |
| isActive | boolean | Toggle; inactive forms 404 publicly |
| titleEn / descriptionEn / successMessageEn | string / text? / text? | English is required |
| titleFr / descriptionFr / successMessageFr | string? / text? / text? | Optional French copy |
| titleNl / descriptionNl / successMessageNl | string? / text? / text? | Optional Dutch copy |
| createdAt / updatedAt | datetime | |

Relations: `passes` — every pass issued via this form stores `formId` so we can count claims and preserve history. Delete detaches passes (`formId = null`) rather than cascades.

Rule: one user email can only claim once per form (enforced in `submitGiveawayForm` by checking for an existing `Pass` with the same `userId` + `formId`).
