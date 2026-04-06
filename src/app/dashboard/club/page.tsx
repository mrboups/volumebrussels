import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" });

function truncateId(id: string) {
  return id.slice(0, 8) + "...";
}

export default async function ClubDashboardPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [clubs, visitsThisMonth, visitsAllTime, recentScans] = await Promise.all([
    db.club.findMany({ orderBy: { name: "asc" } }),
    db.passScan.count({
      where: { clubId: { not: null }, scannedAt: { gte: startOfMonth } },
    }),
    db.passScan.count({ where: { clubId: { not: null } } }),
    db.passScan.findMany({
      take: 50,
      where: { clubId: { not: null } },
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
    where: { clubId: { not: null } },
    _count: { id: true },
  });

  const clubScanCountsThisMonth = await db.passScan.groupBy({
    by: ["clubId"],
    where: { clubId: { not: null }, scannedAt: { gte: startOfMonth } },
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
    </div>
  );
}
