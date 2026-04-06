import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Cron endpoint to expire active passes that have passed their expiresAt
// Call this periodically (e.g., every hour) via Railway cron or external service
// Protect with a secret: GET /api/cron?secret=xxx

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
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
