# Data Models Specification

All models are defined in `prisma/schema.prisma` and managed via Prisma ORM on PostgreSQL.

## User
| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| email | string | Unique |
| name | string? | Optional |
| password | string? | Nullable for magic-link-only users |
| role | enum | admin, club, reseller, customer |
| createdAt | datetime | Auto |
| updatedAt | datetime | Auto |

## Club
| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| name | string | Display name |
| slug | string | URL-safe, unique |
| address | string | Physical location |
| description | text? | Long description |
| pictures | string[] | Array of image URLs |
| instagramUrl | string? | Social link |
| facebookUrl | string? | Social link |
| payPerVisit | float | Default 10 EUR — amount paid to club per pass scan |
| openDays | DayOfWeek[] | friday, saturday, sunday |
| passInclusion | enum | friday, saturday, both, weekend |
| isActive | boolean | Soft delete / visibility toggle |

## Museum
| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| name | string | Display name |
| slug | string | URL-safe, unique |
| address | string | Physical location |
| description | text? | Long description |
| pictures | string[] | Array of image URLs |
| websiteUrl | string? | External link |
| payPerVisit | float | Default 8 EUR |
| isActive | boolean | Soft delete |

## Pass
| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| type | enum | night (24h, 29 EUR) or weekend (48h, 48 EUR) |
| price | float | Actual price paid |
| userId | ref | Owner |
| stripePaymentId | string? | Stripe payment reference |
| status | enum | purchased, active, expired, refunded |
| activatedAt | datetime? | Set on first scan |
| expiresAt | datetime? | Calculated from activatedAt + duration |
| resellerId | ref? | If sold through a reseller |

## PassScan
| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| passId | ref | Which pass |
| clubId | ref? | If scanned at a club |
| museumId | ref? | If scanned at a museum |
| scannedAt | datetime | When the scan happened |
| scannedBy | ref? | Staff user who performed the scan |

## Event
| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| name | string | Event title |
| description | text? | Event details |
| coverImage | string? | Image URL |
| clubId | ref | Host venue |
| date | datetime | Event date |
| isLinkedToPass | boolean | Whether pass holders get free entry |

## Ticket
| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| eventId | ref | Which event |
| userId | ref | Ticket holder |
| stripePaymentId | string? | Payment reference |
| status | enum | purchased, used, expired, refunded |
| pricePaid | float | Actual price at time of purchase |
| pricingPhase | enum | early_bird, regular, last_minute |
| resellerId | ref? | If sold through a reseller |
| validatedAt | datetime? | When ticket was used for entry |

## PricingPhase
| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| eventId | ref | Which event |
| name | enum | early_bird, regular, last_minute |
| price | float | Price in EUR |
| startDate | datetime | Phase start |
| endDate | datetime | Phase end |

## Reseller
| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| userId | ref | Linked user account (unique) |
| commissionRate | float | Default 0.08 (8%) |
| magicLinkToken | string? | For passwordless dashboard access |
| isActive | boolean | Active toggle |

## ClubAccount
| Field | Type | Notes |
|-------|------|-------|
| id | cuid | Primary key |
| clubId | ref | Which club |
| userId | ref | Which user has access |
| magicLinkToken | string? | For passwordless dashboard access |
