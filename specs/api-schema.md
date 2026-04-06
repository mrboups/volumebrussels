# API Schema Specification

Base URL: `/api`

## Authentication

### POST /api/auth
Register or login.

**Request body:**
```json
{
  "action": "register" | "login",
  "email": "string",
  "password": "string",
  "name": "string (register only)"
}
```

**Response:** `{ id, email, role }`

## Passes

### GET /api/passes?userId={id}
Get all passes for a user, including scan history.

### POST /api/passes
Create a new pass after Stripe payment.

**Request body:**
```json
{
  "type": "night" | "weekend",
  "price": 29 | 48,
  "userId": "string",
  "stripePaymentId": "string",
  "resellerId": "string (optional)"
}
```

## Tickets

### GET /api/tickets?eventId={id}&userId={id}
Get tickets, filterable by event or user.

### POST /api/tickets
Create a ticket after Stripe payment.

**Request body:**
```json
{
  "eventId": "string",
  "userId": "string",
  "stripePaymentId": "string",
  "pricePaid": "number",
  "pricingPhase": "early_bird" | "regular" | "last_minute",
  "resellerId": "string (optional)"
}
```

## Clubs

### GET /api/clubs
List all active clubs.

### POST /api/clubs
Create a new club (admin only).

## Museums

### GET /api/museums
List all active museums.

### POST /api/museums
Create a new museum (admin only).

## Offers

### GET /api/offers?clubId={id}
Get clubs with their upcoming events and pricing phases.

## Webhooks

### POST /api/webhooks/stripe
Stripe webhook endpoint. Handles:
- `checkout.session.completed` — Finalize pass/ticket purchase
- `payment_intent.succeeded` — Payment confirmation

Requires `STRIPE_WEBHOOK_SECRET` for signature verification.
