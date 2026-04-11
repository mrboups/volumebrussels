import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/session";
import { parsePeriod, formatPeriodLabel, prismaPeriodFilter } from "@/lib/period";
import { parseTiers, resellerCommission } from "@/lib/pricing";

export const dynamic = "force-dynamic";

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "number" ? String(value) : value;
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function row(...cells: (string | number | null | undefined)[]): string {
  return cells.map(csvEscape).join(",");
}

export async function GET(req: NextRequest) {
  // Admin OR a reseller looking at their own sales via magic link is
  // the honest access model. The dashboard passes its own magic-link
  // token to identify the reseller, falling back to admin for the
  // global export. Any caller without a valid admin session or a
  // recognized reseller token is rejected.
  const resellerIdParam = req.nextUrl.searchParams.get("resellerId");
  const magicToken = req.nextUrl.searchParams.get("token");

  const isAdmin = await isAdminRequest();
  let scopedResellerId: string | null = null;

  if (!isAdmin) {
    if (!magicToken) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const reseller = await db.reseller.findFirst({
      where: { magicLinkToken: magicToken, isActive: true },
    });
    if (!reseller) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    scopedResellerId = reseller.id;
  } else if (resellerIdParam) {
    scopedResellerId = resellerIdParam;
  }

  const period = parsePeriod(req.nextUrl.searchParams);
  const dateRange = prismaPeriodFilter(period);
  const createdAtFilter = dateRange ? { createdAt: dateRange } : {};

  const passWhere = {
    ...createdAtFilter,
    ...(scopedResellerId
      ? { resellerId: scopedResellerId }
      : { resellerId: { not: null } }),
  };
  const ticketWhere = {
    ...createdAtFilter,
    ...(scopedResellerId
      ? { resellerId: scopedResellerId }
      : { resellerId: { not: null } }),
  };

  const [passes, tickets] = await Promise.all([
    db.pass.findMany({
      where: passWhere,
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { email: true } },
        reseller: {
          select: {
            passCommissionTiers: true,
            user: { select: { email: true, name: true } },
          },
        },
      },
    }),
    db.ticket.findMany({
      where: ticketWhere,
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { email: true } },
        event: { select: { name: true } },
        reseller: {
          select: {
            ticketCommissionTiers: true,
            user: { select: { email: true, name: true } },
          },
        },
      },
    }),
  ]);

  const lines: string[] = [];
  lines.push(`# Volume Brussels reseller export — period: ${formatPeriodLabel(period)}`);
  lines.push(
    row(
      "date",
      "type",
      "id",
      "item",
      "price",
      "status",
      "reseller",
      "reseller_email",
      "commission",
      "customer"
    )
  );

  for (const p of passes) {
    const fee =
      p.status === "refunded"
        ? 0
        : resellerCommission(p.price, parseTiers(p.reseller?.passCommissionTiers));
    lines.push(
      row(
        p.createdAt.toISOString(),
        "pass",
        p.id,
        `${p.type} pass`,
        p.price.toFixed(2),
        p.status,
        p.reseller?.user.name ?? "",
        p.reseller?.user.email ?? "",
        fee.toFixed(2),
        p.user.email
      )
    );
  }

  for (const t of tickets) {
    const fee =
      t.status === "refunded"
        ? 0
        : resellerCommission(t.pricePaid, parseTiers(t.reseller?.ticketCommissionTiers));
    lines.push(
      row(
        t.createdAt.toISOString(),
        "ticket",
        t.id,
        t.event.name,
        t.pricePaid.toFixed(2),
        t.status,
        t.reseller?.user.name ?? "",
        t.reseller?.user.email ?? "",
        fee.toFixed(2),
        t.user.email
      )
    );
  }

  const csv = lines.join("\n") + "\n";
  const scope = scopedResellerId ? `reseller-${scopedResellerId}` : "all-resellers";
  const filename = `volume-${scope}-${period ? period.from.toISOString().slice(0, 10) + "-" + period.to.toISOString().slice(0, 10) : "all-time"}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
