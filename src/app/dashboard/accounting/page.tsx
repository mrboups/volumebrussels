import { db } from "@/lib/db";
import Link from "next/link";
import {
  parsePeriod,
  formatPeriodLabel,
  standardPeriodChoices,
  prismaPeriodFilter,
  type Period,
} from "@/lib/period";
import { computeClubTicketFee, parseTiers, resellerCommission } from "@/lib/pricing";
import PeriodSelector from "../_components/PeriodSelector";

export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("fr-BE", {
  style: "currency",
  currency: "EUR",
});

function truncateId(id: string) {
  return id.slice(0, 8) + "...";
}

export default async function AccountingDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const plain: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") plain[k] = v;
  }
  const period: Period = parsePeriod(plain);
  const dateRange = prismaPeriodFilter(period);

  // Filters for "sales created in period" vs "refunded in period" vs
  // "scanned in period" vs "validated in period".
  const createdAtFilter = dateRange ? { createdAt: dateRange } : {};
  const scannedAtFilter = dateRange ? { scannedAt: dateRange } : {};
  const validatedAtFilter = dateRange
    ? { validatedAt: dateRange }
    : { validatedAt: { not: null } };
  const refundedAtFilter = dateRange
    ? { refundedAt: dateRange }
    : { refundedAt: { not: null } };

  const [
    clubs,
    museums,
    // --- SALES IN PERIOD (gross, not filtering refunds yet) ---
    passesInPeriod,
    ticketsInPeriod,
    // --- PAYOUTS IN PERIOD ---
    clubScanCounts,
    museumScanCounts,
    clubPayoutTickets,
    // --- REFUNDS IN PERIOD (by refundedAt) ---
    refundedPassesInPeriod,
    refundedTicketsInPeriod,
    // --- DETAIL TABLE ---
    recentScans,
  ] = await Promise.all([
    db.club.findMany(),
    db.museum.findMany(),

    // Passes whose createdAt is in the period
    db.pass.findMany({
      where: createdAtFilter,
      select: {
        id: true,
        price: true,
        stripeFee: true,
        status: true,
        stripePaymentId: true,
        resellerId: true,
        reseller: { select: { passCommissionTiers: true } },
      },
    }),
    // Tickets whose createdAt is in the period
    db.ticket.findMany({
      where: createdAtFilter,
      select: {
        id: true,
        pricePaid: true,
        stripeFee: true,
        status: true,
        stripePaymentId: true,
        resellerId: true,
        reseller: { select: { ticketCommissionTiers: true } },
      },
    }),

    // Pass scans in period — scan-based club/museum payout
    db.passScan.groupBy({
      by: ["clubId"],
      where: { clubId: { not: null }, ...scannedAtFilter },
      _count: { id: true },
    }),
    db.passScan.groupBy({
      by: ["museumId"],
      where: { museumId: { not: null }, ...scannedAtFilter },
      _count: { id: true },
    }),
    // Tickets validated in period → club ticket revenue
    db.ticket.findMany({
      where: {
        ...validatedAtFilter,
        event: { clubId: { not: null } },
      },
      select: {
        pricePaid: true,
        event: { select: { clubTicketFee: true } },
      },
    }),

    // Passes refunded in period
    db.pass.findMany({
      where: { status: "refunded", ...refundedAtFilter },
      select: { price: true, stripeFee: true },
    }),
    // Tickets refunded in period
    db.ticket.findMany({
      where: { status: "refunded", ...refundedAtFilter },
      select: { pricePaid: true, stripeFee: true },
    }),

    // Last 100 scans for the detail table
    db.passScan.findMany({
      take: 100,
      orderBy: { scannedAt: "desc" },
      where: scannedAtFilter,
      include: {
        club: { select: { name: true, payPerVisit: true } },
        museum: { select: { name: true, payPerVisit: true } },
        pass: {
          select: {
            type: true,
            price: true,
            user: { select: { email: true } },
          },
        },
      },
    }),
  ]);

  // ---------- Gross revenue (in period) ----------
  // Note: this is GROSS — refunds live in their own line below, so a
  // pass that was sold this quarter and refunded next quarter shows up
  // in Q1 gross and Q2 refunds.
  const grossPassRevenue = passesInPeriod.reduce((s, p) => s + p.price, 0);
  const grossTicketRevenue = ticketsInPeriod.reduce((s, t) => s + t.pricePaid, 0);
  const grossTotalRevenue = grossPassRevenue + grossTicketRevenue;

  const passCount = passesInPeriod.length;
  const ticketCount = ticketsInPeriod.length;

  // ---------- Payouts (in period) ----------
  const clubMap = new Map(clubs.map((c) => [c.id, c]));
  const museumMap = new Map(museums.map((m) => [m.id, m]));

  const totalClubPassPayouts = clubScanCounts.reduce((sum, s) => {
    const club = clubMap.get(s.clubId!);
    return sum + (club ? s._count.id * club.payPerVisit : 0);
  }, 0);

  const totalMuseumPayouts = museumScanCounts.reduce((sum, s) => {
    const museum = museumMap.get(s.museumId!);
    return sum + (museum ? s._count.id * museum.payPerVisit : 0);
  }, 0);

  // Club payouts from validated tickets: formula per row
  const totalClubTicketPayouts = clubPayoutTickets.reduce(
    (sum, t) => sum + computeClubTicketFee(t.pricePaid, t.event),
    0
  );
  const totalClubPayouts = totalClubPassPayouts + totalClubTicketPayouts;

  // Reseller commission — computed per-row from the reseller's tier
  // config. Only counts sales with a valid reseller attribution. Refund
  // rows get zero commission (reseller doesn't earn on reversed sales).
  const resellerPassCommission = passesInPeriod.reduce((sum, p) => {
    if (p.status === "refunded") return sum;
    if (!p.resellerId) return sum;
    return sum + resellerCommission(p.price, parseTiers(p.reseller?.passCommissionTiers));
  }, 0);
  const resellerTicketCommission = ticketsInPeriod.reduce((sum, t) => {
    if (t.status === "refunded") return sum;
    if (!t.resellerId) return sum;
    return (
      sum + resellerCommission(t.pricePaid, parseTiers(t.reseller?.ticketCommissionTiers))
    );
  }, 0);
  const totalResellerCommission = resellerPassCommission + resellerTicketCommission;

  // ---------- Fees (in period) ----------
  const stripeFeePasses = passesInPeriod.reduce(
    (s, p) => s + (p.stripeFee ?? 0),
    0
  );
  const stripeFeeTickets = ticketsInPeriod.reduce(
    (s, t) => s + (t.stripeFee ?? 0),
    0
  );
  const totalStripeFees = stripeFeePasses + stripeFeeTickets;
  const hasNullStripeFees =
    passesInPeriod.some((p) => p.stripeFee === null) ||
    ticketsInPeriod.some((t) => t.stripeFee === null);

  // ---------- Refunds (in period by refundedAt) ----------
  const refundPassAmount = refundedPassesInPeriod.reduce(
    (s, p) => s + p.price,
    0
  );
  const refundTicketAmount = refundedTicketsInPeriod.reduce(
    (s, t) => s + t.pricePaid,
    0
  );
  const totalRefunds = refundPassAmount + refundTicketAmount;
  const refundCount =
    refundedPassesInPeriod.length + refundedTicketsInPeriod.length;

  // ---------- Platform Net ----------
  // Formula: gross revenue in period
  //          minus refunds issued in period
  //          minus club and museum payouts in period
  //          minus reseller commission in period
  //          minus Stripe fees in period
  const platformNet =
    grossTotalRevenue -
    totalRefunds -
    totalClubPayouts -
    totalMuseumPayouts -
    totalResellerCommission -
    totalStripeFees;

  const periodLabel = formatPeriodLabel(period);
  const exportParams = new URLSearchParams();
  for (const [k, v] of Object.entries(plain)) {
    if (v !== undefined) exportParams.set(k, v);
  }

  const revenueStats = [
    { label: `Pass Revenue`, value: eur.format(grossPassRevenue), sub: `${passCount} pass${passCount === 1 ? "" : "es"}` },
    { label: `Ticket Revenue`, value: eur.format(grossTicketRevenue), sub: `${ticketCount} ticket${ticketCount === 1 ? "" : "s"}` },
    { label: "Total Revenue", value: eur.format(grossTotalRevenue), sub: "gross" },
  ];

  const payoutStats = [
    { label: "Club Payouts", value: eur.format(totalClubPayouts) },
    { label: "Museum Payouts", value: eur.format(totalMuseumPayouts) },
    { label: "Reseller Commission", value: eur.format(totalResellerCommission) },
  ];

  const feeStats = [
    {
      label: "Stripe Fees",
      value: eur.format(totalStripeFees),
      sub: hasNullStripeFees ? "partial — older rows have no stored fee" : undefined,
    },
    {
      label: "Refunds Issued",
      value: eur.format(totalRefunds),
      sub: `${refundCount} refund${refundCount === 1 ? "" : "s"}`,
      accent: "red" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounting Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Period: {periodLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/api/export/accounting?${exportParams.toString()}`}
            className="inline-flex items-center gap-1.5 bg-black text-white text-xs font-semibold uppercase tracking-wide px-3 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            Export CSV
          </Link>
        </div>
      </div>

      <PeriodSelector choices={standardPeriodChoices()} />

      {/* Revenue */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Revenue (gross)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {revenueStats.map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
              {s.sub && <p className="text-xs text-gray-400 mt-1">{s.sub}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Payouts */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Payouts (out of Volume)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {payoutStats.map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fees + Refunds */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Fees and refunds
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {feeStats.map((s) => {
            const accent =
              "accent" in s && s.accent === "red"
                ? "border-red-200 bg-red-50/40"
                : "border-gray-200 bg-white";
            const valueColor =
              "accent" in s && s.accent === "red" ? "text-red-700" : "text-gray-900";
            return (
              <div key={s.label} className={`rounded-lg border p-5 ${accent}`}>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${valueColor}`}>{s.value}</p>
                {s.sub && <p className="text-xs text-gray-400 mt-1">{s.sub}</p>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Platform Net */}
      <section>
        <div className="bg-gray-900 text-white rounded-lg p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Platform Net
          </p>
          <p className="text-4xl font-extrabold mt-2">{eur.format(platformNet)}</p>
          <p className="text-xs text-gray-400 mt-3">
            Gross {eur.format(grossTotalRevenue)} − Refunds {eur.format(totalRefunds)} −
            Club {eur.format(totalClubPayouts)} − Museum {eur.format(totalMuseumPayouts)} −
            Reseller {eur.format(totalResellerCommission)} −
            Stripe {eur.format(totalStripeFees)}
          </p>
        </div>
      </section>

      {/* Detail table */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Scan detail ({recentScans.length})
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Venue</th>
                <th className="px-4 py-3 font-medium">Pass Price</th>
                <th className="px-4 py-3 font-medium">Fee (Pay/Visit)</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              {recentScans.map((scan) => {
                const venueName = scan.club?.name ?? scan.museum?.name ?? "Unknown";
                const fee = scan.club?.payPerVisit ?? scan.museum?.payPerVisit ?? 0;
                return (
                  <tr key={scan.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">
                      {scan.scannedAt.toLocaleDateString("fr-BE")}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{venueName}</td>
                    <td className="px-4 py-3 text-gray-600">{eur.format(scan.pass.price)}</td>
                    <td className="px-4 py-3 text-gray-600">{eur.format(fee)}</td>
                    <td className="px-4 py-3 text-gray-600">{scan.pass.user.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 rounded">
                        {scan.pass.type}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {recentScans.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                    No scans in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footnote (ref the unused helper to satisfy TS strict) */}
      <p className="sr-only">{truncateId("")}</p>
    </div>
  );
}
