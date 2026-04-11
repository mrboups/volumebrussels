import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkSameOrigin, rateLimit } from "@/lib/scanGuard";
import {
  computeTicketSwipeWindow,
  formatWindowForHuman,
} from "@/lib/eventWindow";

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

    // Swipe-window check. Outside the window the ticket cannot be
    // validated. If the close time has already passed, also flip the
    // ticket's status to "expired" so future loads of the ticket page
    // show the correct state without waiting for the cron sweep.
    const window = computeTicketSwipeWindow(ticket.event.date);
    if (now > window.closes) {
      await db.ticket.update({
        where: { id: ticketId },
        data: { status: "expired" },
      });
      const { closes } = formatWindowForHuman(window);
      return NextResponse.json(
        {
          error: `Ticket window closed at ${closes}. Ticket marked as expired.`,
        },
        { status: 400 }
      );
    }
    if (now < window.opens) {
      const { opens } = formatWindowForHuman(window);
      return NextResponse.json(
        { error: `Ticket check-in opens at ${opens}` },
        { status: 400 }
      );
    }

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
