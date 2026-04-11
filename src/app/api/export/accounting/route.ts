import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdminRequest } from "@/lib/session";
import { parsePeriod, formatPeriodLabel, prismaPeriodFilter } from "@/lib/period";
import { computeClubTicketFee, parseTiers, resellerCommission } from "@/lib/pricing";

export const dynamic = "force-dynamic";

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "number" ? String(value) : value;
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(...cells: (string | number | null | undefined)[]): string {
  return cells.map(csvEscape).join(",");
}

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const period = parsePeriod(req.nextUrl.searchParams);
  const dateRange = prismaPeriodFilter(period);
  const createdAtFilter = dateRange ? { createdAt: dateRange } : {};
  const refundedAtFilter = dateRange
    ? { refundedAt: dateRange }
    : { refundedAt: { not: null } };

  const [passes, tickets, refundedPasses, refundedTickets] = await Promise.all([
    db.pass.findMany({
      where: createdAtFilter,
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { email: true } },
        reseller: {
          select: {
            passCommissionTiers: true,
            user: { select: { email: true } },
          },
        },
      },
    }),
    db.ticket.findMany({
      where: createdAtFilter,
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { email: true } },
        event: {
          select: {
            name: true,
            clubTicketFee: true,
            club: { select: { name: true } },
          },
        },
        reseller: {
          select: {
            ticketCommissionTiers: true,
            user: { select: { email: true } },
          },
        },
      },
    }),
    db.pass.findMany({
      where: { status: "refunded", ...refundedAtFilter },
      orderBy: { refundedAt: "asc" },
      include: { user: { select: { email: true } } },
    }),
    db.ticket.findMany({
      where: { status: "refunded", ...refundedAtFilter },
      orderBy: { refundedAt: "asc" },
      include: {
        user: { select: { email: true } },
        event: { select: { name: true } },
      },
    }),
  ]);

  const lines: string[] = [];
  lines.push(
    `# Volume Brussels accounting export — period: ${formatPeriodLabel(period)}`
  );
  lines.push(
    row(
      "date",
      "type",
      "id",
      "item",
      "customer",
      "status",
      "gross",
      "reseller",
      "reseller_commission",
      "club_or_museum_fee",
      "stripe_fee",
      "stripe_payment_id"
    )
  );

  for (const p of passes) {
    const commission = p.resellerId
      ? resellerCommission(p.price, parseTiers(p.reseller?.passCommissionTiers))
      : 0;
    lines.push(
      row(
        p.createdAt.toISOString(),
        "pass_sale",
        p.id,
        `${p.type} pass`,
        p.user.email,
        p.status,
        p.price.toFixed(2),
        p.reseller?.user.email ?? "",
        commission.toFixed(2),
        "", // per-pass club fee is scan-based, handled in scan rows
        p.stripeFee !== null ? p.stripeFee.toFixed(2) : "",
        p.stripePaymentId ?? ""
      )
    );
  }

  for (const t of tickets) {
    const commission = t.resellerId
      ? resellerCommission(t.pricePaid, parseTiers(t.reseller?.ticketCommissionTiers))
      : 0;
    // Ticket validation may have happened in a different period — the
    // club fee is only credited when validated. For the CSV we still
    // show the potential fee here so the admin can see it.
    const clubFee = computeClubTicketFee(t.pricePaid, t.event);
    lines.push(
      row(
        t.createdAt.toISOString(),
        "ticket_sale",
        t.id,
        `${t.event.name}${t.event.club ? " (" + t.event.club.name + ")" : ""}`,
        t.user.email,
        t.status,
        t.pricePaid.toFixed(2),
        t.reseller?.user.email ?? "",
        commission.toFixed(2),
        clubFee.toFixed(2),
        t.stripeFee !== null ? t.stripeFee.toFixed(2) : "",
        t.stripePaymentId ?? ""
      )
    );
  }

  for (const p of refundedPasses) {
    lines.push(
      row(
        (p.refundedAt ?? p.updatedAt).toISOString(),
        "pass_refund",
        p.id,
        `${p.type} pass refund`,
        p.user.email,
        "refunded",
        (-p.price).toFixed(2),
        "",
        "",
        "",
        "",
        p.stripePaymentId ?? ""
      )
    );
  }

  for (const t of refundedTickets) {
    lines.push(
      row(
        (t.refundedAt ?? t.updatedAt).toISOString(),
        "ticket_refund",
        t.id,
        `${t.event.name} refund`,
        t.user.email,
        "refunded",
        (-t.pricePaid).toFixed(2),
        "",
        "",
        "",
        "",
        t.stripePaymentId ?? ""
      )
    );
  }

  const csv = lines.join("\n") + "\n";
  const filename = `volume-accounting-${period ? period.from.toISOString().slice(0, 10) + "-" + period.to.toISOString().slice(0, 10) : "all-time"}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
