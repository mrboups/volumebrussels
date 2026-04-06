import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { eventId, pricingPhaseId } = body as {
    eventId: string;
    pricingPhaseId?: string;
  };

  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: { pricingPhases: true },
  });

  if (!event || !event.isActive) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Find the active pricing phase
  let phase;
  const now = new Date();

  if (pricingPhaseId) {
    phase = event.pricingPhases.find((p) => p.id === pricingPhaseId);
  }

  if (!phase) {
    // Fall back to currently active phase
    phase = event.pricingPhases.find(
      (p) => new Date(p.startDate) <= now && new Date(p.endDate) >= now
    );
  }

  if (!phase) {
    return NextResponse.json(
      { error: "No active pricing phase for this event" },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: event.name,
            description: event.description || `Ticket for ${event.name}`,
          },
          unit_amount: Math.round(phase.price * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "ticket",
      eventId: event.id,
      pricingPhaseId: phase.id,
      pricingPhaseName: phase.name,
    },
    locale: "auto",
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/tickets/${event.slug}`,
  });

  return NextResponse.json({ url: session.url });
}
