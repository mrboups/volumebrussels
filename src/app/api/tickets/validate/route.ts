import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkSameOrigin, rateLimit } from "@/lib/scanGuard";

export async function POST(req: NextRequest) {
  try {
    const originError = checkSameOrigin(req);
    if (originError) return originError;

    const body = await req.json();
    const { ticketId } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
    }

    const rlError = rateLimit(req, ticketId);
    if (rlError) return rlError;

    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
      include: { event: { include: { club: true } } },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.status === "used") {
      return NextResponse.json(
        { error: "Ticket has already been used" },
        { status: 400 }
      );
    }

    if (ticket.status === "expired") {
      return NextResponse.json({ error: "Ticket has expired" }, { status: 400 });
    }

    if (ticket.status === "refunded") {
      return NextResponse.json({ error: "Ticket has been refunded" }, { status: 400 });
    }

    const now = new Date();

    const updatedTicket = await db.ticket.update({
      where: { id: ticketId },
      data: {
        validatedAt: now,
        status: "used",
      },
      include: { event: { include: { club: true } } },
    });

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error) {
    console.error("Ticket validation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
