import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clubId = searchParams.get("clubId");

  const where: Record<string, unknown> = { isActive: true };
  if (clubId) where.id = clubId;

  const clubs = await db.club.findMany({
    where,
    include: {
      events: {
        where: { date: { gte: new Date() } },
        include: { pricingPhases: true },
        orderBy: { date: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(clubs);
}
