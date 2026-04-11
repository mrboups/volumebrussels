import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { sendPassEmail, sendTicketEmail } from "@/lib/email";
import type Stripe from "stripe";
import type { PassType, PricingPhaseName } from "@/generated/prisma/client";

/**
 * Resolve the Stripe fee in euros for a checkout session by expanding
 * the payment intent → latest charge → balance transaction. Returns
 * null if anything is missing (no charge yet, no balance transaction
 * yet, etc.) so the caller can store null and we can read the fee
 * later if needed.
 */
async function fetchStripeFeeForPaymentIntent(
  paymentIntentId: string
): Promise<number | null> {
  if (!paymentIntentId) return null;
  try {
    const stripe = getStripe();
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge.balance_transaction"],
    });
    const charge = pi.latest_charge;
    if (!charge || typeof charge === "string") return null;
    const bt = charge.balance_transaction;
    if (!bt || typeof bt === "string") return null;
    // bt.fee is in the smallest currency unit (cents)
    return bt.fee / 100;
  } catch (err) {
    console.error("Failed to fetch Stripe fee:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      await handleChargeRefunded(charge);
      break;
    }
    default:
      console.log("Unhandled event type:", event.type);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_details?.email;

  if (!customerEmail) {
    console.error("Missing customer email in checkout session", {
      sessionId: session.id,
    });
    return;
  }

  // Handle ticket purchases
  if (session.metadata?.type === "ticket") {
    await handleTicketCheckout(session, customerEmail);
    return;
  }

  const passType = session.metadata?.passType as PassType | undefined;
  const resellerId = session.metadata?.resellerId || null;

  if (!passType) {
    console.error("Missing passType in checkout session", {
      sessionId: session.id,
      passType,
    });
    return;
  }

  // Find or create user by email
  let user = await db.user.findUnique({ where: { email: customerEmail } });

  if (!user) {
    user = await db.user.create({
      data: {
        email: customerEmail,
        name: session.customer_details?.name || null,
        role: "customer",
      },
    });
  }

  // Verify the reseller exists if provided
  let validResellerId: string | null = null;
  if (resellerId) {
    const reseller = await db.reseller.findUnique({
      where: { id: resellerId, isActive: true },
    });
    if (reseller) {
      validResellerId = reseller.id;
    }
  }

  // Get actual quantity from Stripe line items (user may have adjusted on checkout page)
  const stripe = getStripe();
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
  const actualQuantity = lineItems.data[0]?.quantity ?? 1;
  const quantity = Math.max(1, Math.min(10, actualQuantity));
  const totalPriceInEuros = (session.amount_total ?? 0) / 100;
  const pricePerPass = totalPriceInEuros / quantity;
  const stripePaymentId = session.payment_intent as string | null;

  // Fetch the Stripe fee from the balance transaction. One PaymentIntent
  // = one total fee (Stripe charges once per charge, not per line item),
  // so we split it proportionally across the passes in this purchase.
  const totalStripeFee = stripePaymentId
    ? await fetchStripeFeeForPaymentIntent(stripePaymentId)
    : null;
  const stripeFeePerPass =
    totalStripeFee !== null ? totalStripeFee / quantity : null;

  const createdPasses = [];
  for (let i = 0; i < quantity; i++) {
    const pass = await db.pass.create({
      data: {
        type: passType,
        price: pricePerPass,
        stripeFee: stripeFeePerPass,
        userId: user.id,
        stripePaymentId,
        status: "purchased",
        resellerId: validResellerId,
      },
    });
    createdPasses.push(pass);
  }

  // Send confirmation email only for the first pass (the buyer's)
  try {
    await sendPassEmail({
      to: customerEmail,
      passId: createdPasses[0].id,
      passType,
      customerName: user.name || undefined,
    });
  } catch (emailErr) {
    console.error("Failed to send pass confirmation email:", emailErr);
    // Do not fail the webhook — the pass is created, email is best-effort
  }

  console.log("Passes created:", {
    count: quantity,
    passIds: createdPasses.map((p) => p.id),
    type: passType,
    userId: user.id,
    pricePerPass,
    resellerId: validResellerId,
  });
}

async function handleTicketCheckout(
  session: Stripe.Checkout.Session,
  customerEmail: string
) {
  const eventId = session.metadata?.eventId;
  const pricingPhaseName = session.metadata?.pricingPhaseName as
    | PricingPhaseName
    | undefined;

  if (!eventId || !pricingPhaseName) {
    console.error("Missing ticket metadata in checkout session", {
      sessionId: session.id,
      eventId,
      pricingPhaseName,
    });
    return;
  }

  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) {
    console.error("Event not found for ticket checkout", {
      sessionId: session.id,
      eventId,
    });
    return;
  }

  // Find or create user by email
  let user = await db.user.findUnique({ where: { email: customerEmail } });
  if (!user) {
    user = await db.user.create({
      data: {
        email: customerEmail,
        name: session.customer_details?.name || null,
        role: "customer",
      },
    });
  }

  const pricePaid = (session.amount_total ?? 0) / 100;
  const stripePaymentId = session.payment_intent as string | null;
  const stripeFee = stripePaymentId
    ? await fetchStripeFeeForPaymentIntent(stripePaymentId)
    : null;

  const ticket = await db.ticket.create({
    data: {
      eventId: event.id,
      userId: user.id,
      stripePaymentId,
      stripeFee,
      status: "purchased",
      pricePaid,
      pricingPhase: pricingPhaseName,
    },
  });

  try {
    await sendTicketEmail({
      to: customerEmail,
      ticketId: ticket.id,
      eventName: event.name,
      eventDate: event.date,
      venueName: event.venueName || undefined,
      price: pricePaid,
      customerName: user.name || undefined,
    });
  } catch (emailErr) {
    console.error("Failed to send ticket confirmation email:", emailErr);
  }

  console.log("Ticket created:", {
    ticketId: ticket.id,
    eventId: event.id,
    userId: user.id,
    pricePaid,
    pricingPhase: pricingPhaseName,
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) {
    console.error("No payment_intent on refunded charge:", charge.id);
    return;
  }

  const now = new Date();
  const updatedPasses = await db.pass.updateMany({
    where: { stripePaymentId: paymentIntentId, status: { not: "refunded" } },
    data: { status: "refunded", refundedAt: now },
  });

  const updatedTickets = await db.ticket.updateMany({
    where: { stripePaymentId: paymentIntentId, status: { not: "refunded" } },
    data: { status: "refunded", refundedAt: now },
  });

  console.log("Refunded passes/tickets:", {
    paymentIntentId,
    passCount: updatedPasses.count,
    ticketCount: updatedTickets.count,
  });
}
