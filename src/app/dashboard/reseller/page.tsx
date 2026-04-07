import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" });

export default async function ResellerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // If magic link token, filter to that reseller only
  let resellerFilter: { resellerId?: string } = {};
  if (token) {
    const reseller = await db.reseller.findFirst({
      where: { magicLinkToken: token, isActive: true },
    });
    if (reseller) {
      resellerFilter = { resellerId: reseller.id };
    }
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentHalf = now.getMonth() < 6 ? 1 : 2;

  // Calculate completed half-years (up to 4)
  const completedHalves: { half: number; year: number; label: string }[] = [];
  for (let i = 0; i < 4; i++) {
    let h = currentHalf - 1 - i;
    let y = currentYear;
    while (h <= 0) { h += 2; y -= 1; }
    const halfLabel = h === 1 ? "Jan - Jun" : "Jul - Dec";
    completedHalves.push({
      half: h,
      year: y,
      label: `H${h} ${y} (${halfLabel})`,
    });
  }

  const resellerPasses = await db.pass.findMany({
    where: resellerFilter.resellerId
      ? { resellerId: resellerFilter.resellerId }
      : { resellerId: { not: null } },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
      reseller: { select: { commissionRate: true } },
    },
  });

  const totalSales = resellerPasses.length;
  const totalFees = resellerPasses.reduce(
    (sum, p) => sum + p.price * (p.reseller?.commissionRate ?? 0.08),
    0
  );

  // Calculate half-year report data
  const resellerId = resellerFilter.resellerId;
  const halfYearData = await Promise.all(
    completedHalves.map(async ({ half, year, label }) => {
      const startMonth = half === 1 ? 0 : 6;
      const startDate = new Date(year, startMonth, 1);
      const endDate = new Date(year, startMonth + 6, 1);

      const passes = await db.pass.findMany({
        where: {
          ...(resellerId ? { resellerId } : { resellerId: { not: null } }),
          createdAt: { gte: startDate, lt: endDate },
        },
        select: { price: true, reseller: { select: { commissionRate: true } } },
      });

      const salesCount = passes.length;
      const commission = passes.reduce(
        (sum, p) => sum + p.price * (p.reseller?.commissionRate ?? 0.08),
        0
      );

      return { label, salesCount, commission };
    })
  );

  const stats = [
    { label: "Total Sales", value: totalSales.toLocaleString() },
    { label: "Total Fees", value: eur.format(totalFees) },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Reseller Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Sales Detail</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Pass Type</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Fee (8%)</th>
                <th className="px-4 py-3 font-medium">Customer</th>
              </tr>
            </thead>
            <tbody>
              {resellerPasses.map((p) => {
                const rate = p.reseller?.commissionRate ?? 0.08;
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">
                      {p.createdAt.toLocaleDateString("fr-BE")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 rounded">
                        {p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{eur.format(p.price)}</td>
                    <td className="px-4 py-3 text-gray-600">{eur.format(p.price * rate)}</td>
                    <td className="px-4 py-3 text-gray-600">{p.user.email}</td>
                  </tr>
                );
              })}
              {resellerPasses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    No reseller sales found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Half-Year Reports */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Half-Year Reports</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Sales Count</th>
                <th className="px-4 py-3 font-medium">Commission Earned</th>
              </tr>
            </thead>
            <tbody>
              {halfYearData.map((row) => (
                <tr key={row.label} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.label}</td>
                  <td className="px-4 py-3 text-gray-600">{row.salesCount}</td>
                  <td className="px-4 py-3 text-gray-600">{eur.format(row.commission)}</td>
                </tr>
              ))}
              {halfYearData.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                    No completed half-year periods yet.
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
