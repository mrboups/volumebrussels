import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Same pattern as /api/scan — fail-closed if SCAN_SECRET is set,
// fail-open with a loud log otherwise so we can enable without a
// production outage during a club night.
function checkScanSecret(req: NextRequest): NextResponse | null {
  const expected = process.env.SCAN_SECRET;
  if (!expected) {
    console.warn(
      "[security] SCAN_SECRET is not set — /api/tickets/validate is currently unauthenticated. Set SCAN_SECRET to enforce."
    );
    return null;
  }
  const provided = req.headers.get("x-scan-secret");
  if (!provided || provided !== expected) {
    return NextResponse.json(
      { error: "Scanner not authorized" },
      { status: 401 }
    );
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const authError = checkScanSecret(req);
    if (authError) return authError;

    const body = await req.json();
    const { ticketId } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
    }

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
