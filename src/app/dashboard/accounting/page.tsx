import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" });

function truncateId(id: string) {
  return id.slice(0, 8) + "...";
}

export default async function AccountingDashboardPage() {
  const [
    totalSales,
    revenueAgg,
    clubs,
    museums,
    clubScanCounts,
    museumScanCounts,
    recentScans,
    ticketTotalRevenueAgg,
    ticketClubPayoutAgg,
    refundedPassAgg,
    refundedTicketAgg,
  ] = await Promise.all([
    // Net sales count — excludes refunded rows, same as every revenue
    // line on this page. Refunds reverse the transaction for Volume's
    // books, but club/museum payouts below are left intact because the
    // venue still provided service.
    db.pass.count({ where: { status: { not: "refunded" } } }),
    db.pass.aggregate({
      where: { status: { not: "refunded" } },
      _sum: { price: true },
    }),
    db.club.findMany(),
    db.museum.findMany(),
    db.passScan.groupBy({
      by: ["clubId"],
      where: { clubId: { not: null } },
      _count: { id: true },
    }),
    db.passScan.groupBy({
      by: ["museumId"],
      where: { museumId: { not: null } },
      _count: { id: true },
    }),
    db.passScan.findMany({
      take: 100,
      orderBy: { scannedAt: "desc" },
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
    // Net ticket revenue — excludes refunded.
    db.ticket.aggregate({
      where: { status: { not: "refunded" } },
      _sum: { pricePaid: true },
    }),
    // Club ticket payout — intentionally does NOT exclude refunded
    // tickets. Once a ticket has been validated at the door the club
    // earned that money; a later refund is absorbed by Volume, not
    // clawed back from the club.
    db.ticket.aggregate({
      where: { validatedAt: { not: null }, event: { clubId: { not: null } } },
      _sum: { pricePaid: true },
    }),
    // Refund totals — informational, for the "Refunds Issued" card.
    // These are rows where status = "refunded" and represent money
    // that actually left Volume via Stripe (or would have, for free
    // guest/giveaway sources). Pass.price and Ticket.pricePaid
    // respectively hold the refund amount because that's what was
    // originally paid.
    db.pass.aggregate({
      where: { status: "refunded" },
      _sum: { price: true },
      _count: { id: true },
    }),
    db.ticket.aggregate({
      where: { status: "refunded" },
      _sum: { pricePaid: true },
      _count: { id: true },
    }),
  ]);

  const totalPassRevenue = revenueAgg._sum.price ?? 0;
  const totalTicketRevenue = ticketTotalRevenueAgg._sum.pricePaid ?? 0;
  const totalRevenue = totalPassRevenue + totalTicketRevenue;

  // Refund totals (informational)
  const passRefundAmount = refundedPassAgg._sum.price ?? 0;
  const passRefundCount = refundedPassAgg._count.id ?? 0;
  const ticketRefundAmount = refundedTicketAgg._sum.pricePaid ?? 0;
  const ticketRefundCount = refundedTicketAgg._count.id ?? 0;
  const totalRefundAmount = passRefundAmount + ticketRefundAmount;
  const totalRefundCount = passRefundCount + ticketRefundCount;

  // Club payouts from pass scans
  const clubMap = new Map(clubs.map((c) => [c.id, c]));
  const totalClubPassPayouts = clubScanCounts.reduce((sum, s) => {
    const club = clubMap.get(s.clubId!);
    return sum + (club ? s._count.id * club.payPerVisit : 0);
  }, 0);

  // Club payouts from validated tickets (100% of pricePaid goes to club)
  const totalClubTicketPayouts = ticketClubPayoutAgg._sum.pricePaid ?? 0;

  const totalClubPayouts = totalClubPassPayouts + totalClubTicketPayouts;

  // Museum payouts
  const museumMap = new Map(museums.map((m) => [m.id, m]));
  const totalMuseumPayouts = museumScanCounts.reduce((sum, s) => {
    const museum = museumMap.get(s.museumId!);
    return sum + (museum ? s._count.id * museum.payPerVisit : 0);
  }, 0);

  const platformRevenue = totalRevenue - totalClubPayouts - totalMuseumPayouts;

  const stats = [
    { label: "Total Sales", value: totalSales.toLocaleString() },
    { label: "Pass Revenue", value: eur.format(totalPassRevenue) },
    { label: "Ticket Revenue", value: eur.format(totalTicketRevenue) },
    { label: "Total Revenue", value: eur.format(totalRevenue) },
    { label: "Club Payouts", value: eur.format(totalClubPayouts) },
    { label: "Museum Payouts", value: eur.format(totalMuseumPayouts) },
    { label: "Platform Revenue", value: eur.format(platformRevenue) },
    {
      label: "Refunds Issued",
      value: eur.format(totalRefundAmount),
      sublabel: `${totalRefundCount} refund${totalRefundCount === 1 ? "" : "s"}`,
      accent: "red" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Accounting Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {stats.map((s) => {
          const accent =
            "accent" in s && s.accent === "red"
              ? "border-red-200 bg-red-50/40"
              : "border-gray-200 bg-white";
          const valueColor =
            "accent" in s && s.accent === "red" ? "text-red-700" : "text-gray-900";
          const sublabel = "sublabel" in s ? s.sublabel : undefined;
          return (
            <div
              key={s.label}
              className={`rounded-lg border p-5 ${accent}`}
            >
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${valueColor}`}>
                {s.value}
              </p>
              {sublabel && (
                <p className="text-xs text-gray-400 mt-1">{sublabel}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail table */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Transaction Details</h2>
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
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
