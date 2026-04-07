import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const quarter = parseInt(req.nextUrl.searchParams.get("quarter") || "1");
  const year = parseInt(req.nextUrl.searchParams.get("year") || String(new Date().getFullYear()));

  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 1);

  const clubs = await db.club.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, payPerVisit: true, contactEmail: true },
  });

  const scanCounts = await db.passScan.groupBy({
    by: ["clubId"],
    where: {
      clubId: { not: null },
      scannedAt: { gte: startDate, lt: endDate },
    },
    _count: { id: true },
  });

  const result = clubs.map((club) => {
    const visits = scanCounts.find((s) => s.clubId === club.id)?._count.id ?? 0;
    return {
      clubId: club.id,
      name: club.name,
      visits,
      revenue: visits * club.payPerVisit,
      contactEmail: club.contactEmail,
    };
  });

  return NextResponse.json({ clubs: result });
}
