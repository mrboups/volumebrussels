import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/session";
import { parseTiers, resellerCommission } from "@/lib/pricing";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const half = parseInt(req.nextUrl.searchParams.get("half") || "1");
  const year = parseInt(req.nextUrl.searchParams.get("year") || String(new Date().getFullYear()));

  const startMonth = half === 1 ? 0 : 6;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 6, 1);

  const resellers = await db.reseller.findMany({
    where: { isActive: true },
    include: { user: { select: { name: true, email: true } } },
  });

  const result = await Promise.all(
    resellers.map(async (r) => {
      const passTiers = parseTiers(r.passCommissionTiers);
      const ticketTiers = parseTiers(r.ticketCommissionTiers);

      const [passes, tickets] = await Promise.all([
        db.pass.findMany({
          where: {
            resellerId: r.id,
            createdAt: { gte: startDate, lt: endDate },
            status: { not: "refunded" },
          },
          select: { price: true },
        }),
        db.ticket.findMany({
          where: {
            resellerId: r.id,
            createdAt: { gte: startDate, lt: endDate },
            status: { not: "refunded" },
          },
          select: { pricePaid: true },
        }),
      ]);

      const salesCount = passes.length + tickets.length;
      const salesAmount =
        passes.reduce((s, p) => s + p.price, 0) +
        tickets.reduce((s, t) => s + t.pricePaid, 0);
      const commission =
        passes.reduce((s, p) => s + resellerCommission(p.price, passTiers), 0) +
        tickets.reduce(
          (s, t) => s + resellerCommission(t.pricePaid, ticketTiers),
          0
        );

      return {
        resellerId: r.id,
        name: r.user.name || r.user.email,
        email: r.user.email,
        salesCount,
        salesAmount,
        commission,
      };
    })
  );

  return NextResponse.json({ resellers: result });
}
