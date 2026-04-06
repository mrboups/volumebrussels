import { db } from "@/lib/db";
import Link from "next/link";
import { deleteClub, updateSortOrder } from "../_actions";
import DeleteButton from "../_components/DeleteButton";
import InlineOrder from "../_components/InlineOrder";

export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" });

function dayBadge(day: string) {
  const labels: Record<string, string> = { friday: "Fri", saturday: "Sat", sunday: "Sun" };
  return labels[day] ?? day;
}

export default async function ClubsPage() {
  const clubs = await db.club.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clubs</h1>
        <Link
          href="/dashboard/admin/clubs/new"
          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
        >
          Add Club
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-3 py-3 font-medium w-16">Order</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Address</th>
              <th className="px-4 py-3 font-medium">Open Days</th>
              <th className="px-4 py-3 font-medium">Pay/Visit</th>
              <th className="px-4 py-3 font-medium">Music Tags</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map((club) => (
              <tr key={club.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-3 py-3">
                  <InlineOrder id={club.id} type="club" value={club.sortOrder} action={updateSortOrder} />
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{club.name}</td>
                <td className="px-4 py-3 text-gray-600">{club.address}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {club.openDays.map((d) => (
                      <span
                        key={d}
                        className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                      >
                        {dayBadge(d)}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{eur.format(club.payPerVisit)}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {club.musicTags.join(", ") || "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                      club.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {club.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/dashboard/admin/clubs/${club.id}/edit`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </Link>
                    <DeleteButton action={deleteClub.bind(null, club.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {clubs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                  No clubs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Link
        href="/dashboard/admin"
        className="inline-block text-sm text-gray-500 hover:text-black"
      >
        &larr; Back to Admin
      </Link>
    </div>
  );
}
