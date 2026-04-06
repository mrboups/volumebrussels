import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const userId = searchParams.get("userId");

  const where: Record<string, string> = {};
  if (eventId) where.eventId = eventId;
  if (userId) where.userId = userId;

  const tickets = await db.ticket.findMany({
    where,
    include: { event: { include: { club: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const ticket = await db.ticket.create({
    data: {
      eventId: body.eventId,
      userId: body.userId,
      stripePaymentId: body.stripePaymentId,
      pricePaid: body.pricePaid,
      pricingPhase: body.pricingPhase,
      resellerId: body.resellerId,
    },
  });

  return NextResponse.json(ticket, { status: 201 });
}
