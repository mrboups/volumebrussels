import { db } from "@/lib/db";
import Link from "next/link";
import PassActions from "./_components/PassActions";

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
    db.pass.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true } }, _count: { select: { scans: true } } },
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
              {recentPasses.map((pass) => (
                <tr key={pass.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">
                    {pass.createdAt.toLocaleDateString("fr-BE")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 rounded">
                      {pass.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{eur.format(pass.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                        pass.status === "active"
                          ? "bg-green-50 text-green-700"
                          : pass.status === "expired"
                          ? "bg-gray-100 text-gray-500"
                          : pass.status === "refunded"
                          ? "bg-red-50 text-red-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {pass.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{pass.user.email}</td>
                  <td className="px-4 py-3 text-gray-600">{pass._count.scans}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/pass/${pass.id}`}
                        target="_blank"
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        View
                      </Link>
                      <PassActions passId={pass.id} currentEmail={pass.user.email} />
                    </div>
                  </td>
                </tr>
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
