import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" });

function truncateId(id: string) {
  return id.slice(0, 8) + "...";
}

export default async function ClubDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // If magic link token, filter to that club only
  let clubFilter: { id?: string } = {};
  if (token) {
    const account = await db.clubAccount.findFirst({
      where: { magicLinkToken: token },
    });
    if (account) {
      clubFilter = { id: account.clubId };
    }
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Calculate completed quarters for quarterly reports
  const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
  const currentYear = now.getFullYear();
  const completedQuarters: { quarter: number; year: number; label: string }[] = [];
  const quarterLabels: Record<number, string> = {
    1: "Jan - Mar",
    2: "Apr - Jun",
    3: "Jul - Sep",
    4: "Oct - Dec",
  };
  // Go back up to 8 quarters
  for (let i = 0; i < 8; i++) {
    let q = currentQuarter - 1 - i;
    let y = currentYear;
    while (q <= 0) { q += 4; y -= 1; }
    completedQuarters.push({
      quarter: q,
      year: y,
      label: `Q${q} ${y} (${quarterLabels[q]})`,
    });
  }

  const clubWhere = clubFilter.id ? { id: clubFilter.id } : {};
  const scanClubFilter = clubFilter.id ? { clubId: clubFilter.id } : { clubId: { not: null as string | null } };

  const [clubs, visitsThisMonth, visitsAllTime, recentScans] = await Promise.all([
    db.club.findMany({ where: clubWhere, orderBy: { sortOrder: "asc" } }),
    db.passScan.count({
      where: { ...scanClubFilter, scannedAt: { gte: startOfMonth } },
    }),
    db.passScan.count({ where: scanClubFilter }),
    db.passScan.findMany({
      take: 50,
      where: scanClubFilter,
      orderBy: { scannedAt: "desc" },
      include: {
        club: { select: { name: true } },
        pass: { select: { type: true } },
      },
    }),
  ]);

  // Revenue by club: we need scans-per-club this month
  const clubScanCounts = await db.passScan.groupBy({
    by: ["clubId"],
    where: scanClubFilter,
    _count: { id: true },
  });

  const clubScanCountsThisMonth = await db.passScan.groupBy({
    by: ["clubId"],
    where: { ...scanClubFilter, scannedAt: { gte: startOfMonth } },
    _count: { id: true },
  });

  const clubMap = new Map(clubs.map((c) => [c.id, c]));

  const revenueByClub = clubs.map((club) => {
    const allTime = clubScanCounts.find((s) => s.clubId === club.id)?._count.id ?? 0;
    const thisMonth = clubScanCountsThisMonth.find((s) => s.clubId === club.id)?._count.id ?? 0;
    return {
      name: club.name,
      totalVisits: allTime,
      visitsThisMonth: thisMonth,
      revenueAllTime: allTime * club.payPerVisit,
      revenueThisMonth: thisMonth * club.payPerVisit,
    };
  });

  // Quarterly report data
  const quarterlyData = await Promise.all(
    completedQuarters.map(async ({ quarter, year, label }) => {
      const startMonth = (quarter - 1) * 3;
      const startDate = new Date(year, startMonth, 1);
      const endDate = new Date(year, startMonth + 3, 1);

      const visits = await db.passScan.count({
        where: {
          ...scanClubFilter,
          scannedAt: { gte: startDate, lt: endDate },
        },
      });

      const revenuePerClub = clubs.map((club) => club.payPerVisit);
      // For single club, use its rate; for all clubs, approximate
      const avgRate = clubs.length > 0
        ? clubs.reduce((sum, c) => sum + c.payPerVisit, 0) / clubs.length
        : 10;

      return {
        label,
        visits,
        revenue: visits * avgRate,
      };
    })
  );

  const totalRevenueThisMonth = revenueByClub.reduce((sum, c) => sum + c.revenueThisMonth, 0);

  const stats = [
    { label: "Visits This Month", value: visitsThisMonth.toLocaleString() },
    { label: "Revenue This Month", value: eur.format(totalRevenueThisMonth) },
    { label: "Total Visits All Time", value: visitsAllTime.toLocaleString() },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Club Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue by Club */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Revenue by Club</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Club Name</th>
                <th className="px-4 py-3 font-medium">Visits (Month)</th>
                <th className="px-4 py-3 font-medium">Revenue (Month)</th>
                <th className="px-4 py-3 font-medium">Total Visits</th>
                <th className="px-4 py-3 font-medium">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {revenueByClub.map((row) => (
                <tr key={row.name} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                  <td className="px-4 py-3 text-gray-600">{row.visitsThisMonth}</td>
                  <td className="px-4 py-3 text-gray-600">{eur.format(row.revenueThisMonth)}</td>
                  <td className="px-4 py-3 text-gray-600">{row.totalVisits}</td>
                  <td className="px-4 py-3 text-gray-600">{eur.format(row.revenueAllTime)}</td>
                </tr>
              ))}
              {revenueByClub.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    No clubs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Visits */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Visits</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Club</th>
                <th className="px-4 py-3 font-medium">Pass Type</th>
                <th className="px-4 py-3 font-medium">Pass ID</th>
              </tr>
            </thead>
            <tbody>
              {recentScans.map((scan) => (
                <tr key={scan.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">
                    {scan.scannedAt.toLocaleDateString("fr-BE")}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {scan.club?.name ?? "Unknown"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 rounded">
                      {scan.pass.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {truncateId(scan.passId)}
                  </td>
                </tr>
              ))}
              {recentScans.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                    No visits found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quarterly Reports */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quarterly Reports</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Visits</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {quarterlyData.map((row) => (
                <tr key={row.label} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.label}</td>
                  <td className="px-4 py-3 text-gray-600">{row.visits}</td>
                  <td className="px-4 py-3 text-gray-600">{eur.format(row.revenue)}</td>
                </tr>
              ))}
              {quarterlyData.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                    No completed quarters yet.
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
