import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAfterTicketWindow } from "@/lib/eventWindow";

// Cron endpoint — called periodically (hourly is fine) to:
//   1. Expire active passes whose expiresAt has passed
//   2. Expire unused tickets whose swipe window has closed
// Protected with CRON_SECRET.

export async function GET(req: NextRequest) {
  // Always require CRON_SECRET. Refuse the request if the env var is not
  // configured — fail closed instead of the previous inverted check which
  // would silently skip auth when CRON_SECRET was unset.
  const expected = process.env.CRON_SECRET;
  const provided = req.nextUrl.searchParams.get("secret");
  if (!expected || !provided || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const expiredPasses = await db.pass.updateMany({
    where: {
      status: "active",
      expiresAt: { lt: now },
    },
    data: { status: "expired" },
  });

  // Expire tickets that have passed their swipe window without being
  // used. We can't do this with a pure SQL date comparison because the
  // window edges come from the Brussels-timezone night-pass rules
  // (Fri 18:00 → Sat 11:00 or Sat 18:00 → Mon 02:00), so we evaluate
  // it per row in JS. To keep the scan size small we only look at
  // tickets in status "purchased" whose event is at least a day old
  // — anything fresher than that can't possibly be past a window yet.
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const candidates = await db.ticket.findMany({
    where: {
      status: "purchased",
      event: { date: { lt: yesterday } },
    },
    select: {
      id: true,
      event: { select: { date: true } },
    },
  });
  const toExpire = candidates
    .filter((t) => isAfterTicketWindow(t.event.date, now))
    .map((t) => t.id);
  let expiredTickets = 0;
  if (toExpire.length > 0) {
    const updated = await db.ticket.updateMany({
      where: { id: { in: toExpire } },
      data: { status: "expired" },
    });
    expiredTickets = updated.count;
  }

  return NextResponse.json({
    expiredPasses: expiredPasses.count,
    expiredTickets,
    timestamp: now.toISOString(),
  });
}
