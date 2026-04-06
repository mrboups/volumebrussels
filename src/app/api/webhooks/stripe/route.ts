import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { sendPassEmail } from "@/lib/email";
import type Stripe from "stripe";
import type { PassType } from "@/generated/prisma/client";

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
  const passType = session.metadata?.passType as PassType | undefined;
  const resellerId = session.metadata?.resellerId || null;
  const customerEmail = session.customer_details?.email;

  if (!passType || !customerEmail) {
    console.error("Missing passType or customer email in checkout session", {
      sessionId: session.id,
      passType,
      customerEmail,
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

  // Create the pass
  const priceInEuros = (session.amount_total ?? 0) / 100;
  const pass = await db.pass.create({
    data: {
      type: passType,
      price: priceInEuros,
      userId: user.id,
      stripePaymentId: session.payment_intent as string | null,
      status: "purchased",
      resellerId: validResellerId,
    },
  });

  // Send confirmation email
  try {
    await sendPassEmail({
      to: customerEmail,
      passId: pass.id,
      passType,
      customerName: user.name || undefined,
    });
  } catch (emailErr) {
    console.error("Failed to send pass confirmation email:", emailErr);
    // Do not fail the webhook — the pass is created, email is best-effort
  }

  console.log("Pass created:", {
    passId: pass.id,
    type: passType,
    userId: user.id,
    price: priceInEuros,
    resellerId: validResellerId,
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

  const updatedPasses = await db.pass.updateMany({
    where: { stripePaymentId: paymentIntentId },
    data: { status: "refunded" },
  });

  console.log("Refunded passes:", {
    paymentIntentId,
    count: updatedPasses.count,
  });
}
