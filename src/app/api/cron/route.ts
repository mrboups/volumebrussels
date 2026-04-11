import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Cron endpoint to expire active passes that have passed their expiresAt
// Call this periodically (e.g., every hour) via Railway cron or external service
// Protect with a secret: GET /api/cron?secret=xxx

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

  const expired = await db.pass.updateMany({
    where: {
      status: "active",
      expiresAt: { lt: now },
    },
    data: { status: "expired" },
  });

  return NextResponse.json({
    expired: expired.count,
    timestamp: now.toISOString(),
  });
}
