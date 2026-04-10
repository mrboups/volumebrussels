import { db } from "@/lib/db";
import PassGroup from "../admin/_components/PassGroup";
import SearchBar from "../_components/SearchBar";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 500;

export default async function PassesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const where = query
    ? {
        OR: [
          { user: { email: { contains: query, mode: "insensitive" as const } } },
          {
            user: { name: { contains: query, mode: "insensitive" as const } },
          },
          { stripePaymentId: { contains: query, mode: "insensitive" as const } },
          { id: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [totalCount, passes] = await Promise.all([
    db.pass.count({ where }),
    db.pass.findMany({
      where,
      take: PAGE_SIZE,
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
  ]);

  // Group passes by stripePaymentId (same grouping as admin dashboard)
  const groupMap = new Map<string, typeof passes>();
  let ungroupedIdx = 0;
  for (const pass of passes) {
    const key = pass.stripePaymentId ?? `__solo_${ungroupedIdx++}`;
    const group = groupMap.get(key);
    if (group) {
      group.push(pass);
    } else {
      groupMap.set(key, [pass]);
    }
  }
  const passGroups = Array.from(groupMap.values());

  const serializedGroups = passGroups.map((group) =>
    group.map((pass) => ({
      ...pass,
      createdAt: pass.createdAt.toISOString(),
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Passes</h1>
        <p className="text-sm text-gray-500 mt-1">
          All passes ever sold, gifted or claimed. Search by email, payment ID,
          or customer name.
        </p>
      </div>

      <SearchBar placeholder="Search passes by email, payment ID, name..." />

      <p className="text-xs text-gray-500">
        Showing <strong>{passes.length}</strong>
        {query ? " of " : " of "}
        <strong>{totalCount}</strong> pass{totalCount === 1 ? "" : "es"}
        {passes.length < totalCount && ` — refine your search to narrow down`}.
      </p>

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
            {passes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  {query ? `No passes match "${query}".` : "No passes found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
