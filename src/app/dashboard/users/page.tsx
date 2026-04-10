import { db } from "@/lib/db";
import SearchBar from "../_components/SearchBar";
import UserRow from "./UserRow";
import { formatBrusselsDate } from "@/lib/tz";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 300;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const where = query
    ? {
        OR: [
          { email: { contains: query, mode: "insensitive" as const } },
          { name: { contains: query, mode: "insensitive" as const } },
          { id: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [totalCount, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      include: {
        passes: {
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { scans: true } },
          },
        },
        tickets: {
          orderBy: { createdAt: "desc" },
          include: {
            event: {
              select: {
                name: true,
                date: true,
                club: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  // Serialize for client component
  const serializedUsers = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as string,
    createdAt: u.createdAt.toISOString(),
    passes: u.passes.map((p) => ({
      id: p.id,
      type: p.type as string,
      price: p.price,
      status: p.status as string,
      stripePaymentId: p.stripePaymentId,
      createdAt: p.createdAt.toISOString(),
      scanCount: p._count.scans,
    })),
    tickets: u.tickets.map((t) => ({
      id: t.id,
      eventName: t.event.name,
      clubName: t.event.club?.name ?? null,
      eventDate: formatBrusselsDate(t.event.date),
      pricePaid: t.pricePaid,
      status: t.status as string,
      validatedAt: t.validatedAt ? t.validatedAt.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-1">
          All users with their purchase history. Click a row to expand.
        </p>
      </div>

      <SearchBar placeholder="Search users by email, name, or ID..." />

      <p className="text-xs text-gray-500">
        Showing <strong>{users.length}</strong> of{" "}
        <strong>{totalCount}</strong> user{totalCount === 1 ? "" : "s"}
        {users.length < totalCount && ` — refine your search to narrow down`}.
      </p>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-4 py-3 font-medium w-8"></th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Passes</th>
              <th className="px-4 py-3 font-medium">Tickets</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {serializedUsers.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  {query ? `No users match "${query}".` : "No users found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
