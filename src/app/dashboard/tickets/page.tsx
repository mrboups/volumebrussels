import { db } from "@/lib/db";
import Link from "next/link";
import TicketActions from "../admin/_components/TicketActions";
import SearchBar from "../_components/SearchBar";
import { formatBrusselsDate } from "@/lib/tz";

export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" });
const PAGE_SIZE = 500;

export default async function TicketsDashboardPage({
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
          { user: { name: { contains: query, mode: "insensitive" as const } } },
          { event: { name: { contains: query, mode: "insensitive" as const } } },
          { stripePaymentId: { contains: query, mode: "insensitive" as const } },
          { id: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [totalCount, tickets] = await Promise.all([
    db.ticket.count({ where }),
    db.ticket.findMany({
      where,
      take: PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true } },
        event: {
          select: {
            name: true,
            date: true,
            club: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
        <p className="text-sm text-gray-500 mt-1">
          All event tickets ever sold. Search by email, event, payment ID or
          customer name.
        </p>
      </div>

      <SearchBar placeholder="Search tickets by email, event, payment ID..." />

      <p className="text-xs text-gray-500">
        Showing <strong>{tickets.length}</strong> of{" "}
        <strong>{totalCount}</strong> ticket{totalCount === 1 ? "" : "s"}
        {tickets.length < totalCount && ` — refine your search to narrow down`}.
      </p>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">Event Date</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Validated</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => {
              const statusColors =
                ticket.status === "used"
                  ? "bg-green-50 text-green-700"
                  : ticket.status === "expired"
                  ? "bg-gray-100 text-gray-500"
                  : ticket.status === "refunded"
                  ? "bg-red-50 text-red-700"
                  : "bg-blue-50 text-blue-700";
              return (
                <tr
                  key={ticket.id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-gray-600">
                    {formatBrusselsDate(ticket.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {ticket.event.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatBrusselsDate(ticket.event.date)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {eur.format(ticket.pricePaid)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${statusColors}`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {ticket.validatedAt ? (
                      <span className="text-green-700">
                        {formatBrusselsDate(ticket.validatedAt)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {ticket.user.email}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/ticket/${ticket.id}`}
                        target="_blank"
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        View
                      </Link>
                      <TicketActions
                        ticketId={ticket.id}
                        currentEmail={ticket.user.email}
                        isValidated={ticket.validatedAt !== null}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                  {query ? `No tickets match "${query}".` : "No tickets found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
