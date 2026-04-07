import { db } from "@/lib/db";
import Link from "next/link";
import PassGroup from "./_components/PassGroup";

export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" });

function truncateId(id: string) {
  return id.slice(0, 8) + "...";
}

export default async function AdminDashboardPage() {
  const [
    totalPasses,
    revenueAgg,
    activePasses,
    totalScans,
    clubCount,
    museumCount,
    eventCount,
    articleCount,
    resellerCount,
    recentPasses,
    recentScans,
  ] = await Promise.all([
    db.pass.count(),
    db.pass.aggregate({ _sum: { price: true } }),
    db.pass.count({ where: { status: "active" } }),
    db.passScan.count(),
    db.club.count(),
    db.museum.count(),
    db.event.count(),
    db.article.count(),
    db.reseller.count(),
    db.pass.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        type: true,
        price: true,
        status: true,
        stripePaymentId: true,
        user: { select: { email: true } },
        _count: { select: { scans: true } },
      },
    }),
    db.passScan.findMany({
      take: 20,
      orderBy: { scannedAt: "desc" },
      include: {
        club: { select: { name: true } },
        museum: { select: { name: true } },
      },
    }),
  ]);

  const totalRevenue = revenueAgg._sum.price ?? 0;

  // Group passes by stripePaymentId
  const groupMap = new Map<string, typeof recentPasses>();
  let ungroupedIdx = 0;
  for (const pass of recentPasses) {
    const key = pass.stripePaymentId ?? `__solo_${ungroupedIdx++}`;
    const group = groupMap.get(key);
    if (group) {
      group.push(pass);
    } else {
      groupMap.set(key, [pass]);
    }
  }
  const passGroups = Array.from(groupMap.values());

  // Serialize dates for client component
  const serializedGroups = passGroups.map((group) =>
    group.map((pass) => ({
      ...pass,
      createdAt: pass.createdAt.toISOString(),
    }))
  );

  const stats = [
    { label: "Total Passes Sold", value: totalPasses.toLocaleString() },
    { label: "Total Revenue", value: eur.format(totalRevenue) },
    { label: "Active Passes", value: activePasses.toLocaleString() },
    { label: "Total Check-ins", value: totalScans.toLocaleString() },
  ];

  const quickLinks = [
    { href: "/dashboard/admin/clubs", label: "Manage Clubs", count: clubCount },
    { href: "/dashboard/admin/museums", label: "Manage Museums", count: museumCount },
    { href: "/dashboard/admin/events", label: "Manage Events", count: eventCount },
    { href: "/dashboard/admin/articles", label: "Manage Articles", count: articleCount },
    { href: "/dashboard/admin/resellers", label: "Manage Resellers", count: resellerCount },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:border-black transition-colors group"
            >
              <p className="text-sm font-semibold text-gray-900 group-hover:text-black">
                {link.label}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{link.count}</p>
              <p className="text-xs text-gray-400 mt-1">Click to manage &rarr;</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Passes */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Passes</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Scans</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {serializedGroups.map((group) => (
                <PassGroup key={group[0].id} passes={group} />
              ))}
              {recentPasses.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                    No passes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Scans */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Scans</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Venue</th>
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
                    {scan.club?.name ?? scan.museum?.name ?? "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {truncateId(scan.passId)}
                  </td>
                </tr>
              ))}
              {recentScans.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                    No scans found.
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
